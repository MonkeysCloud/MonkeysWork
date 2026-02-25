<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\DisputePaymentService;
use App\Service\FeeCalculator;
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
 * In production these are called by K8s CronJobs.
 * Locally they can be triggered manually via curl.
 */
#[RoutePrefix('/api/v1/cron')]
final class CronController
{
    use ApiController;

    private const INTERNAL_TOKEN_ENV = 'INTERNAL_API_TOKEN';

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── Auth helper ─────────────────────────────────────────────────── */

    private function authorizeInternal(ServerRequestInterface $request): ?JsonResponse
    {
        $expected = getenv(self::INTERNAL_TOKEN_ENV) ?: 'dev-internal-token';
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
}
