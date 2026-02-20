<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/stats')]
#[Middleware('auth')]
final class StatsController
{
    use ApiController;

    /** Allowed period codes → PostgreSQL interval + bucket count */
    private const PERIODS = [
        '7d'  => ['interval' => '7 days',   'bucket' => 'day',   'count' => 7,  'fmt' => 'YYYY-MM-DD'],
        '30d' => ['interval' => '30 days',  'bucket' => 'day',   'count' => 30, 'fmt' => 'YYYY-MM-DD'],
        '90d' => ['interval' => '90 days',  'bucket' => 'week',  'count' => 13, 'fmt' => 'IYYY-"W"IW'],
        '6m'  => ['interval' => '6 months', 'bucket' => 'month', 'count' => 6,  'fmt' => 'YYYY-MM'],
        '1y'  => ['interval' => '12 months','bucket' => 'month', 'count' => 12, 'fmt' => 'YYYY-MM'],
        'all' => ['interval' => null,       'bucket' => 'month', 'count' => 24, 'fmt' => 'YYYY-MM'],
    ];

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'stats.index', summary: 'Role-based dashboard stats with period filter', tags: ['Stats'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        $query  = $request->getQueryParams();
        $period = $query['period'] ?? '1y';
        if (!isset(self::PERIODS[$period])) {
            $period = '1y';
        }
        $pc = self::PERIODS[$period];

        $pdo = $this->db->pdo();

        // Determine role
        $stmt = $pdo->prepare('SELECT role FROM "user" WHERE id = :id');
        $stmt->execute(['id' => $userId]);
        $role = $stmt->fetchColumn();

        if ($role === 'freelancer') {
            return $this->json(['data' => $this->freelancerStats($pdo, $userId, $period, $pc)]);
        }

        if ($role === 'client') {
            return $this->json(['data' => $this->clientStats($pdo, $userId, $period, $pc)]);
        }

        return $this->error('Unsupported role', 400);
    }

    /* ─── Shared: build a WHERE fragment for date filtering ─── */
    private function dateFilter(?string $interval, string $column): string
    {
        if ($interval === null) {
            return ''; // 'all' — no date restriction
        }
        return " AND {$column} >= NOW() - INTERVAL '{$interval}'";
    }

    /* ─── Shared: build timeline (fills missing buckets) ─── */
    private function buildTimeline(array $rows, array $pc): array
    {
        $bucket = $pc['bucket'];
        $count  = $pc['count'];
        $byKey = [];
        foreach ($rows as $r) {
            $byKey[$r['bucket']] = (float) $r['amount'];
        }

        $timeline = [];
        for ($i = $count - 1; $i >= 0; $i--) {
            if ($bucket === 'day') {
                $key = date('Y-m-d', strtotime("-{$i} days"));
            } elseif ($bucket === 'week') {
                $dt  = new \DateTimeImmutable("-{$i} weeks");
                $key = $dt->format('o') . '-W' . $dt->format('W');
            } else {
                $key = date('Y-m', strtotime("-{$i} months"));
            }
            $timeline[] = ['bucket' => $key, 'amount' => $byKey[$key] ?? 0];
        }
        return $timeline;
    }

    /* ──────────────────────────────────────────────
     *  Freelancer stats
     * ────────────────────────────────────────────── */
    private function freelancerStats(\PDO $pdo, string $uid, string $period, array $pc): array
    {
        $dateCol   = 'created_at';
        $dateFilt  = $this->dateFilter($pc['interval'], $dateCol);

        // ── Profile overview (always lifetime) ──
        $profile = $pdo->prepare(
            'SELECT total_earnings, total_hours_logged, total_jobs_completed,
                    avg_rating, total_reviews, success_rate, profile_completeness,
                    response_rate, availability_status, hourly_rate, currency
             FROM "freelancerprofile" WHERE user_id = :id'
        );
        $profile->execute(['id' => $uid]);
        $p = $profile->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Active contracts (current, not time-filtered) ──
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM "contract" WHERE freelancer_id = :id AND status = \'active\'');
        $stmt->execute(['id' => $uid]);
        $activeContracts = (int) $stmt->fetchColumn();

