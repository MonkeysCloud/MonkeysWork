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

#[RoutePrefix('/api/v1/admin/billing')]
#[Middleware(['auth', 'role:admin'])]
final class AdminBillingController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    /* ─── Overview KPIs ─── */

    #[Route('GET', '/overview', name: 'admin.billing.overview', summary: 'Billing KPIs', tags: ['Admin'])]
    public function overview(ServerRequestInterface $request): JsonResponse
    {
        $pdo   = $this->db->pdo();
        $q     = $request->getQueryParams();
        $period = $q['period'] ?? 'month';  // week | month | year | all

        $dateFilter = $this->dateFilter($period);

        // ── Platform revenue (commissions earned)
        $revenue = $this->sumByType($pdo, 'platform_fee', 'completed', $dateFilter);

        // ── Total client fees
        $clientFees = $this->sumByType($pdo, 'client_fee', 'completed', $dateFilter);

        // ── Total funded into escrow
        $funded = $this->sumByType($pdo, 'fund', 'completed', $dateFilter);

        // ── Total released to freelancers
        $released = $this->sumByType($pdo, 'release', 'completed', $dateFilter);

        // ── Total refunded
        $refunded = $this->sumByType($pdo, 'refund', 'completed', $dateFilter);

        // ── Current escrow balance (all time)
        $escrowBal = (float) $this->sumByType($pdo, 'fund', 'completed', '')
                   - (float) $this->sumByType($pdo, 'release', 'completed', '')
                   - (float) $this->sumByType($pdo, 'refund', 'completed', '');

        // ── Total gross volume = funded + client_fees
        $grossVolume = (float) $funded + (float) $clientFees;

        // ── Payouts
        $payoutDateFilter = str_replace('et.created_at', 'created_at', $dateFilter);
        $payoutStmt = $pdo->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completed,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
             FROM \"payout\"
             WHERE 1=1 $payoutDateFilter"
        );
        $payoutStmt->execute();
        $payout = $payoutStmt->fetch(\PDO::FETCH_ASSOC);

        // ── Payout-method breakdown (Stripe vs PayPal)
        $methodStmt = $pdo->prepare(
            "SELECT
                CASE WHEN gateway_reference LIKE 'paypal:%' THEN 'paypal' ELSE 'stripe' END AS method,
                COUNT(*) AS count,
                COALESCE(SUM(amount), 0) AS total,
                COALESCE(SUM(fee), 0) AS fees
             FROM \"payout\"
             WHERE status = 'completed' $payoutDateFilter
             GROUP BY method"
        );
        $methodStmt->execute();
        $payoutByMethod = [];
        foreach ($methodStmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $payoutByMethod[$row['method']] = [
                'count' => (int) $row['count'],
                'total' => number_format((float) $row['total'], 2, '.', ''),
                'fees'  => number_format((float) $row['fees'], 2, '.', ''),
            ];
        }

        // ── Counts
        $txCount  = $this->countByFilter($pdo, 'escrowtransaction', $dateFilter);
        $invCount = $this->countByFilter($pdo, 'invoice', $dateFilter);

        // ── Active contracts & users
        $activeContracts = (int) $pdo->query(
            'SELECT COUNT(*) FROM "contract" WHERE status = \'active\''
        )->fetchColumn();
        $activeUsers = (int) $pdo->query(
            'SELECT COUNT(*) FROM "user" WHERE status = \'active\''
        )->fetchColumn();

        // ── Top clients (by funded volume, period)
        $topClients = $pdo->prepare(
            "SELECT u.id, u.display_name, u.email,
                    COALESCE(SUM(et.amount), 0) AS total_spent
             FROM \"escrowtransaction\" et
             JOIN \"contract\" c ON c.id = et.contract_id
             JOIN \"user\" u ON u.id = c.client_id
             WHERE et.type = 'fund' AND et.status = 'completed' $dateFilter
             GROUP BY u.id, u.display_name, u.email
             ORDER BY total_spent DESC LIMIT 5"
        );
        $topClients->execute();

        // ── Top freelancers (by earnings, period)
        $topFreelancers = $pdo->prepare(
            "SELECT u.id, u.display_name, u.email,
                    COALESCE(SUM(et.amount), 0) AS total_earned
             FROM \"escrowtransaction\" et
             JOIN \"contract\" c ON c.id = et.contract_id
             JOIN \"user\" u ON u.id = c.freelancer_id
             WHERE et.type = 'release' AND et.status = 'completed' $dateFilter
             GROUP BY u.id, u.display_name, u.email
             ORDER BY total_earned DESC LIMIT 5"
        );
        $topFreelancers->execute();

        return $this->json(['data' => [
            'period'             => $period,
            'platform_revenue'   => number_format((float) $revenue, 2, '.', ''),
            'client_fees'        => number_format((float) $clientFees, 2, '.', ''),
            'gross_volume'       => number_format($grossVolume, 2, '.', ''),
            'total_funded'       => number_format((float) $funded, 2, '.', ''),
            'total_released'     => number_format((float) $released, 2, '.', ''),
            'total_refunded'     => number_format((float) $refunded, 2, '.', ''),
            'escrow_balance'     => number_format($escrowBal, 2, '.', ''),
            'payouts_completed'  => number_format((float) ($payout['completed'] ?? 0), 2, '.', ''),
            'payouts_pending'    => number_format((float) ($payout['pending'] ?? 0), 2, '.', ''),
            'pending_payout_count' => (int) ($payout['pending_count'] ?? 0),
            'payout_by_method'   => $payoutByMethod,
            'transaction_count'  => $txCount,
            'invoice_count'      => $invCount,
            'active_contracts'   => $activeContracts,
            'active_users'       => $activeUsers,
            'top_clients'        => $topClients->fetchAll(\PDO::FETCH_ASSOC),
            'top_freelancers'    => $topFreelancers->fetchAll(\PDO::FETCH_ASSOC),
        ]]);
    }

    /* ─── All transactions (admin-wide) ─── */

    #[Route('GET', '/transactions', name: 'admin.billing.transactions', summary: 'All transactions', tags: ['Admin'])]
    public function transactions(ServerRequestInterface $request): JsonResponse
    {
        $p    = $this->pagination($request);
        $pdo  = $this->db->pdo();
        $q    = $request->getQueryParams();

        $where  = ['1=1'];
        $bind   = [];

        if (!empty($q['type'])) {
            $where[] = 'et.type = :type';
            $bind['type'] = $q['type'];
        }
        if (!empty($q['status'])) {
            $where[] = 'et.status = :status';
            $bind['status'] = $q['status'];
        }
        if (!empty($q['from'])) {
            $where[] = 'et.created_at >= :from_date';
            $bind['from_date'] = $q['from'];
        }
        if (!empty($q['to'])) {
            $where[] = 'et.created_at <= :to_date';
            $bind['to_date'] = $q['to'];
        }

        $w = implode(' AND ', $where);

        $cnt = $pdo->prepare("SELECT COUNT(*) FROM \"escrowtransaction\" et $w");
        $cnt->execute($bind);
        $total = (int) $cnt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT et.*, j.title AS job_title,
                    uc.display_name AS client_name,
                    uf.display_name AS freelancer_name
             FROM \"escrowtransaction\" et
             JOIN \"contract\" c ON c.id = et.contract_id
             JOIN \"job\" j ON j.id = c.job_id
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE $w
             ORDER BY et.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($bind as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ─── All invoices ─── */

    #[Route('GET', '/invoices', name: 'admin.billing.invoices', summary: 'All invoices', tags: ['Admin'])]
    public function invoices(ServerRequestInterface $request): JsonResponse
    {
        $p   = $this->pagination($request);
        $pdo = $this->db->pdo();
        $q   = $request->getQueryParams();

        $where = ['1=1'];
        $bind  = [];

        if (!empty($q['status'])) {
            $where[] = 'i.status = :status';
            $bind['status'] = $q['status'];
        }

        $w = implode(' AND ', $where);

        $cnt = $pdo->prepare("SELECT COUNT(*) FROM \"invoice\" i WHERE $w");
        $cnt->execute($bind);
        $total = (int) $cnt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT i.*, j.title AS job_title,
                    uc.display_name AS client_name,
                    uf.display_name AS freelancer_name
             FROM \"invoice\" i
             JOIN \"contract\" c ON c.id = i.contract_id
             JOIN \"job\" j ON j.id = c.job_id
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE $w
             ORDER BY i.issued_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($bind as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ─── All payouts ─── */

    #[Route('GET', '/payouts', name: 'admin.billing.payouts', summary: 'All payouts', tags: ['Admin'])]
    public function payouts(ServerRequestInterface $request): JsonResponse
    {
        $p   = $this->pagination($request);
        $pdo = $this->db->pdo();
        $q   = $request->getQueryParams();

        $where = ['1=1'];
        $bind  = [];

        if (!empty($q['status'])) {
            $where[] = 'p.status = :status';
            $bind['status'] = $q['status'];
        }

        // Method filter (stripe / paypal)
        if (!empty($q['method'])) {
            if ($q['method'] === 'paypal') {
                $where[] = "p.gateway_reference LIKE 'paypal:%'";
            } else {
                $where[] = "(p.gateway_reference IS NULL OR p.gateway_reference NOT LIKE 'paypal:%')";
            }
        }

        $w = implode(' AND ', $where);

        $cnt = $pdo->prepare("SELECT COUNT(*) FROM \"payout\" p WHERE $w");
        $cnt->execute($bind);
        $total = (int) $cnt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT p.*,
                    u.display_name AS freelancer_name,
                    u.email AS freelancer_email,
                    CASE WHEN p.gateway_reference LIKE 'paypal:%' THEN 'paypal' ELSE 'stripe' END AS method
             FROM \"payout\" p
             JOIN \"user\" u ON u.id = p.freelancer_id
             WHERE $w
             ORDER BY p.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($bind as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ─── Approve / reject payout ─── */

    #[Route('PATCH', '/payouts/{id}', name: 'admin.billing.payouts.update', summary: 'Approve/reject payout', tags: ['Admin'])]
    public function updatePayout(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data   = $this->body($request);
        $status = $data['status'] ?? null;  // approved | rejected | completed

        if (!in_array($status, ['approved', 'rejected', 'completed'], true)) {
            return $this->json(['error' => true, 'message' => 'Invalid status. Must be approved, rejected, or completed'], 422);
        }

        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $adminId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            "UPDATE \"payout\" SET status = :status, processed_at = :now, processed_by = :admin,
                    notes = COALESCE(:notes, notes), updated_at = :now2 WHERE id = :id"
        );
        $stmt->execute([
            'status' => $status,
            'now'    => $now,
            'admin'  => $adminId,
            'notes'  => $data['notes'] ?? null,
            'now2'   => $now,
            'id'     => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Payout');
        }

        return $this->json(['message' => "Payout {$status}", 'data' => ['id' => $id, 'status' => $status]]);
    }

    /* ─── Revenue report (daily/weekly breakdown) ─── */

    #[Route('GET', '/revenue-report', name: 'admin.billing.revenue', summary: 'Revenue breakdown', tags: ['Admin'])]
    public function revenueReport(ServerRequestInterface $request): JsonResponse
    {
        $pdo    = $this->db->pdo();
        $q      = $request->getQueryParams();
        $period = $q['period'] ?? 'month';    // week | month | quarter | year
        $group  = $q['group']  ?? 'day';      // day | week | month

        $dateFilter = $this->dateFilter($period);

        // Choose group-by expression
        $groupExpr = match ($group) {
            'week'  => "to_char(date_trunc('week', et.created_at), 'YYYY-\"W\"IW')",
            'month' => "to_char(et.created_at, 'YYYY-MM')",
            default => "to_char(et.created_at, 'YYYY-MM-DD')",
        };

        // Revenue breakdown (platform_fee + client_fee per period)
        $stmt = $pdo->prepare(
            "SELECT $groupExpr AS period_label,
                    COALESCE(SUM(CASE WHEN et.type = 'platform_fee' THEN et.amount ELSE 0 END), 0) AS commission_revenue,
                    COALESCE(SUM(CASE WHEN et.type = 'client_fee' THEN et.amount ELSE 0 END), 0) AS client_fee_revenue,
                    COALESCE(SUM(CASE WHEN et.type = 'fund' THEN et.amount ELSE 0 END), 0) AS volume_funded,
                    COALESCE(SUM(CASE WHEN et.type = 'release' THEN et.amount ELSE 0 END), 0) AS volume_released,
                    COUNT(*) AS tx_count
             FROM \"escrowtransaction\" et
             WHERE et.status = 'completed' $dateFilter
             GROUP BY $groupExpr
             ORDER BY $groupExpr ASC"
        );
        $stmt->execute();

        return $this->json(['data' => [
            'period' => $period,
            'group'  => $group,
            'items'  => $stmt->fetchAll(\PDO::FETCH_ASSOC),
        ]]);
    }

    /* ─── Financial report (combined payouts + revenue) ─── */

    #[Route('GET', '/financial-report', name: 'admin.billing.financialReport', summary: 'Financial report', tags: ['Admin'])]
    public function financialReport(ServerRequestInterface $request): JsonResponse
    {
        $pdo    = $this->db->pdo();
        $q      = $request->getQueryParams();
        $period = $q['period'] ?? 'month';
        $group  = $q['group']  ?? 'day';   // day | week | month

        $dateFilter = $this->dateFilter($period);
        $payoutDateFilter = str_replace('et.created_at', 'p.created_at', $dateFilter);

        // Group expression for payouts
        $groupExpr = match ($group) {
            'week'  => "to_char(date_trunc('week', p.created_at), 'YYYY-\"W\"IW')",
            'month' => "to_char(p.created_at, 'YYYY-MM')",
            default => "to_char(p.created_at, 'YYYY-MM-DD')",
        };

        // ── Payouts by method over time
        $payoutsByMethod = $pdo->prepare(
            "SELECT $groupExpr AS period_label,
                    CASE WHEN p.gateway_reference LIKE 'paypal:%' THEN 'paypal' ELSE 'stripe' END AS method,
                    COUNT(*) AS count,
                    COALESCE(SUM(p.amount), 0) AS total,
                    COALESCE(SUM(p.fee), 0) AS fees
             FROM \"payout\" p
             WHERE p.status = 'completed' $payoutDateFilter
             GROUP BY $groupExpr, method
             ORDER BY $groupExpr ASC"
        );
        $payoutsByMethod->execute();

        // ── Revenue over same period (reuse escrow tx data)
        $revGroupExpr = match ($group) {
            'week'  => "to_char(date_trunc('week', et.created_at), 'YYYY-\"W\"IW')",
            'month' => "to_char(et.created_at, 'YYYY-MM')",
            default => "to_char(et.created_at, 'YYYY-MM-DD')",
        };

        $revenueOverTime = $pdo->prepare(
            "SELECT $revGroupExpr AS period_label,
                    COALESCE(SUM(CASE WHEN et.type = 'platform_fee' THEN et.amount ELSE 0 END), 0) AS platform_revenue,
                    COALESCE(SUM(CASE WHEN et.type = 'client_fee' THEN et.amount ELSE 0 END), 0) AS client_fees
             FROM \"escrowtransaction\" et
             WHERE et.status = 'completed' $dateFilter
             GROUP BY $revGroupExpr
             ORDER BY $revGroupExpr ASC"
        );
        $revenueOverTime->execute();

        // ── Totals for summary cards
        $totals = $pdo->prepare(
            "SELECT
                COALESCE(SUM(amount), 0) AS total_payouts,
                COALESCE(SUM(fee), 0) AS total_fees,
                COALESCE(SUM(CASE WHEN gateway_reference LIKE 'paypal:%' THEN amount ELSE 0 END), 0) AS paypal_total,
                COALESCE(SUM(CASE WHEN gateway_reference NOT LIKE 'paypal:%' OR gateway_reference IS NULL THEN amount ELSE 0 END), 0) AS stripe_total,
                COUNT(*) AS payout_count
             FROM \"payout\" WHERE status = 'completed' $payoutDateFilter"
        );
        $totals->execute();
        $t = $totals->fetch(\PDO::FETCH_ASSOC);

        $revTotals = $pdo->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'platform_fee' THEN amount ELSE 0 END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN type = 'client_fee' THEN amount ELSE 0 END), 0) AS total_client_fees
             FROM \"escrowtransaction\" et
             WHERE status = 'completed' $dateFilter"
        );
        $revTotals->execute();
        $rt = $revTotals->fetch(\PDO::FETCH_ASSOC);

        $totalRevenue = (float) ($rt['total_revenue'] ?? 0) + (float) ($rt['total_client_fees'] ?? 0);
        $totalPayouts = (float) ($t['total_payouts'] ?? 0);
        $netProfit    = $totalRevenue - (float) ($t['total_fees'] ?? 0);

        return $this->json(['data' => [
            'period' => $period,
            'group'  => $group,
            'summary' => [
                'total_payouts'    => number_format($totalPayouts, 2, '.', ''),
                'total_revenue'    => number_format($totalRevenue, 2, '.', ''),
                'net_profit'       => number_format($netProfit, 2, '.', ''),
                'stripe_total'     => number_format((float) ($t['stripe_total'] ?? 0), 2, '.', ''),
                'paypal_total'     => number_format((float) ($t['paypal_total'] ?? 0), 2, '.', ''),
                'payout_fees'      => number_format((float) ($t['total_fees'] ?? 0), 2, '.', ''),
                'payout_count'     => (int) ($t['payout_count'] ?? 0),
            ],
            'payouts_by_method' => $payoutsByMethod->fetchAll(\PDO::FETCH_ASSOC),
            'revenue_over_time' => $revenueOverTime->fetchAll(\PDO::FETCH_ASSOC),
        ]]);
    }

    /* ─── Private helpers ─── */

    private function dateFilter(string $period): string
    {
        return match ($period) {
            'week'    => "AND et.created_at >= NOW() - INTERVAL '7 days'",
            'month'   => "AND et.created_at >= date_trunc('month', NOW())",
            'quarter' => "AND et.created_at >= NOW() - INTERVAL '3 months'",
            'year'    => "AND et.created_at >= date_trunc('year', NOW())",
            default   => '', // all time
        };
    }

    private function sumByType(\PDO $pdo, string $type, string $status, string $dateFilter): string
    {
        $sql = "SELECT COALESCE(SUM(amount), 0) FROM \"escrowtransaction\" et
                WHERE type = '$type' AND status = '$status' $dateFilter";
        return $pdo->query($sql)->fetchColumn();
    }

    private function countByFilter(\PDO $pdo, string $table, string $dateFilter): int
    {
        $col = $table === 'invoice' ? 'i' : 'et';
        $aliasedFilter = str_replace('et.created_at', "$col.created_at", $dateFilter);
        $sql = "SELECT COUNT(*) FROM \"$table\" $col WHERE 1=1 $aliasedFilter";
        return (int) $pdo->query($sql)->fetchColumn();
    }
}
