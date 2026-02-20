<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\StripeService;
use App\Service\SocketEvent;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Stripe Webhook handler.
 * No auth middleware – verification uses Stripe signature.
 *
 * Configure in Stripe Dashboard → Webhooks:
 * URL:    https://api.monkeyswork.com/api/v1/webhooks/stripe
 * Events: payment_intent.succeeded, payment_intent.payment_failed,
 *         transfer.reversed, charge.refunded
 */
#[RoutePrefix('/api/v1/webhooks')]
final class StripeWebhookController
{
    use ApiController;

    private StripeService $stripe;

    public function __construct(private ConnectionInterface $db)
    {
        $this->stripe = new StripeService();
    }

    #[Route('POST', '/stripe', name: 'webhooks.stripe', summary: 'Stripe webhook', tags: ['Webhooks'])]
    public function handle(ServerRequestInterface $request): JsonResponse
    {
        $payload   = (string) $request->getBody();
        $sigHeader = $request->getHeaderLine('Stripe-Signature');

        try {
            $event = $this->stripe->verifyWebhookSignature($payload, $sigHeader);
        } catch (\Throwable $e) {
            error_log('[StripeWebhook] Signature verification failed: ' . $e->getMessage());
            return $this->error('Invalid signature', 400);
        }

        $pdo = $this->db->pdo();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        try {
            switch ($event->type) {
                /* ────────────────────────────────────────────
                 *  Client Payment (PaymentIntent) events
                 * ──────────────────────────────────────────── */
                case 'payment_intent.succeeded':
                    $pi = $event->data->object;
                    $this->handlePaymentSucceeded($pdo, $pi, $now);
                    error_log("[StripeWebhook] payment_intent.succeeded: {$pi->id}");
                    break;

                case 'payment_intent.payment_failed':
                    $pi = $event->data->object;
                    $this->handlePaymentFailed($pdo, $pi, $now);
                    error_log("[StripeWebhook] payment_intent.payment_failed: {$pi->id}");
                    break;

                /* ────────────────────────────────────────────
                 *  Freelancer Transfer events
                 * ──────────────────────────────────────────── */
                case 'transfer.reversed':
                case 'transfer.canceled':
                    $transfer = $event->data->object;
                    $this->handleTransferFailed($pdo, $transfer, $now);
                    error_log("[StripeWebhook] {$event->type}: {$transfer->id}");
                    break;

                /* ────────────────────────────────────────────
                 *  Refund events
                 * ──────────────────────────────────────────── */
                case 'charge.refunded':
                    $charge = $event->data->object;
                    $piId   = $charge->payment_intent;
                    if ($piId) {
                        $this->handleRefund($pdo, $piId, $charge->amount_refunded, $now);
                    }
                    error_log("[StripeWebhook] charge.refunded: PI={$piId}");
                    break;

                default:
                    error_log("[StripeWebhook] Unhandled event: {$event->type}");
            }
        } catch (\Throwable $e) {
            error_log('[StripeWebhook] Processing error: ' . $e->getMessage());
        }

        return $this->json(['received' => true]);
    }

    /* ─── Payment succeeded (ACH cleared, card confirmed) ─── */

    private function handlePaymentSucceeded(\PDO $pdo, object $pi, string $now): void
    {
        // Mark pending escrow as completed
        $stmt = $pdo->prepare(
            'UPDATE "escrowtransaction" SET status = \'completed\', processed_at = :now
             WHERE gateway_reference = :ref AND status = \'pending\''
        );
        $stmt->execute(['ref' => $pi->id, 'now' => $now]);

        // Mark timesheet as billed (from metadata)
        $timesheetId = $pi->metadata->mw_timesheet ?? null;
        if ($timesheetId) {
            $pdo->prepare(
                'UPDATE "weeklytimesheet" SET billed = true, updated_at = :now WHERE id = :id AND billed = false'
            )->execute(['now' => $now, 'id' => $timesheetId]);
        }
    }

    /* ─── Payment failed (card/ACH denied) ─── */

