<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\EscrowFunded;
use App\Event\EscrowReleased;
use App\Event\MilestoneAccepted;
use App\Event\MilestoneSubmitted;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/milestones')]
#[Middleware('auth')]
final class MilestoneController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {}

    #[Route('GET', '/{id}', name: 'milestones.show', summary: 'Milestone detail', tags: ['Milestones'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        return $this->json(['data' => $ms]);
    }

    #[Route('PATCH', '/{id}', name: 'milestones.update', summary: 'Edit milestone', tags: ['Milestones'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        $allowed = ['title', 'description', 'amount', 'due_date', 'sort_order'];
        $sets    = [];
        $params  = ['id' => $id];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $sets[]     = "\"{$f}\" = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[]        = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare('UPDATE "milestone" SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);

        return $this->json(['message' => 'Milestone updated']);
    }

    #[Route('POST', '/{id}/fund', name: 'milestones.fund', summary: 'Fund escrow', tags: ['Milestones'])]
    public function fund(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['client_id'] !== $userId) {
            return $this->forbidden('Only the client can fund milestones');
        }

        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $txId = $this->uuid();

        $pdo = $this->db->pdo();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'UPDATE "milestone" SET funded_at = :now, status = \'in_progress\', updated_at = :now WHERE id = :id'
            )->execute(['now' => $now, 'id' => $id]);

            $pdo->prepare(
                'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, created_at)
                 VALUES (:id, :cid, :mid, \'fund\', :amt, :cur, \'completed\', :now)'
            )->execute([
                'id'  => $txId,
                'cid' => $ms['contract_id'],
                'mid' => $id,
                'amt' => $ms['amount'],
                'cur' => $ms['currency'] ?? 'USD',
                'now' => $now,
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error('Failed to fund milestone', 500);
        }

        // Dispatch event
        $this->events?->dispatch(new EscrowFunded($txId, $id, $ms['contract_id'], (string) $ms['amount']));

        return $this->json(['message' => 'Milestone funded', 'data' => ['transaction_id' => $txId]]);
    }

    #[Route('POST', '/{id}/submit', name: 'milestones.submit', summary: 'Submit work', tags: ['Milestones'])]
    public function submit(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can submit work');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "milestone" SET status = \'submitted\', submitted_at = :now, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        // Dispatch event
        $this->events?->dispatch(new MilestoneSubmitted($id, $ms['contract_id'], $userId));

        return $this->json(['message' => 'Work submitted for review']);
    }

    #[Route('POST', '/{id}/accept', name: 'milestones.accept', summary: 'Accept + release', tags: ['Milestones'])]
    public function accept(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['client_id'] !== $userId) {
            return $this->forbidden('Only the client can accept');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $pdo = $this->db->pdo();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'UPDATE "milestone" SET status = \'accepted\', accepted_at = :now, updated_at = :now WHERE id = :id'
            )->execute(['now' => $now, 'id' => $id]);

            // Release escrow
            $txId = $this->uuid();
            $pdo->prepare(
                'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, created_at)
                 VALUES (:id, :cid, :mid, \'release\', :amt, :cur, \'completed\', :now)'
            )->execute([
                'id'  => $txId,
                'cid' => $ms['contract_id'],
                'mid' => $id,
                'amt' => $ms['amount'],
                'cur' => $ms['currency'] ?? 'USD',
                'now' => $now,
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error('Failed to accept milestone', 500);
        }

        // Dispatch events
        $this->events?->dispatch(new MilestoneAccepted($id, $ms['contract_id'], $userId, (string) $ms['amount']));
        $this->events?->dispatch(new EscrowReleased($txId, $id, $ms['contract_id'], (string) $ms['amount']));

        return $this->json(['message' => 'Milestone accepted, escrow released']);
    }

    #[Route('POST', '/{id}/request-revision', name: 'milestones.revision', summary: 'Request revision', tags: ['Milestones'])]
    public function requestRevision(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "milestone" SET status = \'revision_requested\',
                    revision_count = revision_count + 1, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Revision requested']);
    }

    #[Route('POST', '/{id}/deliverables', name: 'milestones.deliverables.upload', summary: 'Upload file', tags: ['Milestones'])]
    public function uploadDeliverable(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        $data = $this->body($request);
        $dId  = $this->uuid();
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "deliverable" (id, milestone_id, uploaded_by, filename, url, file_size,
                                        mime_type, description, version, created_at)
             VALUES (:id, :mid, :uid, :fn, :url, :fs, :mt, :desc, :ver, :now)'
        )->execute([
            'id'   => $dId,
            'mid'  => $id,
            'uid'  => $userId,
            'fn'   => $data['filename'] ?? 'file',
            'url'  => $data['url'] ?? '',
            'fs'   => $data['file_size'] ?? 0,
            'mt'   => $data['mime_type'] ?? 'application/octet-stream',
            'desc' => $data['description'] ?? null,
            'ver'  => $data['version'] ?? 1,
            'now'  => $now,
        ]);

        return $this->created(['data' => ['id' => $dId]]);
    }

    #[Route('GET', '/{id}/deliverables', name: 'milestones.deliverables', summary: 'List deliverables', tags: ['Milestones'])]
    public function deliverables(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms     = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        $stmt = $this->db->pdo()->prepare(
            'SELECT d.*, u.display_name AS uploader_name
             FROM "deliverable" d JOIN "user" u ON u.id = d.uploaded_by
             WHERE d.milestone_id = :mid ORDER BY d.version DESC, d.created_at DESC'
        );
        $stmt->execute(['mid' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    /* ---- helpers ---- */

    private function findOrFail(string $id, ?string $userId): array|JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT m.*, c.client_id, c.freelancer_id
             FROM "milestone" m JOIN "contract" c ON c.id = m.contract_id
             WHERE m.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $ms = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$ms) {
            return $this->notFound('Milestone');
        }
        if ($ms['client_id'] !== $userId && $ms['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $ms;
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
