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

#[RoutePrefix('/api/v1/admin/jobs')]
#[Middleware(['auth', 'role:admin'])]
final class AdminJobController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'admin.jobs', summary: 'All jobs', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[]          = 'j.status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['search'])) {
            $where[]          = 'j.title ILIKE :search';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"job\" j WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT j.*, u.display_name AS client_name
             FROM \"job\" j JOIN \"user\" u ON u.id = j.client_id
             WHERE {$w} ORDER BY j.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('PATCH', '/{id}/status', name: 'admin.jobs.status', summary: 'Suspend job', tags: ['Admin'])]
    public function updateStatus(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['status'])) {
            return $this->error('status is required');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt = $this->db->pdo()->prepare(
            'UPDATE "job" SET status = :status, updated_at = :now WHERE id = :id'
        );
        $stmt->execute(['status' => $data['status'], 'now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Job');
        }

        return $this->json(['message' => "Job status updated to {$data['status']}"]);
    }
}
