<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\StripeService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

/**
 * No auth middleware – verification uses Stripe signature.
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
                case 'payment_intent.succeeded':
                    $pi = $event->data->object;
                    $this->markEscrowCompleted($pdo, $pi->id, $now);
                    error_log("[StripeWebhook] payment_intent.succeeded: {$pi->id}");
                    break;

                case 'payment_intent.payment_failed':
                    $pi = $event->data->object;
                    $this->markEscrowFailed($pdo, $pi->id, $now);
                    error_log("[StripeWebhook] payment_intent.payment_failed: {$pi->id}");
                    break;

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

    private function markEscrowCompleted(\PDO $pdo, string $gatewayRef, string $now): void
    {
        $pdo->prepare(
            'UPDATE "escrowtransaction" SET status = \'completed\', processed_at = :now
             WHERE gateway_reference = :ref AND status = \'pending\''
        )->execute(['ref' => $gatewayRef, 'now' => $now]);
    }

    private function markEscrowFailed(\PDO $pdo, string $gatewayRef, string $now): void
    {
        $pdo->prepare(
            'UPDATE "escrowtransaction" SET status = \'failed\', processed_at = :now
             WHERE gateway_reference = :ref AND status = \'pending\''
        )->execute(['ref' => $gatewayRef, 'now' => $now]);
    }

    private function handleRefund(\PDO $pdo, string $gatewayRef, int $refundedCents, string $now): void
    {
        // Find the original transaction
        $stmt = $pdo->prepare(
            'SELECT contract_id, milestone_id FROM "escrowtransaction"
             WHERE gateway_reference = :ref AND type = \'fund\' AND status = \'completed\' LIMIT 1'
        );
        $stmt->execute(['ref' => $gatewayRef]);
        $orig = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$orig) return;

        $refundAmount = number_format($refundedCents / 100, 2, '.', '');

        // Insert refund escrow transaction
        $id = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

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
}
