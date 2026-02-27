<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\DisputePaymentService;
use App\Service\FeeCalculator;
use App\Service\MonkeysMailService;
use App\Service\StripeService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Cron / scheduled-task endpoints.
 *
 * No JWT middleware — authenticated via X-Internal-Token header
 * (same pattern as InternalController).
 *
 * All batch-heavy endpoints process users in chunks (BATCH_SIZE)
 * to avoid memory/timeout issues at scale.
 *
 * In production these are called by K8s CronJobs.
 * Locally they can be triggered manually via curl.
 */
#[RoutePrefix('/api/v1/cron')]
final class CronController
{
    use ApiController;

    private const INTERNAL_TOKEN_ENV = 'INTERNAL_API_TOKEN';
    private const BATCH_SIZE = 50;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── Auth helper ─────────────────────────────────────────────────── */

    private function authorizeInternal(ServerRequestInterface $request): ?JsonResponse
    {
        $expected = $_ENV[self::INTERNAL_TOKEN_ENV] ?? getenv(self::INTERNAL_TOKEN_ENV) ?: 'dev-internal-token';
        $provided = $request->getHeaderLine('X-Internal-Token');

        if ($provided !== $expected) {
            return $this->error('Unauthorized', 401);
        }
        return null;
    }

    /* ── Monday: charge clients for approved hourly timesheets ──────── */

