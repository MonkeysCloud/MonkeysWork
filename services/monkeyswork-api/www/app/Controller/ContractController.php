<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\ContractCompleted;
use App\Service\EmailNotificationService;
use App\Validator\MilestoneValidator;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/contracts')]
#[Middleware('auth')]
final class ContractController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private MilestoneValidator $milestoneValidator = new MilestoneValidator(),
        private ?EventDispatcherInterface $events = null,
        private ?EmailNotificationService $emailNotifier = null,
    ) {
        $this->emailNotifier ??= new EmailNotificationService($db);
    }

    #[Route('GET', '', name: 'contracts.index', summary: 'My contracts', tags: ['Contracts'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);
        $status = $request->getQueryParams()['status'] ?? null;

        $where = '(c.client_id = :uid OR c.freelancer_id = :uid)';
        $params = ['uid' => $userId];

        if ($status) {
            $where .= ' AND c.status = :status';
            $params['status'] = $status;
        }

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"contract\" c WHERE {$where}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT c.*, j.title AS job_title,
                    uc.display_name AS client_name,
                    uf.display_name AS freelancer_name
             FROM \"contract\" c
             JOIN \"job\" j  ON j.id  = c.job_id
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE {$where}
             ORDER BY c.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}', name: 'contracts.show', summary: 'Contract detail', tags: ['Contracts'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT c.*, j.title AS job_title, uc.display_name AS client_name,
                    uf.display_name AS freelancer_name
             FROM "contract" c
             JOIN "job" j ON j.id = c.job_id
             JOIN "user" uc ON uc.id = c.client_id
             JOIN "user" uf ON uf.id = c.freelancer_id
             WHERE c.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $contract = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return $this->notFound('Contract');
        }
        if ($contract['client_id'] !== $userId && $contract['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $this->json(['data' => $contract]);
    }

    #[Route('PATCH', '/{id}', name: 'contracts.update', summary: 'Update contract (client only)', tags: ['Contracts'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id, contract_type FROM "contract" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $c = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$c) {
            return $this->notFound('Contract');
        }
        if ($c['client_id'] !== $userId) {
            return $this->forbidden('Only the client can update contract settings');
        }

        $sets = [];
        $params = ['id' => $id];

        // weekly_hour_limit — only for hourly contracts
        if (array_key_exists('weekly_hour_limit', $data)) {
            if ($c['contract_type'] !== 'hourly') {
                return $this->error('Weekly hour limit only applies to hourly contracts');
            }
            $val = $data['weekly_hour_limit'];
            if ($val !== null && (int) $val < 1) {
                return $this->error('weekly_hour_limit must be at least 1 or null to remove');
            }
            $sets[] = '"weekly_hour_limit" = :whl';
            $params['whl'] = $val !== null ? (int) $val : null;
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "contract" SET ' . implode(', ', $sets) . ' WHERE id = :id'
        )->execute($params);

        // Return updated contract
        $updated = $this->db->pdo()->prepare('SELECT * FROM "contract" WHERE id = :id');
        $updated->execute(['id' => $id]);

        return $this->json(['data' => $updated->fetch(\PDO::FETCH_ASSOC)]);
    }

    #[Route('POST', '/{id}/complete', name: 'contracts.complete', summary: 'Mark complete', tags: ['Contracts'])]
    public function complete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        // Get contract parties before transition
        $stmt = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id, status FROM "contract" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $c = $stmt->fetch(\PDO::FETCH_ASSOC);

        $result = $this->transition($request, $id, 'completed', ['active']);

        // Dispatch event after successful completion
        if ($c && in_array($c['status'], ['active'], true)) {
            $this->events?->dispatch(new ContractCompleted($id, $c['client_id'], $c['freelancer_id']));

            // ── Email: notify both parties about completion ──
            try {
                $titleStmt = $this->db->pdo()->prepare('SELECT title FROM "contract" WHERE id = :id');
                $titleStmt->execute(['id' => $id]);
                $contractTitle = ($titleStmt->fetch(\PDO::FETCH_ASSOC))['title'] ?? '';

                $clientStmt = $this->db->pdo()->prepare('SELECT display_name FROM "user" WHERE id = :id');
                $clientStmt->execute(['id' => $c['client_id']]);
                $clientName = ($clientStmt->fetch(\PDO::FETCH_ASSOC))['display_name'] ?? '';

                $freelancerStmt = $this->db->pdo()->prepare('SELECT display_name FROM "user" WHERE id = :id');
                $freelancerStmt->execute(['id' => $c['freelancer_id']]);
                $freelancerName = ($freelancerStmt->fetch(\PDO::FETCH_ASSOC))['display_name'] ?? '';

                $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
                $contractUrl = "{$frontendUrl}/dashboard/reviews";

                $this->emailNotifier->notify(
                    $c['client_id'],
                    'contract_emails',
                    'Contract Completed — ' . $contractTitle,
                    'contract-completed',
                    ['contractTitle' => $contractTitle, 'otherPartyName' => $freelancerName, 'contractUrl' => $contractUrl],
                    ['contracts', 'completed'],
                );
                $this->emailNotifier->notify(
                    $c['freelancer_id'],
                    'contract_emails',
                    'Contract Completed — ' . $contractTitle,
                    'contract-completed',
                    ['contractTitle' => $contractTitle, 'otherPartyName' => $clientName, 'contractUrl' => $contractUrl],
                    ['contracts', 'completed'],
                );
            } catch (\Throwable $e) {
                error_log('[Email] Failed to send contract-completed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    #[Route('POST', '/{id}/cancel', name: 'contracts.cancel', summary: 'Cancel contract', tags: ['Contracts'])]
    public function cancel(ServerRequestInterface $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'cancelled', ['active', 'paused']);
    }

    #[Route('GET', '/{id}/milestones', name: 'contracts.milestones', summary: 'List milestones', tags: ['Contracts'])]
    public function milestones(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        // Verify party
        $check = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id FROM "contract" WHERE id = :id'
        );
        $check->execute(['id' => $id]);
        $c = $check->fetch(\PDO::FETCH_ASSOC);

        if (!$c) {
            return $this->notFound('Contract');
        }
        if ($c['client_id'] !== $userId && $c['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "milestone" WHERE contract_id = :cid ORDER BY sort_order ASC'
        );
        $stmt->execute(['cid' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('POST', '/{id}/milestones', name: 'contracts.milestones.add', summary: 'Add milestone', tags: ['Contracts'])]
    public function addMilestone(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        // Validate milestone input
        $validationError = $this->milestoneValidator->validateOrFail($data);
        if ($validationError) {
            return $validationError;
        }

        $check = $this->db->pdo()->prepare('SELECT client_id FROM "contract" WHERE id = :id');
        $check->execute(['id' => $id]);
        $c = $check->fetch(\PDO::FETCH_ASSOC);

        if (!$c || $c['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $msId = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "milestone" (id, contract_id, title, description, amount, currency,
                                      due_date, sort_order, status, created_at, updated_at)
             VALUES (:id, :cid, :title, :desc, :amt, :cur, :due, :sort, \'pending\', :now, :now)'
        )->execute([
                    'id' => $msId,
                    'cid' => $id,
                    'title' => $data['title'] ?? 'Milestone',
                    'desc' => $data['description'] ?? null,
                    'amt' => $data['amount'] ?? 0,
                    'cur' => $data['currency'] ?? 'USD',
                    'due' => $data['due_date'] ?? null,
                    'sort' => $data['sort_order'] ?? 0,
                    'now' => $now,
                ]);

        return $this->created(['data' => ['id' => $msId]]);
    }

    #[Route('GET', '/{id}/escrow', name: 'contracts.escrow', summary: 'Escrow status', tags: ['Contracts'])]
    public function escrow(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $check = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id FROM "contract" WHERE id = :id'
        );
        $check->execute(['id' => $id]);
        $c = $check->fetch(\PDO::FETCH_ASSOC);

        if (!$c) {
            return $this->notFound('Contract');
        }
        if ($c['client_id'] !== $userId && $c['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "escrowtransaction" WHERE contract_id = :cid ORDER BY created_at DESC'
        );
        $stmt->execute(['cid' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    /* ---- helpers ---- */

    private function transition(ServerRequestInterface $request, string $id, string $newStatus, array $allowed): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id, job_id, status FROM "contract" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $c = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$c) {
            return $this->notFound('Contract');
        }
        if ($c['client_id'] !== $userId && $c['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }
        if (!in_array($c['status'], $allowed, true)) {
            return $this->error("Cannot transition from '{$c['status']}' to '{$newStatus}'");
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $extra = $newStatus === 'completed' ? ', completed_at = :now2' : '';

        $params = ['status' => $newStatus, 'now' => $now, 'id' => $id];
        if ($newStatus === 'completed') {
            $params['now2'] = $now;
        }

        $this->db->pdo()->prepare(
            "UPDATE \"contract\" SET status = :status, updated_at = :now{$extra} WHERE id = :id"
        )->execute($params);

        // ── Sync job status with contract lifecycle ──
        $jobStatusMap = [
            'completed' => 'completed',
            'cancelled' => 'open',      // re-open for hiring
        ];
        if (isset($jobStatusMap[$newStatus]) && !empty($c['job_id'])) {
            $this->db->pdo()->prepare(
                'UPDATE "job" SET status = :status, updated_at = :now WHERE id = :jid'
            )->execute([
                        'status' => $jobStatusMap[$newStatus],
                        'now' => $now,
                        'jid' => $c['job_id'],
                    ]);
        }

        return $this->json(['message' => "Contract {$newStatus}"]);
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
}