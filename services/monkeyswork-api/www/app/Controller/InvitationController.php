<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/invitations')]
#[Middleware('auth')]
final class InvitationController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
    ) {
    }

    /* ── List invitations ──────────────────────────────── */
    #[Route('GET', '', name: 'invitations.list', summary: 'List my invitations', tags: ['Invitations'])]
    public function list(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $role = $this->userRole($request);
        $qs = $request->getQueryParams();
        $p = $this->pagination($request);

        // Optional status filter
        $statusFilter = isset($qs['status']) ? array_filter(explode(',', $qs['status'])) : [];

        // Role determines perspective (received vs sent)
        $roleColumn = ($role === 'client') ? 'i.client_id' : 'i.freelancer_id';
        $where = "{$roleColumn} = :uid";
        $params = ['uid' => $userId];

        if ($statusFilter) {
            $placeholders = [];
            foreach ($statusFilter as $idx => $st) {
                $key = "st{$idx}";
                $placeholders[] = ":{$key}";
                $params[$key] = trim($st);
            }
            $where .= ' AND i.status IN (' . implode(',', $placeholders) . ')';
        }

        // Count
        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"invitations\" i WHERE {$where}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        // Fetch with joins for job + other-party info
        $stmt = $this->db->pdo()->prepare(
            "SELECT i.*,
                    j.title       AS job_title,
                    j.budget_type AS job_budget_type,
                    j.budget_min  AS job_budget_min,
                    j.budget_max  AS job_budget_max,
                    j.status      AS job_status,
                    c.display_name AS client_name,
                    c.avatar_url   AS client_avatar,
                    f.display_name AS freelancer_name,
                    f.avatar_url   AS freelancer_avatar,
                    fp.headline    AS freelancer_headline,
                    fp.hourly_rate AS freelancer_hourly_rate
             FROM \"invitations\" i
             JOIN \"job\"  j ON j.id = i.job_id
             JOIN \"user\" c ON c.id = i.client_id
             JOIN \"user\" f ON f.id = i.freelancer_id
             LEFT JOIN \"freelancerprofile\" fp ON fp.user_id = i.freelancer_id
             WHERE {$where}
             ORDER BY i.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ── Show single invitation ────────────────────────── */
    #[Route('GET', '/{id}', name: 'invitations.show', summary: 'Invitation detail', tags: ['Invitations'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT i.*,
                    j.title       AS job_title,
                    j.budget_type AS job_budget_type,
                    j.budget_min  AS job_budget_min,
                    j.budget_max  AS job_budget_max,
                    j.status      AS job_status,
                    j.description AS job_description,
                    c.display_name AS client_name,
                    c.avatar_url   AS client_avatar,
                    f.display_name AS freelancer_name,
                    f.avatar_url   AS freelancer_avatar,
                    fp.headline    AS freelancer_headline,
                    fp.hourly_rate AS freelancer_hourly_rate
             FROM "invitations" i
             JOIN "job"  j ON j.id = i.job_id
             JOIN "user" c ON c.id = i.client_id
             JOIN "user" f ON f.id = i.freelancer_id
             LEFT JOIN "freelancerprofile" fp ON fp.user_id = i.freelancer_id
             WHERE i.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $inv = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$inv) {
            return $this->notFound('Invitation');
        }

        if ($inv['client_id'] !== $userId && $inv['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $this->json(['data' => $inv]);
    }

    /* ── Accept invitation (freelancer only) ───────────── */
    #[Route('POST', '/{id}/accept', name: 'invitations.accept', summary: 'Accept invitation', tags: ['Invitations'])]
    public function accept(ServerRequestInterface $request, string $id): JsonResponse
    {
        return $this->respond($request, $id, 'accepted');
    }

    /* ── Decline invitation (freelancer only) ──────────── */
    #[Route('POST', '/{id}/decline', name: 'invitations.decline', summary: 'Decline invitation', tags: ['Invitations'])]
    public function decline(ServerRequestInterface $request, string $id): JsonResponse
    {
        return $this->respond($request, $id, 'declined');
    }

    /* ── helper: respond to invitation ─────────────────── */
    private function respond(ServerRequestInterface $request, string $id, string $newStatus): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT freelancer_id, status FROM "invitations" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $inv = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$inv) {
            return $this->notFound('Invitation');
        }
        if ($inv['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }
        if ($inv['status'] !== 'pending') {
            return $this->error("Invitation has already been {$inv['status']}");
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "invitations" SET status = :status, responded_at = :now WHERE id = :id'
        )->execute([
                    'status' => $newStatus,
                    'now' => $now,
                    'id' => $id,
                ]);

        return $this->json(['message' => "Invitation {$newStatus}", 'data' => ['status' => $newStatus]]);
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

    private function userRole(ServerRequestInterface $request): string
    {
        $userId = $this->userId($request);
        $stmt = $this->db->pdo()->prepare('SELECT role FROM "user" WHERE id = :id');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row['role'] ?? 'freelancer';
    }
}
