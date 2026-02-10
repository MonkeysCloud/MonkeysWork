<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/verifications')]
#[Middleware(['auth', 'role:admin,ops'])]
final class AdminVerifController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '/queue', name: 'admin.verif.queue', summary: 'Review queue', tags: ['Admin'])]
    public function queue(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "verification" WHERE status IN (\'pending\', \'in_review\', \'human_review\')'
        );
        $cnt->execute();
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT v.*, u.display_name, u.email
             FROM "verification" v JOIN "user" u ON u.id = v.user_id
             WHERE v.status IN (\'pending\', \'in_review\', \'human_review\')
             ORDER BY v.submitted_at ASC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('POST', '/{id}/approve', name: 'admin.verif.approve', summary: 'Approve verification', tags: ['Admin'])]
    public function approve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "verification" SET status = \'approved\', reviewed_by = :uid,
                    reviewed_at = :now, updated_at = :now WHERE id = :id'
        );
        $stmt->execute(['uid' => $userId, 'now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Verification');
        }

        return $this->json(['message' => 'Verification approved']);
    }

    #[Route('POST', '/{id}/reject', name: 'admin.verif.reject', summary: 'Reject verification', tags: ['Admin'])]
    public function reject(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "verification" SET status = \'rejected\', reviewed_by = :uid,
                    reviewed_at = :now, rejection_reason = :reason, updated_at = :now WHERE id = :id'
        );
        $stmt->execute([
            'uid'    => $userId,
            'now'    => $now,
            'reason' => $data['reason'] ?? null,
            'id'     => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Verification');
        }

        return $this->json(['message' => 'Verification rejected']);
    }
}
