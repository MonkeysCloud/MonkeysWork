<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\ProposalAccepted;
use App\Event\ProposalSubmitted;
use App\Service\EmailNotificationService;
use App\Service\FeatureFlagService;
use App\Service\PubSubPublisher;
use App\Validator\ProposalValidator;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;
use App\Enum\RegionEnum;

#[RoutePrefix('/api/v1/proposals')]
#[Middleware('auth')]
final class ProposalController
{
    use ApiController;
    public function __construct(
        private ConnectionInterface $db,
        private ProposalValidator $proposalValidator = new ProposalValidator(),
        private ?EventDispatcherInterface $events = null,
        private ?FeatureFlagService $flags = null,
        private ?PubSubPublisher $pubsub = null,
        private ?EmailNotificationService $emailNotifier = null,
    ) {
        $this->emailNotifier ??= new EmailNotificationService($db);
    }

    #[Route('POST', '', name: 'proposals.create', summary: 'Submit proposal', tags: ['Proposals'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        // Validate input
        $validationError = $this->proposalValidator->validateOrFail($data);
        if ($validationError) {
            return $validationError;
        }

        // Check not already proposed
        $dup = $this->db->pdo()->prepare(
            'SELECT id FROM "proposal" WHERE job_id = :jid AND freelancer_id = :fid'
        );
        $dup->execute(['jid' => $data['job_id'], 'fid' => $userId]);
        if ($dup->fetch()) {
            return $this->error('You already submitted a proposal for this job', 409);
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Check if freelancer meets job location requirements
        $jobLocStmt = $this->db->pdo()->prepare(
            'SELECT location_type, location_regions, location_countries FROM "job" WHERE id = :jid'
        );
        $jobLocStmt->execute(['jid' => $data['job_id']]);
        $jobLoc = $jobLocStmt->fetch(\PDO::FETCH_ASSOC);

        if ($jobLoc && $jobLoc['location_type'] !== 'worldwide') {
            $userStmt = $this->db->pdo()->prepare('SELECT country FROM "user" WHERE id = :uid');
            $userStmt->execute(['uid' => $userId]);
            $userCountry = strtoupper(trim($userStmt->fetchColumn() ?: ''));

            if ($jobLoc['location_type'] === 'countries') {
                $allowedCountries = json_decode($jobLoc['location_countries'] ?? '[]', true) ?: [];
                if (!in_array($userCountry, $allowedCountries, true)) {
                    return $this->error('This job is restricted to freelancers in specific countries.', 403);
                }
            } elseif ($jobLoc['location_type'] === 'regions') {
                $allowedRegions = json_decode($jobLoc['location_regions'] ?? '[]', true) ?: [];
                $userRegion = RegionEnum::COUNTRY_TO_REGION[$userCountry] ?? '';
                if (!in_array($userRegion, $allowedRegions, true)) {
                    return $this->error('This job is restricted to freelancers in specific regions.', 403);
                }
            }
        }

        $this->db->pdo()->prepare(
            'INSERT INTO "proposal" (id, job_id, freelancer_id, cover_letter, bid_amount,
                                     bid_type, estimated_duration_days, milestones_proposed,
                                     status, created_at, updated_at)
             VALUES (:id, :jid, :fid, :cl, :bid, :bt, :dur, :mb, \'submitted\', :now, :now)'
        )->execute([
                    'id' => $id,
                    'jid' => $data['job_id'],
                    'fid' => $userId,
                    'cl' => $data['cover_letter'],
                    'bid' => $data['bid_amount'],
                    'bt' => $data['bid_type'] ?? 'total',
                    'dur' => isset($data['estimated_duration_weeks']) ? ((int) $data['estimated_duration_weeks'] * 7) : null,
                    'mb' => json_encode($data['milestones_proposed'] ?? []),
                    'now' => $now,
                ]);

        // Increment proposals_count on the job
        $this->db->pdo()->prepare(
            'UPDATE "job" SET proposals_count = proposals_count + 1 WHERE id = :jid'
        )->execute(['jid' => $data['job_id']]);

        // ── Sync fraud check (feature-flag controlled) ──────────────
        $fraudResult = null;
        $flags = $this->flags ?? new FeatureFlagService($this->db);

        if ($flags->isEnabled('fraud_detection_enabled')) {
            $fraudResult = $this->callFraudService($userId, $id, $data);

            if ($fraudResult) {
                // Store fraud results on proposal
                $this->db->pdo()->prepare(
                    'UPDATE "proposal" SET ai_fraud_score = :score,
                            ai_fraud_model_version = :mv, ai_fraud_action = :action,
                            updated_at = :now WHERE id = :id'
                )->execute([
                            'score' => $fraudResult['fraud_score'] ?? 0.0,
                            'mv' => $fraudResult['model_version'] ?? null,
                            'action' => $fraudResult['recommended_action'] ?? 'allow',
                            'now' => $now,
                            'id' => $id,
                        ]);

                // Enforcement
                $mode = $flags->getMode('fraud_enforcement_mode', 'shadow');
                $score = (float) ($fraudResult['fraud_score'] ?? 0.0);

                if ($mode === 'enforce' && $score > 0.8) {
                    // Block: delete the proposal and return 403
                    $this->db->pdo()->prepare('DELETE FROM "proposal" WHERE id = :id')
                        ->execute(['id' => $id]);
                    return $this->error('Submission blocked by fraud detection', 403);
                }

                if ($mode === 'soft_block' && $score > 0.8) {
                    // Hold for ops review
                    $this->db->pdo()->prepare(
                        'UPDATE "proposal" SET status = \'held_for_review\', updated_at = :now WHERE id = :id'
                    )->execute(['now' => $now, 'id' => $id]);
                }
                // shadow mode: just log, allow everything
            }
        }

        // Dispatch domain event
        $this->events?->dispatch(new ProposalSubmitted($id, $data['job_id'], $userId));

        // ── Email: notify client about new proposal ──
        try {
            $jobStmt = $this->db->pdo()->prepare('SELECT client_id, title FROM "job" WHERE id = :jid');
            $jobStmt->execute(['jid' => $data['job_id']]);
            $jobInfo = $jobStmt->fetch(\PDO::FETCH_ASSOC);
            if ($jobInfo) {
                $freelancerStmt = $this->db->pdo()->prepare('SELECT display_name FROM "user" WHERE id = :id');
                $freelancerStmt->execute(['id' => $userId]);
                $freelancer = $freelancerStmt->fetch(\PDO::FETCH_ASSOC);
                $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
                $this->emailNotifier->notify(
                    $jobInfo['client_id'],
                    'proposal_emails',
                    'New Proposal Received — ' . ($jobInfo['title'] ?? 'Your Job'),
                    'proposal-received',
                    [
                        'jobTitle' => $jobInfo['title'] ?? '',
                        'freelancerName' => $freelancer['display_name'] ?? 'A freelancer',
                        'coverLetter' => $data['cover_letter'] ?? '',
                        'proposalUrl' => "{$frontendUrl}/dashboard/proposals",
                    ],
                    ['proposals', 'new-proposal'],
                );
            }
        } catch (\Throwable $e) {
            error_log('[Email] Failed to send proposal-received: ' . $e->getMessage());
        }

        // Publish to Pub/Sub (async AI services pick this up)
        $pubsub = $this->pubsub ?? new PubSubPublisher();
        try {
            $pubsub->proposalSubmitted($id, $data['job_id'], $userId);
        } catch (\Throwable) {
            // Non-critical: don't fail the request if Pub/Sub is down
        }

        return $this->created(['data' => ['id' => $id, 'fraud' => $fraudResult]]);
    }