    #[Route('POST', '/charge-weekly', name: 'cron.chargeWeekly', summary: 'Monday: charge hourly timesheets', tags: ['Cron'])]
    public function chargeWeekly(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request))
            return $err;

        $billing = new BillingController($this->db);
        return $billing->chargeWeekly($request);
    }

    /* ── Friday: pay freelancers ────────────────────────────────────── */

    #[Route('POST', '/payout-weekly', name: 'cron.payoutWeekly', summary: 'Friday: freelancer payouts', tags: ['Cron'])]
    public function payoutWeekly(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request))
            return $err;

        $billing = new BillingController($this->db);
        return $billing->payoutWeekly($request);
    }

    /* ── Daily: check dispute deadlines ─────────────────────────────── */

    #[Route('POST', '/check-deadlines', name: 'cron.checkDeadlines', summary: 'Daily: auto-escalate stale disputes', tags: ['Cron'])]
    public function checkDeadlines(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request))
            return $err;

        $disputes = new DisputeController($this->db);
        return $disputes->checkDeadlines($request);
    }

    /* ── Daily: recommend jobs for freelancers (batch processed) ────── */

    #[Route('POST', '/recommend-jobs', name: 'cron.recommendJobs', summary: 'Daily: send job recommendations to freelancers', tags: ['Cron'])]
    public function recommendJobs(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request))
            return $err;

        $pdo = $this->db->pdo();
        $mail = new MonkeysMailService();
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';

        $sent = 0;
        $skipped = 0;
        $errors = 0;
        $offset = 0;
        $startTime = microtime(true);

        error_log('[Cron][recommend-jobs] Starting daily job recommendations...');

        // Process freelancers in batches
        while (true) {
            $batchStmt = $pdo->prepare("
                SELECT u.id, u.email, u.display_name, u.country, u.metadata
                FROM \"user\" u
                WHERE u.role = 'freelancer'
                  AND u.status = 'active'
                  AND u.deleted_at IS NULL
                  -- Skip users who opted out of job_recommendations
                  AND NOT EXISTS (
                      SELECT 1 FROM \"email_preference\" ep
                      WHERE ep.user_id = u.id AND ep.job_recommendations = false
                  )
                ORDER BY u.id
                LIMIT :limit OFFSET :offset
            ");
            $batchStmt->bindValue('limit', self::BATCH_SIZE, \PDO::PARAM_INT);
            $batchStmt->bindValue('offset', $offset, \PDO::PARAM_INT);
            $batchStmt->execute();
            $freelancers = $batchStmt->fetchAll(\PDO::FETCH_ASSOC);

            if (empty($freelancers)) {
                break; // No more freelancers
            }

            error_log('[Cron][recommend-jobs] Processing batch offset=' . $offset . ' count=' . count($freelancers));

            foreach ($freelancers as $fl) {
                try {
                    $jobs = $this->getTopRecommendations($pdo, $fl, 5);

                    if (empty($jobs)) {
                        $skipped++;
                        continue;
                    }

                    // Format jobs for email template
                    $emailJobs = array_map(function ($job) use ($frontendUrl) {
                        $budget = '';
                        if ($job['budget_type'] === 'fixed') {
                            $budget = '$' . number_format((float) ($job['budget_min'] ?? 0), 0) . ' Fixed';
                        } elseif ($job['budget_min'] || $job['budget_max']) {
                            $budget = '$' . number_format((float) ($job['budget_min'] ?? 0), 0)
                                . ' - $' . number_format((float) ($job['budget_max'] ?? 0), 0) . '/hr';
                        }

                        return [
                            'title' => $job['title'],
                            'budget' => $budget,
                            'description' => $job['description'] ?? '',
                            'url' => "{$frontendUrl}/jobs/" . ($job['slug'] ?? $job['id']),
                        ];
                    }, $jobs);

                    $mail->sendTemplate(
                        $fl['email'],
                        'Jobs Recommended For You — MonkeysWorks',
                        'daily-jobs',
                        [
                            'userName' => $fl['display_name'] ?? 'there',
                            'jobs' => $emailJobs,
                            'jobsUrl' => "{$frontendUrl}/dashboard/jobs",
                        ],
                        ['cron', 'job-recommendations'],
                    );
                    $sent++;
                } catch (\Throwable $e) {
                    $errors++;
                    error_log('[Cron][recommend-jobs] Error for user ' . $fl['id'] . ': ' . $e->getMessage());
                }
            }

            $offset += self::BATCH_SIZE;

            // Safety: break if running too long (4 min)
            if ((microtime(true) - $startTime) > 240) {
                error_log('[Cron][recommend-jobs] Time limit reached at offset=' . $offset);
                break;
            }
        }

        $elapsed = round(microtime(true) - $startTime, 2);
        error_log("[Cron][recommend-jobs] Done: sent={$sent} skipped={$skipped} errors={$errors} elapsed={$elapsed}s");

        return $this->json([
            'data' => [
                'sent' => $sent,
                'skipped' => $skipped,
                'errors' => $errors,
                'elapsed_seconds' => $elapsed,
            ],
        ]);
    }

    /* ── Private: get top N recommended jobs for a freelancer ──────── */

    private function getTopRecommendations(\PDO $pdo, array $freelancer, int $limit = 5): array
    {
        $userId = $freelancer['id'];
        $meta = json_decode($freelancer['metadata'] ?? '{}', true) ?: [];
        $hourlyRate = (float) ($meta['hourly_rate'] ?? 0);
        $primarySkill = $meta['primary_skill'] ?? '';
        $country = strtoupper(trim($freelancer['country'] ?? ''));

        // Get freelancer skills
        $fsStmt = $pdo->prepare('SELECT skill_id FROM freelancer_skills WHERE freelancer_id = :uid');
        $fsStmt->execute(['uid' => $userId]);
        $skillIds = $fsStmt->fetchAll(\PDO::FETCH_COLUMN);

        if (empty($skillIds) && $primarySkill) {
            $psStmt = $pdo->prepare("SELECT id FROM skill WHERE LOWER(name) = LOWER(:ps) LIMIT 1");
            $psStmt->execute(['ps' => $primarySkill]);
            $psId = $psStmt->fetchColumn();
            if ($psId)
                $skillIds = [$psId];
        }

        $skillIdsParam = '{' . implode(',', $skillIds) . '}';
        $countryJson = json_encode([$country]);

        // Simplified scoring query — top N matches from open jobs
        $sql = "
        WITH skill_match AS (
            SELECT j.id AS job_id,
                   COUNT(DISTINCT js.skill_id) FILTER (WHERE js.skill_id = ANY(:skill_ids::uuid[])) AS matched,
                   GREATEST((SELECT COUNT(*) FROM job_skills WHERE job_id = j.id), 1) AS total
            FROM \"job\" j
            LEFT JOIN job_skills js ON js.job_id = j.id
            WHERE j.status = 'open'
              AND j.client_id != :uid
              AND NOT EXISTS (SELECT 1 FROM proposal WHERE job_id = j.id AND freelancer_id = :uid2)
              AND j.published_at >= NOW() - INTERVAL '7 days'
            GROUP BY j.id
        )
        SELECT j.id, j.title, j.slug, j.budget_type, j.budget_min, j.budget_max, j.description
        FROM \"job\" j
        JOIN skill_match sm ON sm.job_id = j.id
        WHERE sm.matched > 0 OR :rate > 0
        ORDER BY (
            CASE WHEN sm.total > 0 THEN sm.matched::numeric / sm.total * 100 ELSE 50 END * 0.5 +
            CASE
                WHEN :rate2 <= 0 THEN 50
                WHEN j.budget_type = 'fixed' THEN 50
                WHEN :rate3 BETWEEN COALESCE(j.budget_min, 0) AND COALESCE(j.budget_max, 999999) THEN 100
                ELSE 30
            END * 0.3 +
            CASE
                WHEN j.location_type = 'worldwide' THEN 100
                WHEN j.location_type = 'countries' AND :country != '' AND j.location_countries @> (:country_json)::jsonb THEN 100
                ELSE 40
            END * 0.2
        ) DESC, j.published_at DESC NULLS LAST
        LIMIT :lim
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('uid2', $userId);
        $stmt->bindValue('skill_ids', $skillIdsParam);
        $stmt->bindValue('rate', $hourlyRate);
        $stmt->bindValue('rate2', $hourlyRate);
        $stmt->bindValue('rate3', $hourlyRate);
        $stmt->bindValue('country', $country);
        $stmt->bindValue('country_json', $countryJson);
        $stmt->bindValue('lim', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
