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

#[RoutePrefix('/api/v1/admin')]
#[Middleware(['auth', 'role:admin'])]
final class AdminDashboardController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '/dashboard', name: 'admin.dashboard', summary: 'KPI dashboard', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $pdo = $this->db->pdo();

        $users     = (int) $pdo->query('SELECT COUNT(*) FROM "user" WHERE deleted_at IS NULL')->fetchColumn();
        $active    = (int) $pdo->query('SELECT COUNT(*) FROM "user" WHERE status = \'active\'')->fetchColumn();
        $jobs      = (int) $pdo->query('SELECT COUNT(*) FROM "job"')->fetchColumn();
        $openJobs  = (int) $pdo->query('SELECT COUNT(*) FROM "job" WHERE status = \'open\'')->fetchColumn();
        $contracts = (int) $pdo->query('SELECT COUNT(*) FROM "contract"')->fetchColumn();
        $activeC   = (int) $pdo->query('SELECT COUNT(*) FROM "contract" WHERE status = \'active\'')->fetchColumn();
        $disputes  = (int) $pdo->query('SELECT COUNT(*) FROM "dispute" WHERE status = \'open\'')->fetchColumn();

        $revenue = $pdo->query(
            'SELECT COALESCE(SUM(amount), 0) FROM "escrowtransaction" WHERE type = \'platform_fee\' AND status = \'completed\''
        )->fetchColumn();

        return $this->json([
            'data' => [
                'total_users'      => $users,
                'active_users'     => $active,
                'total_jobs'       => $jobs,
                'open_jobs'        => $openJobs,
                'total_contracts'  => $contracts,
                'active_contracts' => $activeC,
                'open_disputes'    => $disputes,
                'platform_revenue' => (float) $revenue,
            ],
        ]);
    }
}
