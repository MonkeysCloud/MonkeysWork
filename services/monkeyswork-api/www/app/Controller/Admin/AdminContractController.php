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

#[RoutePrefix('/api/v1/admin/contracts')]
#[Middleware(['auth', 'role:admin'])]
final class AdminContractController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── List all contracts ─────────────────────────────── */

    #[Route('GET', '', name: 'admin.contracts', summary: 'All contracts', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[] = 'c.status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['type'])) {
            $where[] = 'c.contract_type = :type';
            $params['type'] = $q['type'];
        }
        if (!empty($q['search'])) {
            $where[] = '(c.title ILIKE :search OR uc.display_name ILIKE :search OR uf.display_name ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"contract\" c
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE {$w}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT c.id, c.title, c.contract_type, c.total_amount, c.hourly_rate,
                    c.currency, c.status, c.platform_fee_percent,
                    c.started_at, c.completed_at, c.created_at,
                    uc.display_name AS client_name, uc.email AS client_email,
                    uf.display_name AS freelancer_name, uf.email AS freelancer_email,
                    j.title AS job_title,
                    (SELECT COUNT(*) FROM \"milestone\" m WHERE m.contract_id = c.id) AS milestone_count,
                    (SELECT COUNT(*) FROM \"dispute\" d WHERE d.contract_id = c.id) AS dispute_count
             FROM \"contract\" c
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             LEFT JOIN \"job\" j ON j.id = c.job_id
             WHERE {$w}
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

    /* ── Contract detail ───────────────────────────────── */

    #[Route('GET', '/{id}', name: 'admin.contracts.show', summary: 'Contract detail', tags: ['Admin'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT c.*, j.title AS job_title,
                    uc.display_name AS client_name, uc.email AS client_email, uc.avatar_url AS client_avatar,
                    uf.display_name AS freelancer_name, uf.email AS freelancer_email, uf.avatar_url AS freelancer_avatar
             FROM "contract" c
             JOIN "user" uc ON uc.id = c.client_id
             JOIN "user" uf ON uf.id = c.freelancer_id
             LEFT JOIN "job" j ON j.id = c.job_id
             WHERE c.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $contract = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return $this->notFound('Contract');
        }

        // Milestones
        $ms = $this->db->pdo()->prepare(
            'SELECT id, title, amount, currency, status, escrow_funded, due_date, created_at
             FROM "milestone" WHERE contract_id = :cid ORDER BY created_at ASC'
        );
        $ms->execute(['cid' => $id]);
        $contract['milestones'] = $ms->fetchAll(\PDO::FETCH_ASSOC);

        // Disputes
        $ds = $this->db->pdo()->prepare(
            'SELECT id, reason, status, resolution_amount, created_at, resolved_at
             FROM "dispute" WHERE contract_id = :cid ORDER BY created_at DESC'
        );
        $ds->execute(['cid' => $id]);
        $contract['disputes'] = $ds->fetchAll(\PDO::FETCH_ASSOC);

        // Escrow summary
        $esc = $this->db->pdo()->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'fund' THEN amount ELSE 0 END), 0) AS total_funded,
                COALESCE(SUM(CASE WHEN type = 'release' THEN amount ELSE 0 END), 0) AS total_released,
                COALESCE(SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END), 0) AS total_refunded,
                COALESCE(SUM(CASE WHEN type = 'platform_fee' THEN amount ELSE 0 END), 0) AS platform_fees
             FROM \"escrowtransaction\" WHERE contract_id = :cid AND status = 'completed'"
        );
        $esc->execute(['cid' => $id]);
        $contract['escrow'] = $esc->fetch(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $contract]);
    }

    /* ── Force status change ───────────────────────────── */

    #[Route('PATCH', '/{id}/status', name: 'admin.contracts.status', summary: 'Force contract status', tags: ['Admin'])]
    public function updateStatus(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['status'])) {
            return $this->error('status is required');
        }

        $allowed = ['active', 'completed', 'cancelled', 'suspended', 'disputed'];
        if (!in_array($data['status'], $allowed, true)) {
            return $this->error('Invalid status. Allowed: ' . implode(', ', $allowed));
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $extra = '';
        $params = ['status' => $data['status'], 'now' => $now, 'id' => $id];

        if ($data['status'] === 'completed') {
            $extra = ', completed_at = :comp';
            $params['comp'] = $now;
        } elseif ($data['status'] === 'cancelled') {
            $extra = ', cancelled_at = :canc, cancellation_reason = :reason';
            $params['canc'] = $now;
            $params['reason'] = $data['reason'] ?? 'Admin action';
        }

        $stmt = $this->db->pdo()->prepare(
            "UPDATE \"contract\" SET status = :status, updated_at = :now{$extra} WHERE id = :id"
        );
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Contract');
        }

        return $this->json(['message' => "Contract status updated to {$data['status']}"]);
    }

    /* ── Contract report ───────────────────────────────── */

    #[Route('GET', '/report', name: 'admin.contracts.report', summary: 'Contract stats over time', tags: ['Admin'])]
    public function report(ServerRequestInterface $request): JsonResponse
    {
        $pdo = $this->db->pdo();
        $q = $request->getQueryParams();
        $period = $q['period'] ?? 'month';
        $group = $q['group'] ?? 'day';

        $dateFilter = $this->dateFilter($period, 'c.created_at');

        $groupExpr = match ($group) {
            'week' => "to_char(date_trunc('week', c.created_at), 'YYYY-\"W\"IW')",
            'month' => "to_char(c.created_at, 'YYYY-MM')",
            default => "to_char(c.created_at, 'YYYY-MM-DD')",
        };

        // Contracts created over time by status
        $stmt = $pdo->prepare(
            "SELECT $groupExpr AS period_label,
                    COUNT(*) AS total_created,
                    COUNT(*) FILTER (WHERE c.status = 'active') AS active,
                    COUNT(*) FILTER (WHERE c.status = 'completed') AS completed,
                    COUNT(*) FILTER (WHERE c.status = 'cancelled') AS cancelled,
                    COUNT(*) FILTER (WHERE c.status = 'disputed') AS disputed,
                    COUNT(*) FILTER (WHERE c.contract_type = 'fixed') AS fixed_type,
                    COUNT(*) FILTER (WHERE c.contract_type = 'hourly') AS hourly_type,
                    COALESCE(SUM(c.total_amount), 0) AS total_value
             FROM \"contract\" c
             WHERE 1=1 $dateFilter
             GROUP BY $groupExpr
             ORDER BY $groupExpr ASC"
        );
        $stmt->execute();

        // Summary totals
        $totals = $pdo->prepare(
            "SELECT
                COUNT(*) AS total_contracts,
                COUNT(*) FILTER (WHERE status = 'active') AS active_contracts,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_contracts,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_contracts,
                COUNT(*) FILTER (WHERE status = 'disputed') AS disputed_contracts,
                COALESCE(SUM(total_amount), 0) AS total_value,
                COALESCE(AVG(total_amount), 0) AS avg_value
             FROM \"contract\" WHERE 1=1 " . $this->dateFilter($period, 'created_at')
        );
        $totals->execute();

        return $this->json([
            'data' => [
                'period' => $period,
                'group' => $group,
                'summary' => $totals->fetch(\PDO::FETCH_ASSOC),
                'items' => $stmt->fetchAll(\PDO::FETCH_ASSOC),
            ]
        ]);
    }

    /* ── Helpers ────────────────────────────────────────── */

    private function dateFilter(string $period, string $col = 'c.created_at'): string
    {
        return match ($period) {
            'week' => " AND $col >= NOW() - INTERVAL '7 days'",
            'month' => " AND $col >= NOW() - INTERVAL '1 month'",
            'quarter' => " AND $col >= NOW() - INTERVAL '3 months'",
            'year' => " AND $col >= NOW() - INTERVAL '1 year'",
            default => '',
        };
    }
}
