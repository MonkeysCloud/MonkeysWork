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

#[RoutePrefix('/api/v1/admin/users')]
#[Middleware(['auth', 'role:admin'])]
final class AdminUserController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'admin.users', summary: 'All users', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['role'])) {
            $where[]        = 'role = :role';
            $params['role'] = $q['role'];
        }
        if (!empty($q['status'])) {
            $where[]          = 'status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['search'])) {
            $where[]          = '(display_name ILIKE :search OR email ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"user\" WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT id, email, role, status, display_name, avatar_url, country,
                    email_verified_at, last_login_at, created_at
             FROM \"user\" WHERE {$w}
             ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('PATCH', '/{id}/status', name: 'admin.users.status', summary: 'Suspend/activate user', tags: ['Admin'])]
    public function updateStatus(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['status'])) {
            return $this->error('status is required');
        }

        $allowed = ['active', 'suspended', 'deactivated', 'pending_verification'];
        if (!in_array($data['status'], $allowed, true)) {
            return $this->error('Invalid status');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt = $this->db->pdo()->prepare(
            'UPDATE "user" SET status = :status, updated_at = :now WHERE id = :id'
        );
        $stmt->execute(['status' => $data['status'], 'now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('User');
        }

        return $this->json(['message' => "User status updated to {$data['status']}"]);
    }
}