    #[Route('GET', '/me', name: 'proposals.mine', summary: 'My proposals', tags: ['Proposals'])]
    public function mine(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare('SELECT COUNT(*) FROM "proposal" WHERE freelancer_id = :uid');
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT p.*, j.title AS job_title
             FROM "proposal" p JOIN "job" j ON j.id = p.job_id
             WHERE p.freelancer_id = :uid
             ORDER BY p.created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/received', name: 'proposals.received', summary: 'Proposals received on my jobs (client)', tags: ['Proposals'])]
    public function received(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);

        // Optional status filter
        $qs = $request->getQueryParams();
        $status = isset($qs['status']) ? array_filter(explode(',', $qs['status'])) : [];

        $where = 'j.client_id = :uid';
        $params = ['uid' => $userId];

        // Optional job_id filter
        if (!empty($qs['job_id'])) {
            $where .= ' AND p.job_id = :jid';
            $params['jid'] = $qs['job_id'];
        }

        if ($status) {
            $placeholders = [];
            foreach ($status as $i => $s) {
                $key = "st{$i}";
                $placeholders[] = ":{$key}";
                $params[$key] = trim($s);
            }
            $where .= ' AND p.status IN (' . implode(',', $placeholders) . ')';
        }

        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"proposal\" p JOIN \"job\" j ON j.id = p.job_id WHERE {$where}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT p.*, j.title AS job_title,
                    u.first_name AS freelancer_first_name,
                    u.last_name  AS freelancer_last_name,
                    u.email      AS freelancer_email,
                    u.avatar_url AS freelancer_avatar,
                    fp.hourly_rate AS freelancer_hourly_rate,
                    fp.headline AS freelancer_headline,
                    fp.bio AS freelancer_bio,
                    fp.experience_years AS freelancer_experience_years
             FROM \"proposal\" p
             JOIN \"job\" j ON j.id = p.job_id
             JOIN \"user\" u ON u.id = p.freelancer_id
             LEFT JOIN \"freelancerprofile\" fp ON fp.user_id = p.freelancer_id
             WHERE {$where}
             ORDER BY p.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}', name: 'proposals.show', summary: 'Proposal detail', tags: ['Proposals'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT p.*, j.title AS job_title, j.client_id
             FROM "proposal" p JOIN "job" j ON j.id = p.job_id
             WHERE p.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $proposal = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$proposal) {
            return $this->notFound('Proposal');
        }

        // Only freelancer or job client can view
        if ($proposal['freelancer_id'] !== $userId && $proposal['client_id'] !== $userId) {
            return $this->forbidden();
        }

        // Mark as viewed if client is viewing
        if ($proposal['client_id'] === $userId && $proposal['status'] === 'submitted') {
            $this->db->pdo()->prepare(
                'UPDATE "proposal" SET status = \'viewed\', updated_at = :now WHERE id = :id'
            )->execute(['now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'), 'id' => $id]);
            $proposal['status'] = 'viewed';
        }

        return $this->json(['data' => $proposal]);
    }

    #[Route('PATCH', '/{id}', name: 'proposals.update', summary: 'Edit proposal (if not viewed)', tags: ['Proposals'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT freelancer_id, status FROM "proposal" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $proposal = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$proposal) {
            return $this->notFound('Proposal');
        }
        if ($proposal['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }
        if (!in_array($proposal['status'], ['submitted'], true)) {
            return $this->error('Proposal can only be edited before being viewed');
        }

        $allowed = ['cover_letter', 'bid_amount', 'estimated_duration_days', 'milestones_proposed'];
        $sets = [];
        $params = ['id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $v = $field === 'milestones_breakdown' ? json_encode($data[$field]) : $data[$field];
                $sets[] = "\"{$field}\" = :{$field}";
                $params[$field] = $v;
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare('UPDATE "proposal" SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);

        return $this->json(['message' => 'Proposal updated']);
    }

    #[Route('POST', '/{id}/withdraw', name: 'proposals.withdraw', summary: 'Withdraw proposal', tags: ['Proposals'])]
    public function withdraw(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare('SELECT freelancer_id, status FROM "proposal" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $p = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$p) {
            return $this->notFound('Proposal');
        }
        if ($p['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }
        if (in_array($p['status'], ['withdrawn', 'accepted', 'rejected'], true)) {
            return $this->error('Cannot withdraw this proposal');
        }

        $this->db->pdo()->prepare(
            'UPDATE "proposal" SET status = \'withdrawn\', updated_at = :now WHERE id = :id'
        )->execute(['now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'), 'id' => $id]);

        return $this->json(['message' => 'Proposal withdrawn']);
    }

    #[Route('POST', '/{id}/shortlist', name: 'proposals.shortlist', summary: 'Client shortlists', tags: ['Proposals'])]
    public function shortlist(ServerRequestInterface $request, string $id): JsonResponse
    {
        return $this->updateStatusByClient($request, $id, 'shortlisted');
    }

    #[Route('POST', '/{id}/accept', name: 'proposals.accept', summary: 'Accept → contract', tags: ['Proposals'])]
    public function accept(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        // Get full proposal + job info
        $stmt = $this->db->pdo()->prepare(
            'SELECT p.id, p.job_id, p.freelancer_id, p.bid_amount, p.bid_type,
                    p.milestones_proposed, p.cover_letter,
                    j.client_id, j.title AS job_title, j.weekly_hours_limit
             FROM "proposal" p JOIN "job" j ON j.id = p.job_id WHERE p.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $info = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$info || $info['client_id'] !== $userId) {
            return $this->forbidden();
        }

        // Update proposal status
        $result = $this->updateStatusByClient($request, $id, 'accepted');

        // Dispatch event
        $this->events?->dispatch(new ProposalAccepted(
            $id,
            $info['job_id'],
            $info['freelancer_id'],
            $userId
        ));

        // ── Create contract from accepted proposal ──
        $pdo = $this->db->pdo();
        $now = (new \DateTimeImmutable())->format('Y-m-d\TH:i:sP');
        $contractId = $this->uuid();

        $isHourly = $info['bid_type'] === 'hourly';

        $pdo->prepare(
            'INSERT INTO "contract"
                (id, job_id, proposal_id, client_id, freelancer_id,
                 title, description, contract_type, total_amount,
                 hourly_rate, weekly_hour_limit, currency, status, platform_fee_percent,
                 started_at, created_at, updated_at)
             VALUES
                (:id, :job_id, :proposal_id, :client_id, :freelancer_id,
                 :title, :description, :contract_type, :total_amount,
                 :hourly_rate, :whl, :currency, :status, :platform_fee,
                 :started_at, :created_at, :updated_at)'
        )->execute([
                    'id' => $contractId,
                    'job_id' => $info['job_id'],
                    'proposal_id' => $id,
                    'client_id' => $info['client_id'],
                    'freelancer_id' => $info['freelancer_id'],
                    'title' => $info['job_title'],
                    'description' => $info['cover_letter'],
                    'contract_type' => $info['bid_type'],
                    'total_amount' => $info['bid_amount'],
                    'hourly_rate' => $isHourly ? $info['bid_amount'] : null,
                    'whl' => $isHourly ? ($info['weekly_hours_limit'] ?? null) : null,
                    'currency' => 'USD',
                    'status' => 'active',
                    'platform_fee' => '10.00',
                    'started_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

        // Note: Job status is NOT changed here — the client chooses via
        // the frontend modal whether to close the job or keep it listed.

        // ── Create milestones from proposal ──
        $milestones = json_decode($info['milestones_proposed'] ?? '[]', true);
        if (is_array($milestones) && count($milestones) > 0) {
            $msStmt = $pdo->prepare(
                'INSERT INTO "milestone"
                    (id, contract_id, title, description, amount, currency,
                     status, sort_order, escrow_funded, escrow_released,
                     revision_count, created_at, updated_at)
                 VALUES
                    (:id, :cid, :title, :desc, :amount, :currency,
                     :status, :sort, false, false,
                     0, :created_at, :updated_at)'
            );
            foreach ($milestones as $i => $ms) {
                $msStmt->execute([
                    'id' => $this->uuid(),
                    'cid' => $contractId,
                    'title' => $ms['title'] ?? ('Milestone ' . ($i + 1)),
                    'desc' => $ms['description'] ?? null,
                    'amount' => $ms['amount'] ?? '0.00',
                    'currency' => 'USD',
                    'status' => 'pending',
                    'sort' => $i + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        return $this->json([
            'data' => ['proposal_status' => 'accepted', 'contract_id' => $contractId],
        ]);
    }

    #[Route('POST', '/{id}/reject', name: 'proposals.reject', summary: 'Reject proposal', tags: ['Proposals'])]
    public function reject(ServerRequestInterface $request, string $id): JsonResponse
    {
        return $this->updateStatusByClient($request, $id, 'rejected');
    }

    /* ---- helpers ---- */

    private function updateStatusByClient(ServerRequestInterface $request, string $id, string $newStatus): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT p.id, j.client_id FROM "proposal" p JOIN "job" j ON j.id = p.job_id WHERE p.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) {
            return $this->notFound('Proposal');
        }
        if ($row['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $this->db->pdo()->prepare(
            "UPDATE \"proposal\" SET status = :status, updated_at = :now WHERE id = :id"
        )->execute([
                    'status' => $newStatus,
                    'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                    'id' => $id,
                ]);

        return $this->json(['message' => "Proposal {$newStatus}"]);
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    /**
     * Make a synchronous HTTP call to the fraud detection service.
     * Must complete in < 500ms P99.
     *
     * @return array|null  Decoded JSON response or null on failure
     */
    private function callFraudService(string $userId, string $proposalId, array $data): ?array
    {
        $fraudUrl = getenv('AI_FRAUD_URL') ?: 'http://ai-fraud-v1:8080/api/v1/fraud/check';

        // Fetch job context for smarter scoring
        $jobContext = [];
        if (!empty($data['job_id'])) {
            $stmt = $this->db->pdo()->prepare(
                'SELECT budget_min, budget_max FROM "job" WHERE id = :id'
            );
            $stmt->execute(['id' => $data['job_id']]);
            $jobContext = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
        }

        // Fetch freelancer skills
        $skillStmt = $this->db->pdo()->prepare(
            'SELECT s.name FROM "skill" s
             JOIN "freelancerprofile" fp ON fp.user_id = :uid
             WHERE s.id = ANY(
                 SELECT unnest(ARRAY(
                     SELECT jsonb_array_elements_text(fp.certifications)
                 ))
             )
             LIMIT 10'
        );
        // Simplified: just get proposal count for velocity check
        $velStmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "proposal"
             WHERE freelancer_id = :uid AND created_at > NOW() - INTERVAL \'1 hour\''
        );
        $velStmt->execute(['uid' => $userId]);
        $proposalsLastHour = (int) $velStmt->fetchColumn();

        $totalStmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "proposal" WHERE freelancer_id = :uid'
        );
        $totalStmt->execute(['uid' => $userId]);
        $totalProposals = (int) $totalStmt->fetchColumn();

        // Account age
        $ageStmt = $this->db->pdo()->prepare(
            'SELECT EXTRACT(DAY FROM NOW() - created_at)::int FROM "user" WHERE id = :uid'
        );
        $ageStmt->execute(['uid' => $userId]);
        $accountAgeDays = (int) $ageStmt->fetchColumn();

        $payload = [
            'account_id' => $userId,
            'entity_type' => 'proposal',
            'entity_id' => $proposalId,
            'cover_letter' => $data['cover_letter'] ?? null,
            'bid_amount' => isset($data['bid_amount']) ? (float) $data['bid_amount'] : null,
            'job_budget_min' => isset($jobContext['budget_min']) ? (float) $jobContext['budget_min'] : null,
            'job_budget_max' => isset($jobContext['budget_max']) ? (float) $jobContext['budget_max'] : null,
            'proposals_last_hour' => $proposalsLastHour,
            'total_proposals' => $totalProposals,
            'account_age_days' => $accountAgeDays,
        ];

        $ch = curl_init($fraudUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 2000,
            CURLOPT_CONNECTTIMEOUT_MS => 500,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return null; // Fail open — allow the proposal
        }

        return json_decode($response, true);
    }
}