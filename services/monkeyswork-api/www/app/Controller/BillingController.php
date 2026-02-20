<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\DisputePaymentService;
use App\Service\FeeCalculator;
use App\Service\StripeService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/billing')]
#[Middleware('auth')]
final class BillingController
{
    use ApiController;

    private ?StripeService  $stripe = null;
    private ?FeeCalculator  $fees   = null;
    private ?DisputePaymentService $disputePayments = null;

    public function __construct(private ConnectionInterface $db) {}

    private function stripe(): StripeService
    {
        return $this->stripe ??= new StripeService();
    }

    private function fees(): FeeCalculator
    {
        return $this->fees ??= new FeeCalculator();
    }

    private function disputePayments(): DisputePaymentService
    {
        return $this->disputePayments ??= new DisputePaymentService($this->db->pdo());
    }

    /* ─── Summary for current user ─── */

    #[Route('GET', '/summary', name: 'billing.summary', summary: 'Billing summary', tags: ['Billing'])]
    public function summary(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();

            // Escrow balance (as client)
            $escrow = $pdo->prepare(
                'SELECT
                     COALESCE(SUM(CASE WHEN et.type = \'fund\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0)  AS total_funded,
                     COALESCE(SUM(CASE WHEN et.type = \'release\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_released,
                     COALESCE(SUM(CASE WHEN et.type = \'refund\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_refunded,
                     COALESCE(SUM(CASE WHEN et.type = \'platform_fee\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_fees,
                     COALESCE(SUM(CASE WHEN et.type = \'client_fee\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_client_fees
                 FROM "escrowtransaction" et
                 JOIN "contract" c ON c.id = et.contract_id
                 WHERE c.client_id = :uid1 OR c.freelancer_id = :uid2'
            );
            $escrow->execute(['uid1' => $userId, 'uid2' => $userId]);
            $e = $escrow->fetch(\PDO::FETCH_ASSOC);

            $balance = ((float) ($e['total_funded'] ?? 0))
                     - ((float) ($e['total_released'] ?? 0))
                     - ((float) ($e['total_refunded'] ?? 0));

            // This month's spending (as client)
            $month = $pdo->prepare(
                'SELECT COALESCE(SUM(et.amount), 0) AS month_total
                 FROM "escrowtransaction" et
                 JOIN "contract" c ON c.id = et.contract_id
                 WHERE c.client_id = :uid AND et.type = \'fund\' AND et.status = \'completed\'
                   AND et.created_at >= date_trunc(\'month\', NOW())'
            );
            $month->execute(['uid' => $userId]);
            $monthTotal = $month->fetchColumn();

            // Available earnings (as freelancer) = released - platform_fees
            $earnings = $pdo->prepare(
                'SELECT COALESCE(SUM(CASE WHEN et.type = \'release\' THEN et.amount ELSE 0 END), 0) AS total_earned,
                        COALESCE(SUM(CASE WHEN et.type = \'platform_fee\' THEN et.amount ELSE 0 END), 0) AS total_commission
                 FROM "escrowtransaction" et
                 JOIN "contract" c ON c.id = et.contract_id
                 WHERE c.freelancer_id = :uid AND et.status = \'completed\''
            );
            $earnings->execute(['uid' => $userId]);
            $earn = $earnings->fetch(\PDO::FETCH_ASSOC);

            // Pending payouts
            $pendingPayoutAmount = '0.00';
            try {
                $pendingPayouts = $pdo->prepare(
                    'SELECT COALESCE(SUM(amount), 0) AS pending FROM "payout"
                     WHERE freelancer_id = :uid AND status = \'pending\''
                );
                $pendingPayouts->execute(['uid' => $userId]);
                $pendingPayoutAmount = $pendingPayouts->fetchColumn() ?: '0.00';
            } catch (\Throwable $e2) {
                error_log('[BillingController] payout table query failed: ' . $e2->getMessage());
            }

            // Active contracts count
            $contracts = $pdo->prepare(
                'SELECT COUNT(*) FROM "contract" WHERE (client_id = :uid1 OR freelancer_id = :uid2) AND status = \'active\''
            );
            $contracts->execute(['uid1' => $userId, 'uid2' => $userId]);

            return $this->json(['data' => [
                'escrow_balance'      => number_format($balance, 2, '.', ''),
                'month_spending'      => number_format((float) $monthTotal, 2, '.', ''),
                'total_funded'        => $e['total_funded'] ?? '0.00',
                'total_released'      => $e['total_released'] ?? '0.00',
                'total_fees_paid'     => number_format(
                    (float) ($e['total_fees'] ?? 0) + (float) ($e['total_client_fees'] ?? 0), 2, '.', ''
                ),
                'total_earned'        => $earn['total_earned'] ?? '0.00',
                'total_commission'    => $earn['total_commission'] ?? '0.00',
                'net_earnings'        => number_format(
                    (float) ($earn['total_earned'] ?? 0) - (float) ($earn['total_commission'] ?? 0), 2, '.', ''
                ),
                'pending_payouts'     => $pendingPayoutAmount,
                'active_contracts'    => (int) $contracts->fetchColumn(),
                'disputed_amount'     => $this->getDisputedAmount($userId, $pdo),
            ]]);
        } catch (\Throwable $ex) {
            error_log('[BillingController] summary ERROR: ' . $ex->getMessage() . ' in ' . $ex->getFile() . ':' . $ex->getLine());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    /* ─── Transaction history ─── */

    #[Route('GET', '/transactions', name: 'billing.transactions', summary: 'Payment history', tags: ['Billing'])]
    public function transactions(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);
        $pdo    = $this->db->pdo();

        $params = $request->getQueryParams();
        $type   = $params['type'] ?? null;  // fund, release, refund, platform_fee, client_fee

        $where = 'WHERE (c.client_id = :uid OR c.freelancer_id = :uid)';
        $bind  = ['uid' => $userId];
        if ($type) {
            $where .= ' AND et.type = :type';
            $bind['type'] = $type;
        }

        $cnt = $pdo->prepare("SELECT COUNT(*) FROM \"escrowtransaction\" et JOIN \"contract\" c ON c.id = et.contract_id $where");
        $cnt->execute($bind);
        $total = (int) $cnt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT et.*, j.title AS job_title, c.client_id, c.freelancer_id
             FROM \"escrowtransaction\" et
             JOIN \"contract\" c ON c.id = et.contract_id
             JOIN \"job\" j ON j.id = c.job_id
             $where
             ORDER BY et.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($bind as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ─── Fee rates for a contract ─── */

    #[Route('GET', '/fee-rate/{contractId}', name: 'billing.feeRate', summary: 'Current fee rate', tags: ['Billing'])]
    public function feeRate(ServerRequestInterface $request, string $contractId): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare('SELECT client_id, freelancer_id FROM "contract" WHERE id = :cid');
        $stmt->execute(['cid' => $contractId]);
        $contract = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return $this->notFound('Contract');
        }

        $rate = $this->fees()->getEffectiveRate($contract['client_id'], $contract['freelancer_id'], $pdo);

        return $this->json(['data' => array_merge($rate, [
            'client_fee_rate' => '5%',
        ])]);
    }

    /* ─── Weekly billing cron (Monday) ─── */

    #[Route('POST', '/charge-weekly', name: 'billing.chargeWeekly', summary: 'Weekly hourly billing cron', tags: ['Billing'])]
    public function chargeWeekly(ServerRequestInterface $request): JsonResponse
    {
        $pdo    = $this->db->pdo();
        $results = [];

        // Find approved timesheets not yet billed (from the last 7 days)
        $stmt = $pdo->prepare(
            'SELECT wt.id AS timesheet_id, wt.contract_id, wt.total_hours, wt.total_amount,
                    c.client_id, c.freelancer_id, c.hourly_rate, c.title AS contract_title
             FROM "weeklytimesheet" wt
             JOIN "contract" c ON c.id = wt.contract_id
             WHERE wt.status = \'approved\'
               AND wt.billed = false
             ORDER BY wt.week_start ASC'
        );
        $stmt->execute();
        $timesheets = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($timesheets as $ts) {
            try {
                $amount = (float) $ts['total_amount'];
                if ($amount <= 0) continue;

                $clientFee   = $this->fees()->calculateClientFee($ts['total_amount']);
                $totalCharge = $this->fees()->totalClientCharge($ts['total_amount']);
                $amountCents = $this->fees()->toCents($totalCharge);

                // Get client's default payment method
                $pm = $this->getDefaultPaymentMethod($ts['client_id'], $pdo);
                if (!$pm) {
                    $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                    $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'fund_failed',
                        $ts['total_amount'], 'failed', null, $now,
                        ['error' => 'No payment method on file']);
                    $this->notifyChargeFailed($pdo,
                        $ts['client_id'], $ts['contract_id'], $ts['contract_title'],
                        'No payment method on file', $now);
                    $results[] = ['timesheet' => $ts['timesheet_id'], 'error' => 'No payment method'];
                    continue;
                }

                // Get Stripe customer
                $customerStmt = $pdo->prepare('SELECT stripe_customer_id FROM "user" WHERE id = :uid');
                $customerStmt->execute(['uid' => $ts['client_id']]);
                $customerId = $customerStmt->fetchColumn();

                if (!$customerId) {
                    $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                    $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'fund_failed',
                        $ts['total_amount'], 'failed', null, $now,
                        ['error' => 'No Stripe customer']);
                    $this->notifyChargeFailed($pdo,
                        $ts['client_id'], $ts['contract_id'], $ts['contract_title'],
                        'No Stripe customer configured', $now);
                    $results[] = ['timesheet' => $ts['timesheet_id'], 'error' => 'No Stripe customer'];
                    continue;
                }

                // Charge via Stripe
                $pi = $this->stripe()->createPaymentIntent(
                    $amountCents,
                    'usd',
                    $customerId,
                    $pm['stripe_payment_method_id'],
                    [
                        'mw_type'        => 'weekly_billing',
                        'mw_timesheet'   => $ts['timesheet_id'],
                        'mw_contract'    => $ts['contract_id'],
                    ]
                );

                $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

                // Record escrow fund transaction
                $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'fund',
                    $ts['total_amount'], 'completed', $pi->id, $now);

                // Record client fee transaction
                $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'client_fee',
                    $clientFee, 'completed', $pi->id, $now);

                // Auto-generate invoice
                $this->autoGenerateInvoice($pdo, $ts['contract_id'], $ts['total_amount'],
                    $clientFee, $ts['contract_title'] . ' — Weekly billing', $now);

                // Mark timesheet as billed
                $pdo->prepare('UPDATE "weeklytimesheet" SET billed = true, updated_at = :now WHERE id = :id')
                    ->execute(['now' => $now, 'id' => $ts['timesheet_id']]);

                $results[] = [
                    'timesheet' => $ts['timesheet_id'],
                    'charged'   => $totalCharge,
                    'stripe_pi' => $pi->id,
                ];
            } catch (\Throwable $e) {
                $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'fund_failed',
                    $ts['total_amount'], 'failed', null, $now,
                    ['error' => $e->getMessage()]);
                $this->notifyChargeFailed($pdo,
                    $ts['client_id'], $ts['contract_id'], $ts['contract_title'],
                    $e->getMessage(), $now);
                $results[] = ['timesheet' => $ts['timesheet_id'], 'error' => $e->getMessage()];
                error_log('[BillingController] chargeWeekly ERROR: ' . $e->getMessage());
            }
        }

        return $this->json([
            'data' => [
                'processed' => count($results),
                'results'   => $results,
            ],
        ]);
    }

    /* ─── Friday payout cron ─── */

    #[Route('POST', '/payout-weekly', name: 'billing.payoutWeekly', summary: 'Friday freelancer payout cron', tags: ['Billing'])]
    public function payoutWeekly(ServerRequestInterface $request): JsonResponse
    {
        $pdo     = $this->db->pdo();
        $results = [];

        try {
            // Find all freelancers with active/completed contracts who have payout set up
            // (either Stripe Connect or PayPal)
            $freelancers = $pdo->query(
                'SELECT DISTINCT u.id, u.display_name, u.stripe_connect_account_id,
                        u.stripe_connect_onboarded
                 FROM "user" u
                 JOIN "contract" c ON c.freelancer_id = u.id
                 WHERE c.status IN (\'active\', \'completed\')
                   AND (
                       (u.stripe_connect_onboarded = true AND u.stripe_connect_account_id IS NOT NULL)
                       OR EXISTS (
                           SELECT 1 FROM "paymentmethod" pm
                           WHERE pm.user_id = u.id AND pm.type = \'paypal\' AND pm.is_active = true
                       )
                   )'
            )->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($freelancers as $fl) {
                try {
                    // Calculate available balance:
                    //   released - platform_fees - already_paid_out
                    $balStmt = $pdo->prepare(
                        'SELECT
                             COALESCE(SUM(CASE WHEN et.type = \'release\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS released,
                             COALESCE(SUM(CASE WHEN et.type = \'platform_fee\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS fees
                         FROM "escrowtransaction" et
                         JOIN "contract" c ON c.id = et.contract_id
                         WHERE c.freelancer_id = :uid'
                    );
                    $balStmt->execute(['uid' => $fl['id']]);
                    $bal = $balStmt->fetch(\PDO::FETCH_ASSOC);

                    // Previous payouts already sent
                    $paidStmt = $pdo->prepare(
                        'SELECT COALESCE(SUM(amount), 0) FROM "payout"
                         WHERE freelancer_id = :uid AND status IN (\'completed\', \'pending\')'
                    );
                    $paidStmt->execute(['uid' => $fl['id']]);
                    $alreadyPaid = (float) $paidStmt->fetchColumn();

                    $available = (float) $bal['released'] - (float) $bal['fees'] - $alreadyPaid;

                    if ($available < 1.00) {
                        continue; // Skip if less than $1
                    }

                    // ── Check for unbilled timesheets (client payment failed) ──
                    $unbilledStmt = $pdo->prepare(
                        'SELECT wt.id, c.title AS contract_title, wt.total_amount
                         FROM "weeklytimesheet" wt
                         JOIN "contract" c ON c.id = wt.contract_id
                         WHERE c.freelancer_id = :uid
                           AND wt.status = \'approved\'
                           AND wt.billed = false'
                    );
                    $unbilledStmt->execute(['uid' => $fl['id']]);
                    $unbilled = $unbilledStmt->fetchAll(\PDO::FETCH_ASSOC);

                    if (!empty($unbilled)) {
                        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                        $contracts = array_unique(array_column($unbilled, 'contract_title'));
                        $contractList = implode(', ', $contracts);
                        $unpaidTotal = array_sum(array_column($unbilled, 'total_amount'));

                        // Record delayed payout
                        $payoutId = $this->uuid();
                        $pdo->prepare(
                            'INSERT INTO "payout"
                                (id, freelancer_id, amount, currency, fee, net_amount, status,
                                 failure_reason, created_at)
                             VALUES (:id, :uid, :amt, \'USD\', \'0.00\', :net, \'delayed\', :reason, :now)'
                        )->execute([
                            'id'     => $payoutId,
                            'uid'    => $fl['id'],
                            'amt'    => number_format($available, 2, '.', ''),
                            'net'    => number_format($available, 2, '.', ''),
                            'reason' => "Client payment pending for: {$contractList} (unpaid: \${$unpaidTotal})",
                            'now'    => $now,
                        ]);

                        // Notify freelancer about delayed payout
                        $this->notifyPayoutDelayed($pdo, $fl['id'], $contractList, $available, $now);

                        $results[] = [
                            'freelancer' => $fl['id'],
                            'name'       => $fl['display_name'],
                            'status'     => 'delayed',
                            'reason'     => "Unpaid timesheets on: {$contractList}",
                        ];
                        continue;
                    }

                    // ── Check for active disputes blocking payout ──
                    $activeDisputes = $this->disputePayments()->getActiveDisputesForFreelancer($fl['id']);
                    if ($activeDisputes !== null) {
                        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
                        $disputeContracts = array_unique(array_column($activeDisputes, 'contract_title'));
                        $contractList = implode(', ', $disputeContracts);

                        // Record delayed payout due to dispute
                        $payoutId = $this->uuid();
                        $pdo->prepare(
                            'INSERT INTO "payout"
                                (id, freelancer_id, amount, currency, fee, net_amount, status,
                                 failure_reason, created_at)
                             VALUES (:id, :uid, :amt, \'USD\', \'0.00\', :net, \'delayed\', :reason, :now)'
                        )->execute([
                            'id'     => $payoutId,
                            'uid'    => $fl['id'],
                            'amt'    => number_format($available, 2, '.', ''),
                            'net'    => number_format($available, 2, '.', ''),
                            'reason' => "Active dispute(s) on: {$contractList}",
                            'now'    => $now,
                        ]);

                        // Notify freelancer
                        $this->disputePayments()->notifyDisputeHold($fl['id'], $contractList, $now);

                        $results[] = [
                            'freelancer' => $fl['id'],
                            'name'       => $fl['display_name'],
                            'status'     => 'delayed',
                            'reason'     => "Active dispute(s) on: {$contractList}",
                        ];
                        continue;
                    }

                    // Determine preferred payout method for this freelancer
                    $methodStmt = $pdo->prepare(
                        'SELECT type, metadata FROM "paymentmethod"
                         WHERE user_id = :uid AND is_active = true
                         ORDER BY is_default DESC, created_at DESC LIMIT 1'
                    );
                    $methodStmt->execute(['uid' => $fl['id']]);
                    $defaultMethod = $methodStmt->fetch(\PDO::FETCH_ASSOC);

                    $payoutType = $defaultMethod['type'] ?? 'bank_transfer';
                    $metadata   = $defaultMethod['metadata'] ? json_decode($defaultMethod['metadata'], true) : [];
                    $gatewayRef = '';
                    $fee        = '0.00';

                    if ($payoutType === 'paypal' && !empty($metadata['paypal_email'])) {
                        // ── PayPal Payout ──
                        $paypalFee = $available * 0.01; // 1% PayPal fee
                        $netAmount = $available - $paypalFee;
                        $fee       = number_format($paypalFee, 2, '.', '');

                        $paypal = new \App\Service\PayPalService();
                        $result = $paypal->createPayout(
                            $metadata['paypal_email'],
                            $netAmount,
                            'USD',
                            'MonkeysWork weekly payout',
                            'mw_' . $fl['id'] . '_' . date('Ymd'),
                        );
                        $gatewayRef = 'paypal:' . $result['batch_id'];
                    } else {
                        // ── Stripe Connect Transfer (default) ──
                        if (empty($fl['stripe_connect_account_id']) || !$fl['stripe_connect_onboarded']) {
                            error_log('[BillingController] payoutWeekly: freelancer ' . $fl['id'] . ' has no Stripe account, skipping');
                            continue;
                        }

                        $amountCents = $this->fees()->toCents(number_format($available, 2, '.', ''));
                        $transfer = $this->stripe()->createTransfer(
                            $amountCents,
                            'usd',
                            $fl['stripe_connect_account_id'],
                            [
                                'mw_type'       => 'weekly_payout',
                                'mw_freelancer' => $fl['id'],
                            ]
                        );
                        $gatewayRef = $transfer->id;
                        $netAmount  = $available;
                    }

                    $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

                    // Record payout
                    $payoutId = $this->uuid();
                    $pdo->prepare(
                        'INSERT INTO "payout"
                            (id, freelancer_id, amount, currency, fee, net_amount, status,
                             gateway_reference, processed_at, created_at)
                         VALUES (:id, :uid, :amt, \'USD\', :fee, :net, \'completed\', :ref, :now, :now)'
                    )->execute([
                        'id'  => $payoutId,
                        'uid' => $fl['id'],
                        'amt' => number_format($available, 2, '.', ''),
                        'fee' => $fee,
                        'net' => number_format($netAmount, 2, '.', ''),
                        'ref' => $gatewayRef,
                        'now' => $now,
                    ]);

                    $results[] = [
                        'freelancer' => $fl['id'],
                        'name'       => $fl['display_name'],
                        'amount'     => number_format($available, 2, '.', ''),
                        'method'     => $payoutType,
                        'reference'  => $gatewayRef,
                    ];
                } catch (\Throwable $e) {
                    $results[] = [
                        'freelancer' => $fl['id'],
                        'error'      => $e->getMessage(),
                    ];
                    error_log('[BillingController] payoutWeekly freelancer ' . $fl['id'] . ' ERROR: ' . $e->getMessage());
                }
            }
        } catch (\Throwable $e) {
            error_log('[BillingController] payoutWeekly ERROR: ' . $e->getMessage());
            return $this->json(['error' => true, 'message' => $e->getMessage()], 500);
        }

        return $this->json([
            'data' => [
                'processed' => count($results),
                'results'   => $results,
            ],
        ]);
    }

    /* ─── Helpers ─── */

    private function getDefaultPaymentMethod(string $userId, \PDO $pdo): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT id, stripe_payment_method_id FROM "paymentmethod"
             WHERE user_id = :uid AND is_active = true AND stripe_payment_method_id IS NOT NULL
             ORDER BY is_default DESC, created_at DESC LIMIT 1'
        );
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    private function insertEscrowTransaction(
        \PDO $pdo, string $contractId, ?string $milestoneId,
        string $type, string $amount, string $status,
        ?string $gatewayRef, string $now,
        ?array $gatewayMetadata = null
    ): string {
        $id = $this->uuid();
        $pdo->prepare(
            'INSERT INTO "escrowtransaction"
                (id, contract_id, milestone_id, type, amount, currency, status,
                 gateway_reference, gateway_metadata, created_at)
             VALUES (:id, :cid, :mid, :type, :amt, \'USD\', :status, :ref, :meta, :now)'
        )->execute([
            'id'     => $id,
            'cid'    => $contractId,
            'mid'    => $milestoneId,
            'type'   => $type,
            'amt'    => $amount,
            'status' => $status,
            'ref'    => $gatewayRef,
            'meta'   => $gatewayMetadata ? json_encode($gatewayMetadata) : null,
            'now'    => $now,
        ]);
        return $id;
    }

    private function autoGenerateInvoice(
        \PDO $pdo, string $contractId, string $subtotal,
        string $clientFee, string $description, string $now
    ): string {
        $id  = $this->uuid();
        $total = number_format((float) $subtotal + (float) $clientFee, 2, '.', '');
        $invNum = 'INV-' . strtoupper(substr($id, 0, 8));

        $pdo->prepare(
            'INSERT INTO "invoice"
                (id, contract_id, invoice_number, subtotal, platform_fee, tax_amount,
                 total, currency, status, issued_at, due_at, notes, created_at, updated_at)
             VALUES (:id, :cid, :num, :sub, :fee, \'0.00\', :total, \'USD\', \'paid\',
                     :now, :now, :notes, :now, :now)'
        )->execute([
            'id'    => $id,
            'cid'   => $contractId,
            'num'   => $invNum,
            'sub'   => $subtotal,
            'fee'   => $clientFee,
            'total' => $total,
            'now'   => $now,
            'notes' => $description,
        ]);

        return $id;
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    /* ─── Notify client about a failed charge ─── */

    private function notifyChargeFailed(
        \PDO $pdo, string $clientId, string $contractId,
        string $contractTitle, string $errorMsg, string $now
    ): void {
        $notifId = $this->uuid();
        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                'id'    => $notifId,
                'uid'   => $clientId,
                'type'  => 'billing.charge_failed',
                'title' => '⚠️ Payment Failed',
                'body'  => "Your payment for \"{$contractTitle}\" could not be processed. Please update your payment method to avoid delays.",
                'data'  => json_encode([
                    'contract_id' => $contractId,
                    'error'       => $errorMsg,
                    'link'        => '/dashboard/billing/payment-methods',
                ]),
                'prio'  => 'warning',
                'chan'   => 'in_app',
                'now'   => $now,
            ]);
        } catch (\Throwable $e) {
            error_log('[BillingController] notifyChargeFailed insert: ' . $e->getMessage());
        }

        // Real-time push via Redis/Socket.IO
        $this->pushSocketNotification($clientId, $notifId, 'billing.charge_failed',
            '⚠️ Payment Failed',
            "Your payment for \"{$contractTitle}\" could not be processed.",
            ['contract_id' => $contractId, 'link' => '/dashboard/billing/payment-methods'],
            'warning', $now);
    }

    /* ─── Notify freelancer about a delayed payout ─── */

    private function notifyPayoutDelayed(
        \PDO $pdo, string $freelancerId, string $contractList,
        float $amount, string $now
    ): void {
        $notifId = $this->uuid();
        $formattedAmount = number_format($amount, 2);
        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                'id'    => $notifId,
                'uid'   => $freelancerId,
                'type'  => 'billing.payout_delayed',
                'title' => '⏳ Payout Delayed',
                'body'  => "Your weekly payout of \${$formattedAmount} has been delayed. We're waiting for client payment on: {$contractList}. Your payout will be processed as soon as the payment clears.",
                'data'  => json_encode([
                    'contracts' => $contractList,
                    'amount'    => $formattedAmount,
                    'link'      => '/dashboard/billing',
                ]),
                'prio'  => 'warning',
                'chan'   => 'in_app',
                'now'   => $now,
            ]);
        } catch (\Throwable $e) {
            error_log('[BillingController] notifyPayoutDelayed insert: ' . $e->getMessage());
        }

        $this->pushSocketNotification($freelancerId, $notifId, 'billing.payout_delayed',
            '⏳ Payout Delayed',
            "Your weekly payout of \${$formattedAmount} has been delayed.",
            ['contracts' => $contractList, 'link' => '/dashboard/billing'],
            'warning', $now);
    }

    /* ─── Push real-time notification via Redis/Socket.IO ─── */

    private function pushSocketNotification(
        string $userId, string $notifId, string $type, string $title,
        string $body, array $data, string $priority, string $now
    ): void {
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new \App\Service\SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id'         => $notifId,
                'type'       => $type,
                'title'      => $title,
                'body'       => $body,
                'data'       => $data,
                'priority'   => $priority,
                'created_at' => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log("[BillingController] socket push: " . $e->getMessage());
        }
    }

    /* ─── Admin: Retry a failed charge for a timesheet ─── */

    #[Route('POST', '/retry-charge/{timesheetId}', name: 'billing.retryCharge', summary: 'Retry failed charge', tags: ['Billing'])]
    public function retryCharge(ServerRequestInterface $request, string $timesheetId): JsonResponse
    {
        try {
            $pdo = $this->db->pdo();

            // Get the unbilled timesheet
            $stmt = $pdo->prepare(
                'SELECT wt.id, wt.contract_id, wt.total_amount,
                        c.client_id, c.title AS contract_title
                 FROM "weeklytimesheet" wt
                 JOIN "contract" c ON c.id = wt.contract_id
                 WHERE wt.id = :id AND wt.billed = false AND wt.status = \'approved\''
            );
            $stmt->execute(['id' => $timesheetId]);
            $ts = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$ts) {
                return $this->error('Timesheet not found or already billed', 404);
            }

            $clientFee   = $this->fees()->calculateClientFee($ts['total_amount']);
            $totalCharge = $this->fees()->totalClientCharge($ts['total_amount']);
            $amountCents = $this->fees()->toCents($totalCharge);

            $pm = $this->getDefaultPaymentMethod($ts['client_id'], $pdo);
            if (!$pm) {
                return $this->error('Client has no payment method on file');
            }

            $customerStmt = $pdo->prepare('SELECT stripe_customer_id FROM "user" WHERE id = :uid');
            $customerStmt->execute(['uid' => $ts['client_id']]);
            $customerId = $customerStmt->fetchColumn();

            if (!$customerId) {
                return $this->error('Client has no Stripe customer');
            }

            $pi = $this->stripe()->createPaymentIntent(
                $amountCents, 'usd', $customerId, $pm['stripe_payment_method_id'],
                ['mw_type' => 'retry_charge', 'mw_timesheet' => $timesheetId, 'mw_contract' => $ts['contract_id']]
            );

            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'fund',
                $ts['total_amount'], 'completed', $pi->id, $now);
            $this->insertEscrowTransaction($pdo, $ts['contract_id'], null, 'client_fee',
                $clientFee, 'completed', $pi->id, $now);
            $this->autoGenerateInvoice($pdo, $ts['contract_id'], $ts['total_amount'],
                $clientFee, $ts['contract_title'] . ' — Retry charge', $now);

            $pdo->prepare('UPDATE "weeklytimesheet" SET billed = true, updated_at = :now WHERE id = :id')
                ->execute(['now' => $now, 'id' => $timesheetId]);

            // Clear any delayed payouts for the freelancer (they'll be picked up next Friday)
            $pdo->prepare(
                'UPDATE "payout" SET status = \'pending\', failure_reason = NULL
                 WHERE freelancer_id = (SELECT freelancer_id FROM "contract" WHERE id = :cid LIMIT 1)
                   AND status = \'delayed\''
            )->execute(['cid' => $ts['contract_id']]);

            return $this->json([
                'message'   => 'Charge retried successfully',
                'stripe_pi' => $pi->id,
                'charged'   => $totalCharge,
            ]);
        } catch (\Throwable $e) {
            error_log('[BillingController] retryCharge ERROR: ' . $e->getMessage());
            return $this->error('Retry failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get the total amount held in dispute for contracts involving this user.
     */
    private function getDisputedAmount(string $userId, \PDO $pdo): string
    {
        $stmt = $pdo->prepare(
            'SELECT COALESCE(SUM(et.amount), 0) AS total
             FROM "escrowtransaction" et
             JOIN "contract" c ON c.id = et.contract_id
             WHERE et.type = \'dispute_hold\' AND et.status = \'completed\'
               AND (c.client_id = :uid OR c.freelancer_id = :uid2)'
        );
        $stmt->execute(['uid' => $userId, 'uid2' => $userId]);

        return $stmt->fetchColumn() ?: '0.00';
    }
}
