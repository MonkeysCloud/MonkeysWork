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

#[RoutePrefix('/api/v1/admin/activity-log')]
#[Middleware(['auth', 'role:admin'])]
final class AdminActivityController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'admin.activity', summary: 'Audit trail', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request, 50);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['user_id'])) {
            $where[]           = 'al.user_id = :uid';
            $params['uid']     = $q['user_id'];
        }
        if (!empty($q['action'])) {
            $where[]           = 'al.action = :action';
            $params['action']  = $q['action'];
        }
        if (!empty($q['entity_type'])) {
            $where[]           = 'al.entity_type = :et';
            $params['et']      = $q['entity_type'];
        }
        if (!empty($q['from'])) {
            $where[]           = 'al.created_at >= :from';
            $params['from']    = $q['from'];
        }
        if (!empty($q['to'])) {
            $where[]           = 'al.created_at <= :to';
            $params['to']      = $q['to'];
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"activitylog\" al WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT al.*, u.display_name AS user_name
             FROM \"activitylog\" al
             LEFT JOIN \"user\" u ON u.id = al.user_id
             WHERE {$w} ORDER BY al.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }
}
