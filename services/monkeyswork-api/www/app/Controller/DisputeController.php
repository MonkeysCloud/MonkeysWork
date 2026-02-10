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

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {}

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

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "dispute" (id, contract_id, filed_by, reason, description, status, created_at, updated_at)
             VALUES (:id, :cid, :uid, :reason, :desc, \'open\', :now, :now)'
        )->execute([
            'id'     => $id,
            'cid'    => $data['contract_id'],
            'uid'    => $userId,
            'reason' => $data['reason'],
            'desc'   => $data['description'] ?? null,
            'now'    => $now,
        ]);

        // Dispatch event
        $this->events?->dispatch(new DisputeOpened($id, $data['contract_id'], $userId, $data['reason']));

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/{id}', name: 'disputes.show', summary: 'Dispute detail', tags: ['Disputes'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT d.*, c.client_id, c.freelancer_id, j.title AS job_title
             FROM "dispute" d
             JOIN "contract" c ON c.id = d.contract_id
             JOIN "job" j ON j.id = c.job_id
             WHERE d.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $dispute = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        return $this->json(['data' => $dispute]);
    }

    #[Route('POST', '/{id}/messages', name: 'disputes.message', summary: 'Add evidence/message', tags: ['Disputes'])]
    public function addMessage(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $msgId = $this->uuid();
        $now   = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "disputemessage" (id, dispute_id, sender_id, body, attachment_url, created_at)
             VALUES (:id, :did, :uid, :body, :att, :now)'
        )->execute([
            'id'   => $msgId,
            'did'  => $id,
            'uid'  => $userId,
            'body' => $data['body'] ?? '',
            'att'  => $data['attachment_url'] ?? null,
            'now'  => $now,
        ]);

        return $this->created(['data' => ['id' => $msgId]]);
    }

    #[Route('GET', '/{id}/messages', name: 'disputes.messages', summary: 'Message thread', tags: ['Disputes'])]
    public function messages(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT dm.*, u.display_name AS sender_name
             FROM "disputemessage" dm JOIN "user" u ON u.id = dm.sender_id
             WHERE dm.dispute_id = :did ORDER BY dm.created_at ASC'
        );
        $stmt->execute(['did' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('POST', '/{id}/resolve', name: 'disputes.resolve', summary: 'Admin resolves', tags: ['Disputes'])]
    public function resolve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Fetch dispute to get contract_id for event
        $dStmt = $this->db->pdo()->prepare('SELECT contract_id FROM "dispute" WHERE id = :id');
        $dStmt->execute(['id' => $id]);
        $dispute = $dStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET status = :status, resolution_notes = :notes,
                    resolved_by = :uid, resolved_at = :now, updated_at = :now WHERE id = :id'
        )->execute([
            'status' => $data['status'] ?? 'resolved_split',
            'notes'  => $data['resolution_notes'] ?? null,
            'uid'    => $this->userId($request),
            'now'    => $now,
            'id'     => $id,
        ]);

        // Dispatch event
        $this->events?->dispatch(new DisputeResolved(
            $id,
            $dispute['contract_id'],
            $data['status'] ?? 'resolved_split',
            $this->userId($request)
        ));

        return $this->json(['message' => 'Dispute resolved']);
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