    private function handlePaymentFailed(\PDO $pdo, object $pi, string $now): void
    {
        $failureMsg = $pi->last_payment_error->message ?? 'Payment declined';

        // Mark pending escrow as failed
        $pdo->prepare(
            'UPDATE "escrowtransaction" SET status = \'failed\', processed_at = :now,
                    gateway_metadata = :meta
             WHERE gateway_reference = :ref AND status = \'pending\''
        )->execute([
            'ref'  => $pi->id,
            'now'  => $now,
            'meta' => json_encode(['error' => $failureMsg]),
        ]);

        // Also insert a fund_failed record if the PI had metadata but no escrow pending
        $contractId = $pi->metadata->mw_contract ?? null;
        $timesheetId = $pi->metadata->mw_timesheet ?? null;

        if ($contractId) {
            // Check if we already have a fund_failed for this
            $existsStmt = $pdo->prepare(
                'SELECT COUNT(*) FROM "escrowtransaction"
                 WHERE gateway_reference = :ref AND type = \'fund_failed\''
            );
            $existsStmt->execute(['ref' => $pi->id]);
            if ((int) $existsStmt->fetchColumn() === 0) {
                $id = $this->uuid();
                $amount = number_format($pi->amount / 100, 2, '.', '');
                $pdo->prepare(
                    'INSERT INTO "escrowtransaction"
                        (id, contract_id, type, amount, currency, status,
                         gateway_reference, gateway_metadata, created_at)
                     VALUES (:id, :cid, \'fund_failed\', :amt, \'USD\', \'failed\', :ref, :meta, :now)'
                )->execute([
                    'id'   => $id,
                    'cid'  => $contractId,
                    'amt'  => $amount,
                    'ref'  => $pi->id,
                    'meta' => json_encode(['error' => $failureMsg]),
                    'now'  => $now,
                ]);
            }

            // Notify the client
            $clientStmt = $pdo->prepare(
                'SELECT client_id, title FROM "contract" WHERE id = :id'
            );
            $clientStmt->execute(['id' => $contractId]);
            $contract = $clientStmt->fetch(\PDO::FETCH_ASSOC);

            if ($contract) {
                $this->notifyUser($pdo,
                    $contract['client_id'],
                    'billing.charge_failed',
                    '⚠️ Payment Failed',
                    "Your payment for \"{$contract['title']}\" was declined: {$failureMsg}. Please update your payment method.",
                    [
                        'contract_id' => $contractId,
                        'error'       => $failureMsg,
                        'link'        => '/dashboard/billing/payment-methods',
                    ],
                    'warning', $now
                );
            }
        }
    }

    /* ─── Transfer failed (freelancer payout via Connect) ─── */

    private function handleTransferFailed(\PDO $pdo, object $transfer, string $now): void
    {
        $freelancerId = $transfer->metadata->mw_freelancer ?? null;

        // Mark the payout as failed
        $pdo->prepare(
            'UPDATE "payout" SET status = \'failed\', failure_reason = :reason, processed_at = :now
             WHERE gateway_reference = :ref AND status IN (\'pending\', \'processing\')'
        )->execute([
            'ref'    => $transfer->id,
            'reason' => 'Stripe transfer failed',
            'now'    => $now,
        ]);

        // Notify the freelancer
        if ($freelancerId) {
            $this->notifyUser($pdo,
                $freelancerId,
                'billing.payout_failed',
                '❌ Payout Failed',
                'Your weekly payout could not be processed. Our team is reviewing the issue and will retry your payment.',
                [
                    'transfer_id' => $transfer->id,
                    'link'        => '/dashboard/billing',
                ],
                'warning', $now
            );
        }
    }

    /* ─── Refund handling ─── */

    private function handleRefund(\PDO $pdo, string $gatewayRef, int $refundedCents, string $now): void
    {
        $stmt = $pdo->prepare(
            'SELECT contract_id, milestone_id FROM "escrowtransaction"
             WHERE gateway_reference = :ref AND type = \'fund\' AND status = \'completed\' LIMIT 1'
        );
        $stmt->execute(['ref' => $gatewayRef]);
        $orig = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$orig) return;

        $refundAmount = number_format($refundedCents / 100, 2, '.', '');

        $id = $this->uuid();
        $pdo->prepare(
            'INSERT INTO "escrowtransaction"
                (id, contract_id, milestone_id, type, amount, currency, status,
                 gateway_reference, processed_at, created_at)
             VALUES (:id, :cid, :mid, \'refund\', :amt, \'USD\', \'completed\', :ref, :now, :now)'
        )->execute([
            'id'  => $id,
            'cid' => $orig['contract_id'],
            'mid' => $orig['milestone_id'],
            'amt' => $refundAmount,
            'ref' => $gatewayRef . '_refund',
            'now' => $now,
        ]);
    }

    /* ─── Shared: insert notification + push via socket ─── */

    private function notifyUser(
        \PDO $pdo, string $userId, string $type, string $title,
        string $body, array $data, string $priority, string $now
    ): void {
        $notifId = $this->uuid();

        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                'id'    => $notifId,
                'uid'   => $userId,
                'type'  => $type,
                'title' => $title,
                'body'  => $body,
                'data'  => json_encode($data),
                'prio'  => $priority,
                'chan'   => 'in_app',
                'now'   => $now,
            ]);
        } catch (\Throwable $e) {
            error_log("[StripeWebhook] notification insert: " . $e->getMessage());
        }

        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
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
            error_log("[StripeWebhook] socket push: " . $e->getMessage());
        }
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
}
