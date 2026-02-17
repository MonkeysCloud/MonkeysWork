<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\DisputeOpened;
use App\Event\DisputeResolved;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/disputes')]
#[Middleware('auth')]
final class DisputeController
{
    use ApiController;

    private const RESPONSE_DAYS = 3;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {}

    /* ── List current user's disputes ─────────────────── */

    #[Route('GET', '', name: 'disputes.index', summary: 'My disputes', tags: ['Disputes'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['(c.client_id = :uid OR c.freelancer_id = :uid)'];
        $params = ['uid' => $userId];

        if (!empty($q['status'])) {
            $where[]          = 'd.status = :status';
            $params['status'] = $q['status'];
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"dispute\" d JOIN \"contract\" c ON c.id = d.contract_id WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT d.*, j.title AS job_title,
                    uc.display_name AS client_name, uf.display_name AS freelancer_name,
                    c.client_id, c.freelancer_id,
                    (SELECT COUNT(*) FROM \"disputemessage\" dm WHERE dm.dispute_id = d.id) AS message_count
             FROM \"dispute\" d
             JOIN \"contract\" c ON c.id = d.contract_id
             JOIN \"job\" j ON j.id = c.job_id
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE {$w} ORDER BY d.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ── Create dispute ───────────────────────────────── */

    #[Route('POST', '', name: 'disputes.create', summary: 'Open dispute', tags: ['Disputes'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['contract_id']) || empty($data['reason'])) {
            return $this->error('contract_id and reason are required');
        }

        // Verify party to contract
        $c = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id FROM "contract" WHERE id = :cid'
        );
        $c->execute(['cid' => $data['contract_id']]);
        $contract = $c->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return $this->notFound('Contract');
        }
        if ($contract['client_id'] !== $userId && $contract['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        // Determine who must respond (the other party)
        $respondent = $contract['client_id'] === $userId
            ? $contract['freelancer_id']
            : $contract['client_id'];

        $id  = $this->uuid();
        $now = new \DateTimeImmutable();
        $deadline = $now->modify('+' . self::RESPONSE_DAYS . ' days');

        $this->db->pdo()->prepare(
            'INSERT INTO "dispute" (id, contract_id, filed_by, reason, description, evidence_urls, status,
                    response_deadline, awaiting_response_from, created_at, updated_at)
             VALUES (:id, :cid, :uid, :reason, :desc, :evidence, \'open\', :deadline, :respondent, :now, :now)'
        )->execute([
            'id'         => $id,
            'cid'        => $data['contract_id'],
            'uid'        => $userId,
            'reason'     => $data['reason'],
            'desc'       => $data['description'] ?? '',
            'evidence'   => json_encode($data['evidence_urls'] ?? []),
            'deadline'   => $deadline->format('Y-m-d H:i:s'),
            'respondent' => $respondent,
            'now'        => $now->format('Y-m-d H:i:s'),
        ]);

        // Update contract status
        $this->db->pdo()->prepare(
            'UPDATE "contract" SET status = \'disputed\', updated_at = :now WHERE id = :cid'
        )->execute(['now' => $now->format('Y-m-d H:i:s'), 'cid' => $data['contract_id']]);

        // Dispatch event
        $this->events?->dispatch(new DisputeOpened($id, $data['contract_id'], $userId, $data['reason']));

        return $this->created(['data' => ['id' => $id]]);
    }

    /* ── Show dispute ─────────────────────────────────── */

    #[Route('GET', '/{id}', name: 'disputes.show', summary: 'Dispute detail', tags: ['Disputes'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT d.*, c.client_id, c.freelancer_id, c.total_amount, c.currency,
                    j.title AS job_title,
                    uc.display_name AS client_name, uf.display_name AS freelancer_name,
                    ub.display_name AS filed_by_name,
                    (SELECT COUNT(*) FROM "disputemessage" dm WHERE dm.dispute_id = d.id) AS message_count
             FROM "dispute" d
             JOIN "contract" c ON c.id = d.contract_id
             JOIN "job" j ON j.id = c.job_id
             JOIN "user" uc ON uc.id = c.client_id
             JOIN "user" uf ON uf.id = c.freelancer_id
             JOIN "user" ub ON ub.id = d.filed_by
             WHERE d.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $dispute = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        // Only parties to the contract can see
        if ($dispute['client_id'] !== $userId && $dispute['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        // Check auto-forfeit
        $this->checkDeadlineForDispute($dispute);

        // Re-fetch if status may have changed
        if ($dispute['response_deadline'] && new \DateTimeImmutable($dispute['response_deadline']) < new \DateTimeImmutable()) {
            $stmt->execute(['id' => $id]);
            $dispute = $stmt->fetch(\PDO::FETCH_ASSOC);
        }

        // Parse evidence_urls JSON
        if (is_string($dispute['evidence_urls'] ?? null)) {
            $dispute['evidence_urls'] = json_decode($dispute['evidence_urls'], true) ?: [];
        }

        return $this->json(['data' => $dispute]);
    }

    /* ── Add message/argument ─────────────────────────── */

    #[Route('POST', '/{id}/messages', name: 'disputes.message', summary: 'Add argument/evidence', tags: ['Disputes'])]
    public function addMessage(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        // Verify the dispute exists and user is a party
        $dStmt = $this->db->pdo()->prepare(
            'SELECT d.*, c.client_id, c.freelancer_id
             FROM "dispute" d JOIN "contract" c ON c.id = d.contract_id
             WHERE d.id = :id'
        );
        $dStmt->execute(['id' => $id]);
        $dispute = $dStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }
        if ($dispute['client_id'] !== $userId && $dispute['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        // Don't allow messages on resolved/closed disputes
        if (in_array($dispute['status'], ['resolved_client', 'resolved_freelancer', 'resolved_split'])) {
            return $this->error('Dispute is already resolved', 422);
        }

        $msgId = $this->uuid();
        $now   = new \DateTimeImmutable();

        $this->db->pdo()->prepare(
            'INSERT INTO "disputemessage" (id, dispute_id, sender_id, body, attachment_url, attachments, created_at)
             VALUES (:id, :did, :uid, :body, :att, :atts, :now)'
        )->execute([
            'id'   => $msgId,
            'did'  => $id,
            'uid'  => $userId,
            'body' => $data['body'] ?? '',
            'att'  => $data['attachment_url'] ?? null,
            'atts' => json_encode($data['attachments'] ?? []),
            'now'  => $now->format('Y-m-d H:i:s'),
        ]);

        // Reset response deadline: the OTHER party now has 3 days to respond
        $otherParty = $dispute['client_id'] === $userId
            ? $dispute['freelancer_id']
            : $dispute['client_id'];

        $newDeadline = $now->modify('+' . self::RESPONSE_DAYS . ' days');

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET awaiting_response_from = :other,
                    response_deadline = :deadline, updated_at = :now WHERE id = :id'
        )->execute([
            'other'    => $otherParty,
            'deadline' => $newDeadline->format('Y-m-d H:i:s'),
            'now'      => $now->format('Y-m-d H:i:s'),
            'id'       => $id,
        ]);

        return $this->created(['data' => ['id' => $msgId]]);
    }

    /* ── Message thread ───────────────────────────────── */

    #[Route('GET', '/{id}/messages', name: 'disputes.messages', summary: 'Message thread', tags: ['Disputes'])]
    public function messages(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT dm.*, u.display_name AS sender_name
             FROM "disputemessage" dm JOIN "user" u ON u.id = dm.sender_id
             WHERE dm.dispute_id = :did AND (dm.is_internal = false OR dm.is_internal IS NULL)
             ORDER BY dm.created_at ASC'
        );
        $stmt->execute(['did' => $id]);

        $msgs = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Parse attachments JSON
        foreach ($msgs as &$m) {
            if (is_string($m['attachments'] ?? null)) {
                $m['attachments'] = json_decode($m['attachments'], true) ?: [];
            }
        }

        return $this->json(['data' => $msgs]);
    }

    /* ── Escalate to admin ────────────────────────────── */

    #[Route('POST', '/{id}/escalate', name: 'disputes.escalate', summary: 'Escalate to admin', tags: ['Disputes'])]
    public function escalate(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Verify dispute + party
        $dStmt = $this->db->pdo()->prepare(
            'SELECT d.status, c.client_id, c.freelancer_id
             FROM "dispute" d JOIN "contract" c ON c.id = d.contract_id
             WHERE d.id = :id'
        );
        $dStmt->execute(['id' => $id]);
        $dispute = $dStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }
        if ($dispute['client_id'] !== $userId && $dispute['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }
        if ($dispute['status'] !== 'open' && $dispute['status'] !== 'under_review') {
            return $this->error('Only open or under-review disputes can be escalated', 422);
        }

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET status = \'escalated\', updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Dispute escalated to admin review']);
    }

    /* ── Resolve (party agreement or admin) ───────────── */

    #[Route('POST', '/{id}/resolve', name: 'disputes.resolve', summary: 'Resolve dispute', tags: ['Disputes'])]
    public function resolve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data   = $this->body($request);
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $dStmt = $this->db->pdo()->prepare('SELECT contract_id FROM "dispute" WHERE id = :id');
        $dStmt->execute(['id' => $id]);
        $dispute = $dStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET status = :status, resolution_notes = :notes, resolution_amount = :amount,
                    resolved_by = :uid, resolved_at = :now, response_deadline = NULL,
                    awaiting_response_from = NULL, updated_at = :now2 WHERE id = :id'
        )->execute([
            'status' => $data['status'] ?? 'resolved_split',
            'notes'  => $data['resolution_notes'] ?? null,
            'amount' => $data['resolution_amount'] ?? null,
            'uid'    => $userId,
            'now'    => $now,
            'now2'   => $now,
            'id'     => $id,
        ]);

        // Dispatch event
        $this->events?->dispatch(new DisputeResolved(
            $id,
            $dispute['contract_id'],
            $data['status'] ?? 'resolved_split',
            $userId
        ));

        return $this->json(['message' => 'Dispute resolved']);
    }

    /* ── Check deadlines (cron endpoint) ──────────────── */

    #[Route('POST', '/check-deadlines', name: 'disputes.checkDeadlines', summary: 'Auto-resolve expired disputes', tags: ['Disputes'])]
    public function checkDeadlines(ServerRequestInterface $request): JsonResponse
    {
        $now  = new \DateTimeImmutable();
        $stmt = $this->db->pdo()->prepare(
            'SELECT d.*, c.client_id, c.freelancer_id
             FROM "dispute" d
             JOIN "contract" c ON c.id = d.contract_id
             WHERE d.status IN (\'open\', \'under_review\')
               AND d.response_deadline IS NOT NULL
               AND d.response_deadline < :now
               AND d.awaiting_response_from IS NOT NULL'
        );
        $stmt->execute(['now' => $now->format('Y-m-d H:i:s')]);

        $expired = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $resolved = 0;

        foreach ($expired as $d) {
            // The party who didn't respond loses — resolve in favor of the OTHER party
            $loser  = $d['awaiting_response_from'];
            $status = $loser === $d['client_id'] ? 'resolved_freelancer' : 'resolved_client';

            $this->db->pdo()->prepare(
                'UPDATE "dispute" SET status = :status, resolution_notes = :notes,
                        resolved_at = :now, response_deadline = NULL,
                        awaiting_response_from = NULL, updated_at = :now2 WHERE id = :id'
            )->execute([
                'status' => $status,
                'notes'  => 'Auto-resolved: respondent did not reply within the ' . self::RESPONSE_DAYS . '-day deadline.',
                'now'    => $now->format('Y-m-d H:i:s'),
                'now2'   => $now->format('Y-m-d H:i:s'),
                'id'     => $d['id'],
            ]);

            $this->events?->dispatch(new DisputeResolved(
                $d['id'],
                $d['contract_id'],
                $status,
                'system'
            ));

            $resolved++;
        }

        return $this->json(['message' => "Processed {$resolved} expired disputes"]);
    }

    /* ── Internal helpers ─────────────────────────────── */

    private function checkDeadlineForDispute(array $dispute): void
    {
        if (empty($dispute['response_deadline']) || empty($dispute['awaiting_response_from'])) {
            return;
        }
        if (!in_array($dispute['status'], ['open', 'under_review'])) {
            return;
        }

        $deadline = new \DateTimeImmutable($dispute['response_deadline']);
        if ($deadline >= new \DateTimeImmutable()) {
            return;
        }

        // Auto-resolve: loser is the one who didn't respond
        $loser  = $dispute['awaiting_response_from'];
        $status = ($loser === ($dispute['client_id'] ?? '')) ? 'resolved_freelancer' : 'resolved_client';
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET status = :status, resolution_notes = :notes,
                    resolved_at = :now, response_deadline = NULL,
                    awaiting_response_from = NULL, updated_at = :now2 WHERE id = :id'
        )->execute([
            'status' => $status,
            'notes'  => 'Auto-resolved: respondent did not reply within the ' . self::RESPONSE_DAYS . '-day deadline.',
            'now'    => $now,
            'now2'   => $now,
            'id'     => $dispute['id'],
        ]);
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
