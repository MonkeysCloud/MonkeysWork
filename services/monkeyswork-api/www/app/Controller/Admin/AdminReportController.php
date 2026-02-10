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

#[RoutePrefix('/api/v1/admin/reports')]
#[Middleware(['auth', 'role:admin'])]
final class AdminReportController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'admin.reports', summary: 'Content reports', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[]          = 'status = :status';
            $params['status'] = $q['status'];
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"report\" WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT r.*, u.display_name AS reporter_name
             FROM \"report\" r JOIN \"user\" u ON u.id = r.reporter_id
             WHERE {$w} ORDER BY r.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('PATCH', '/{id}', name: 'admin.reports.resolve', summary: 'Resolve report', tags: ['Admin'])]
    public function resolve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data   = $this->body($request);
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "report" SET status = :status, resolution = :res, resolved_by = :uid,
                    resolved_at = :now, updated_at = :now WHERE id = :id'
        );
        $stmt->execute([
            'status' => $data['status'] ?? 'resolved',
            'res'    => $data['resolution'] ?? null,
            'uid'    => $userId,
            'now'    => $now,
            'id'     => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Report');
        }

        return $this->json(['message' => 'Report resolved']);
    }
}