        // ── Proposals breakdown ──
        $proposalStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                     AS total,
                COUNT(*) FILTER (WHERE status = 'submitted') AS pending,
                COUNT(*) FILTER (WHERE status = 'accepted')  AS accepted,
                COUNT(*) FILTER (WHERE status = 'rejected')  AS rejected,
                COUNT(*) FILTER (WHERE status = 'withdrawn') AS withdrawn,
                COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted,
                COUNT(*) FILTER (WHERE status = 'viewed')    AS viewed
             FROM \"proposal\" WHERE freelancer_id = :id{$dateFilt}"
        );
        $proposalStats->execute(['id' => $uid]);
        $proposals = $proposalStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Contracts breakdown ──
        $contractStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                      AS total,
                COUNT(*) FILTER (WHERE status = 'active')    AS active,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
                COUNT(*) FILTER (WHERE status = 'paused')    AS paused,
                COALESCE(SUM(total_amount), 0)                AS total_value,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS completed_value
             FROM \"contract\" WHERE freelancer_id = :id{$dateFilt}"
        );
        $contractStats->execute(['id' => $uid]);
        $contracts = $contractStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Earnings timeline ──
        $intervalClause = $pc['interval'] ? "AND completed_at >= NOW() - INTERVAL '{$pc['interval']}'" : '';
        $earningsTimeline = $pdo->prepare(
            "SELECT
                TO_CHAR(DATE_TRUNC('{$pc['bucket']}', completed_at), '{$pc['fmt']}') AS bucket,
                COALESCE(SUM(total_amount), 0) AS amount
             FROM \"contract\"
             WHERE freelancer_id = :id
               AND status = 'completed'
               {$intervalClause}
             GROUP BY DATE_TRUNC('{$pc['bucket']}', completed_at)
             ORDER BY bucket"
        );
        $earningsTimeline->execute(['id' => $uid]);
        $timeline = $this->buildTimeline($earningsTimeline->fetchAll(\PDO::FETCH_ASSOC), $pc);

        // ── Invoices summary ──
        $invoiceDateFilt = $this->dateFilter($pc['interval'], 'i.created_at');
        $invoiceStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                     AS total,
                COUNT(*) FILTER (WHERE i.status = 'paid')   AS paid,
                COUNT(*) FILTER (WHERE i.status IN ('draft', 'sent')) AS pending,
                COUNT(*) FILTER (WHERE i.status = 'overdue') AS overdue,
                COALESCE(SUM(i.total), 0)                    AS total_amount,
                COALESCE(SUM(i.total) FILTER (WHERE i.status = 'paid'), 0) AS paid_amount
             FROM \"invoice\" i
             JOIN \"contract\" c ON c.id = i.contract_id
             WHERE c.freelancer_id = :id{$invoiceDateFilt}"
        );
        $invoiceStats->execute(['id' => $uid]);
        $invoices = $invoiceStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Time tracking ──
        $timeDateFilt = $this->dateFilter($pc['interval'], 'te.started_at');
        $timeStats = $pdo->prepare(
            "SELECT
                COALESCE(SUM(te.duration_minutes), 0) AS total_minutes,
                COALESCE(SUM(te.duration_minutes) FILTER (
                    WHERE te.started_at >= DATE_TRUNC('week', NOW())
                ), 0) AS week_minutes
             FROM \"timeentry\" te
             WHERE te.freelancer_id = :id{$timeDateFilt}"
        );
        $timeStats->execute(['id' => $uid]);
        $time = $timeStats->fetch(\PDO::FETCH_ASSOC) ?: ['total_minutes' => 0, 'week_minutes' => 0];

        $totalHours = round((float) ($time['total_minutes'] ?? 0) / 60, 1);
        $weekHours  = round((float) ($time['week_minutes'] ?? 0) / 60, 1);

        // ── Period earnings (sum for the selected window) ──
        $periodEarnings = 0.0;
        foreach ($timeline as $t) {
            $periodEarnings += $t['amount'];
        }

        return [
            'role'   => 'freelancer',
            'period' => $period,
            'overview' => [
                'total_earnings'      => (float) ($p['total_earnings'] ?? 0),
                'period_earnings'     => $periodEarnings,
                'active_contracts'    => $activeContracts,
                'jobs_completed'      => (int) ($p['total_jobs_completed'] ?? 0),
                'avg_rating'          => (float) ($p['avg_rating'] ?? 0),
                'total_reviews'       => (int) ($p['total_reviews'] ?? 0),
                'success_rate'        => (float) ($p['success_rate'] ?? 0),
                'profile_completeness'=> (int) ($p['profile_completeness'] ?? 0),
                'response_rate'       => (float) ($p['response_rate'] ?? 0),
                'hourly_rate'         => (float) ($p['hourly_rate'] ?? 0),
                'currency'            => $p['currency'] ?? 'USD',
                'availability'        => $p['availability_status'] ?? 'unavailable',
            ],
            'proposals' => [
                'total'       => (int) ($proposals['total'] ?? 0),
                'pending'     => (int) ($proposals['pending'] ?? 0),
                'accepted'    => (int) ($proposals['accepted'] ?? 0),
                'rejected'    => (int) ($proposals['rejected'] ?? 0),
                'withdrawn'   => (int) ($proposals['withdrawn'] ?? 0),
                'shortlisted' => (int) ($proposals['shortlisted'] ?? 0),
                'viewed'      => (int) ($proposals['viewed'] ?? 0),
                'acceptance_rate' => ($proposals['total'] ?? 0) > 0
                    ? round(((int) ($proposals['accepted'] ?? 0)) / ((int) $proposals['total']) * 100, 1)
                    : 0,
            ],
            'contracts' => [
                'total'           => (int) ($contracts['total'] ?? 0),
                'active'          => (int) ($contracts['active'] ?? 0),
                'completed'       => (int) ($contracts['completed'] ?? 0),
                'cancelled'       => (int) ($contracts['cancelled'] ?? 0),
                'paused'          => (int) ($contracts['paused'] ?? 0),
                'total_value'     => (float) ($contracts['total_value'] ?? 0),
                'completed_value' => (float) ($contracts['completed_value'] ?? 0),
            ],
            'earnings_timeline' => $timeline,
            'invoices' => [
                'total'       => (int) ($invoices['total'] ?? 0),
                'paid'        => (int) ($invoices['paid'] ?? 0),
                'pending'     => (int) ($invoices['pending'] ?? 0),
                'overdue'     => (int) ($invoices['overdue'] ?? 0),
                'total_amount'=> (float) ($invoices['total_amount'] ?? 0),
                'paid_amount' => (float) ($invoices['paid_amount'] ?? 0),
            ],
            'time_tracking' => [
                'total_hours'       => $totalHours,
                'hours_this_week'   => $weekHours,
                'profile_hours'     => (float) ($p['total_hours_logged'] ?? 0),
            ],
        ];
    }

    /* ──────────────────────────────────────────────
     *  Client stats
     * ────────────────────────────────────────────── */
    private function clientStats(\PDO $pdo, string $uid, string $period, array $pc): array
    {
        $dateFilt = $this->dateFilter($pc['interval'], 'created_at');

        // ── Profile overview (always lifetime) ──
        $profile = $pdo->prepare(
            'SELECT total_jobs_posted, total_spent, avg_rating_given, total_hires,
                    payment_verified, verification_level
             FROM "clientprofile" WHERE user_id = :id'
        );
        $profile->execute(['id' => $uid]);
        $p = $profile->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Active contracts (current, not time-filtered) ──
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM "contract" WHERE client_id = :id AND status = \'active\'');
        $stmt->execute(['id' => $uid]);
        $activeContracts = (int) $stmt->fetchColumn();

        // ── Total hires (distinct freelancers with active or completed contracts) ──
        $hiresStmt = $pdo->prepare(
            "SELECT COUNT(DISTINCT freelancer_id) FROM \"contract\"
             WHERE client_id = :id AND status IN ('active', 'completed')"
        );
        $hiresStmt->execute(['id' => $uid]);
        $totalHires = (int) $hiresStmt->fetchColumn();

        // ── Jobs breakdown (proposals counted from proposal table, views from job table) ──
        $jobStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                          AS total,
                COUNT(*) FILTER (WHERE j.status = 'draft')       AS draft,
                COUNT(*) FILTER (WHERE j.status = 'open')        AS open,
                COUNT(*) FILTER (WHERE j.status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE j.status = 'completed')   AS completed,
                COUNT(*) FILTER (WHERE j.status = 'closed')      AS closed,
                COUNT(*) FILTER (WHERE j.status = 'cancelled')   AS cancelled,
                COALESCE(SUM(j.views_count), 0)                   AS total_views
             FROM \"job\" j WHERE j.client_id = :id{$dateFilt}"
        );
        $jobStats->execute(['id' => $uid]);
        $jobs = $jobStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Total proposals received (counted from actual proposal table) ──
        $totalPropStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM \"proposal\" p
             JOIN \"job\" j ON j.id = p.job_id
             WHERE j.client_id = :id"
        );
        $totalPropStmt->execute(['id' => $uid]);
        $totalProposals = (int) $totalPropStmt->fetchColumn();

        // ── Contracts breakdown ──
        $contractStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                      AS total,
                COUNT(*) FILTER (WHERE status = 'active')    AS active,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
                COUNT(*) FILTER (WHERE status = 'paused')    AS paused,
                COALESCE(SUM(total_amount), 0)                AS total_value,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS completed_value
             FROM \"contract\" WHERE client_id = :id{$dateFilt}"
        );
        $contractStats->execute(['id' => $uid]);
        $contracts = $contractStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Spending timeline ──
        $intervalClause = $pc['interval'] ? "AND completed_at >= NOW() - INTERVAL '{$pc['interval']}'" : '';
        $spendTimeline = $pdo->prepare(
            "SELECT
                TO_CHAR(DATE_TRUNC('{$pc['bucket']}', completed_at), '{$pc['fmt']}') AS bucket,
                COALESCE(SUM(total_amount), 0) AS amount
             FROM \"contract\"
             WHERE client_id = :id
               AND status = 'completed'
               {$intervalClause}
             GROUP BY DATE_TRUNC('{$pc['bucket']}', completed_at)
             ORDER BY bucket"
        );
        $spendTimeline->execute(['id' => $uid]);
        $timeline = $this->buildTimeline($spendTimeline->fetchAll(\PDO::FETCH_ASSOC), $pc);

        // ── Period spending ──
        $periodSpending = 0.0;
        foreach ($timeline as $t) {
            $periodSpending += $t['amount'];
        }

        // ── Proposals received ──
        $propDateFilt = $this->dateFilter($pc['interval'], 'p.created_at');
        $proposalStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                        AS total,
                COUNT(*) FILTER (WHERE p.status = 'submitted') AS pending,
                COUNT(*) FILTER (WHERE p.status = 'accepted')  AS accepted,
                COUNT(*) FILTER (WHERE p.status = 'rejected')  AS rejected,
                COUNT(*) FILTER (WHERE p.status = 'shortlisted') AS shortlisted,
                COALESCE(AVG(p.bid_amount), 0)                  AS avg_bid
             FROM \"proposal\" p
             JOIN \"job\" j ON j.id = p.job_id
             WHERE j.client_id = :id{$propDateFilt}"
        );
        $proposalStats->execute(['id' => $uid]);
        $proposals = $proposalStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        // ── Invoices summary ──
        $invoiceDateFilt = $this->dateFilter($pc['interval'], 'i.created_at');
        $invoiceStats = $pdo->prepare(
            "SELECT
                COUNT(*)                                     AS total,
                COUNT(*) FILTER (WHERE i.status = 'paid')   AS paid,
                COUNT(*) FILTER (WHERE i.status IN ('draft', 'sent')) AS pending,
                COUNT(*) FILTER (WHERE i.status = 'overdue') AS overdue,
                COALESCE(SUM(i.total), 0)                    AS total_amount,
                COALESCE(SUM(i.total) FILTER (WHERE i.status = 'paid'), 0) AS paid_amount
             FROM \"invoice\" i
             JOIN \"contract\" c ON c.id = i.contract_id
             WHERE c.client_id = :id{$invoiceDateFilt}"
        );
        $invoiceStats->execute(['id' => $uid]);
        $invoices = $invoiceStats->fetch(\PDO::FETCH_ASSOC) ?: [];

        return [
            'role'   => 'client',
            'period' => $period,
            'overview' => [
                'total_spent'       => (float) ($p['total_spent'] ?? 0),
                'period_spent'      => $periodSpending,
                'active_contracts'  => $activeContracts,
                'jobs_posted'       => (int) ($p['total_jobs_posted'] ?? 0),
                'total_hires'       => $totalHires,
                'avg_rating_given'  => (float) ($p['avg_rating_given'] ?? 0),
                'payment_verified'  => (bool) ($p['payment_verified'] ?? false),
                'verification_level'=> $p['verification_level'] ?? 'none',
            ],
            'jobs' => [
                'total'          => (int) ($jobs['total'] ?? 0),
                'draft'          => (int) ($jobs['draft'] ?? 0),
                'open'           => (int) ($jobs['open'] ?? 0),
                'in_progress'    => (int) ($jobs['in_progress'] ?? 0),
                'completed'      => (int) ($jobs['completed'] ?? 0),
                'closed'         => (int) ($jobs['closed'] ?? 0),
                'cancelled'      => (int) ($jobs['cancelled'] ?? 0),
                'total_proposals' => $totalProposals,
                'total_views'    => (int) ($jobs['total_views'] ?? 0),
                'avg_proposals_per_job' => ((int) ($jobs['total'] ?? 0)) > 0
                    ? round($totalProposals / ((int) $jobs['total']), 1)
                    : 0,
            ],
            'contracts' => [
                'total'           => (int) ($contracts['total'] ?? 0),
                'active'          => (int) ($contracts['active'] ?? 0),
                'completed'       => (int) ($contracts['completed'] ?? 0),
                'cancelled'       => (int) ($contracts['cancelled'] ?? 0),
                'paused'          => (int) ($contracts['paused'] ?? 0),
                'total_value'     => (float) ($contracts['total_value'] ?? 0),
                'completed_value' => (float) ($contracts['completed_value'] ?? 0),
            ],
            'spending_timeline' => $timeline,
            'proposals_received' => [
                'total'       => (int) ($proposals['total'] ?? 0),
                'pending'     => (int) ($proposals['pending'] ?? 0),
                'accepted'    => (int) ($proposals['accepted'] ?? 0),
                'rejected'    => (int) ($proposals['rejected'] ?? 0),
                'shortlisted' => (int) ($proposals['shortlisted'] ?? 0),
                'avg_bid'     => round((float) ($proposals['avg_bid'] ?? 0), 2),
            ],
            'invoices' => [
                'total'       => (int) ($invoices['total'] ?? 0),
                'paid'        => (int) ($invoices['paid'] ?? 0),
                'pending'     => (int) ($invoices['pending'] ?? 0),
                'overdue'     => (int) ($invoices['overdue'] ?? 0),
                'total_amount'=> (float) ($invoices['total_amount'] ?? 0),
                'paid_amount' => (float) ($invoices['paid_amount'] ?? 0),
            ],
        ];
    }
}
