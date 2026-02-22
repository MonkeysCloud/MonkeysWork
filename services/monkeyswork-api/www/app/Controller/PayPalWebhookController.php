<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\SocketEvent;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

/**
 * PayPal Webhook handler.
 * No auth middleware – verification uses PayPal webhook ID + signature.
 *
 * Configure in PayPal Developer Dashboard → Webhooks:
 * URL:    https://api.monkeysworks.com/api/v1/webhooks/paypal
 * Events: PAYMENT.PAYOUTS-ITEM.SUCCEEDED,
 *         PAYMENT.PAYOUTS-ITEM.FAILED,
 *         PAYMENT.PAYOUTS-ITEM.BLOCKED,
 *         PAYMENT.PAYOUTS-ITEM.DENIED,
 *         PAYMENT.PAYOUTS-ITEM.REFUNDED,
 *         PAYMENT.PAYOUTS-ITEM.RETURNED,
 *         PAYMENT.PAYOUTS-ITEM.UNCLAIMED
 */
#[RoutePrefix('/api/v1/webhooks')]
final class PayPalWebhookController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    #[Route('POST', '/paypal', name: 'webhooks.paypal', summary: 'PayPal webhook', tags: ['Webhooks'])]
    public function handle(ServerRequestInterface $request): JsonResponse
    {
        $payload = (string) $request->getBody();
        $headers = $request->getHeaders();

        // Verify webhook signature
        if (!$this->verifySignature($payload, $headers)) {
            error_log('[PayPalWebhook] Signature verification failed');
            return $this->error('Invalid signature', 400);
        }

        $body = json_decode($payload, true);
        if (!$body) {
            return $this->error('Invalid payload', 400);
        }

        $eventType = $body['event_type'] ?? '';
        $resource = $body['resource'] ?? [];

        $pdo = $this->db->pdo();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        error_log("[PayPalWebhook] Received event: {$eventType}");

        try {
            switch ($eventType) {
                case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
                    $this->handlePayoutSucceeded($pdo, $resource, $now);
                    break;

                case 'PAYMENT.PAYOUTS-ITEM.FAILED':
                case 'PAYMENT.PAYOUTS-ITEM.BLOCKED':
                case 'PAYMENT.PAYOUTS-ITEM.DENIED':
                case 'PAYMENT.PAYOUTS-ITEM.RETURNED':
                    $this->handlePayoutFailed($pdo, $resource, $eventType, $now);
                    break;

                case 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED':
                    $this->handlePayoutUnclaimed($pdo, $resource, $now);
                    break;

                case 'PAYMENT.PAYOUTS-ITEM.REFUNDED':
                    $this->handlePayoutRefunded($pdo, $resource, $now);
                    break;

                default:
                    error_log("[PayPalWebhook] Unhandled event: {$eventType}");
            }
        } catch (\Throwable $e) {
            error_log('[PayPalWebhook] Processing error: ' . $e->getMessage());
        }

        return $this->json(['received' => true]);
    }

    /* ─── Payout item succeeded ─── */

    private function handlePayoutSucceeded(\PDO $pdo, array $resource, string $now): void
    {
        $batchId = $resource['payout_batch_id'] ?? null;
        $itemId = $resource['payout_item_id'] ?? null;
        $ref = $batchId ?? $itemId;

        if (!$ref)
            return;

        // Mark payout as completed
        $stmt = $pdo->prepare(
            'UPDATE "payout" SET status = \'completed\', processed_at = :now
             WHERE gateway_reference = :ref AND status IN (\'pending\', \'processing\')'
        );
        $stmt->execute(['ref' => $ref, 'now' => $now]);

        // Also try with the batch ID prefix used in BillingController
        if ($batchId) {
            $pdo->prepare(
                'UPDATE "payout" SET status = \'completed\', processed_at = :now
                 WHERE gateway_reference LIKE :ref AND status IN (\'pending\', \'processing\')'
            )->execute(['ref' => $batchId . '%', 'now' => $now]);
        }

        error_log("[PayPalWebhook] Payout marked completed: {$ref}");
    }

    /* ─── Payout item failed / blocked / denied / returned ─── */

    private function handlePayoutFailed(\PDO $pdo, array $resource, string $eventType, string $now): void
    {
        $batchId = $resource['payout_batch_id'] ?? null;
        $itemId = $resource['payout_item_id'] ?? null;
        $ref = $batchId ?? $itemId;
        $error = $resource['errors']['message'] ?? $resource['transaction_status'] ?? $eventType;

        if (!$ref)
            return;

        // Mark payout as failed
        $stmt = $pdo->prepare(
            'UPDATE "payout" SET status = \'failed\', failure_reason = :reason, processed_at = :now
             WHERE gateway_reference = :ref AND status IN (\'pending\', \'processing\')
             RETURNING freelancer_id, amount'
        );
        $stmt->execute(['ref' => $ref, 'reason' => "PayPal: {$error}", 'now' => $now]);
        $payout = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Also try with batch prefix
        if (!$payout && $batchId) {
            $stmt2 = $pdo->prepare(
                'UPDATE "payout" SET status = \'failed\', failure_reason = :reason, processed_at = :now
                 WHERE gateway_reference LIKE :ref AND status IN (\'pending\', \'processing\')
                 RETURNING freelancer_id, amount'
            );
            $stmt2->execute(['ref' => $batchId . '%', 'reason' => "PayPal: {$error}", 'now' => $now]);
            $payout = $stmt2->fetch(\PDO::FETCH_ASSOC);
        }

        // Notify the freelancer
        if ($payout && $payout['freelancer_id']) {
            $amount = number_format((float) $payout['amount'], 2);
            $this->notifyUser(
                $pdo,
                $payout['freelancer_id'],
                'billing.payout_failed',
                '❌ PayPal Payout Failed',
                "Your PayPal payout of \${$amount} could not be completed: {$error}. Our team is looking into this.",
                [
                    'gateway_ref' => $ref,
                    'error' => $error,
                    'link' => '/dashboard/billing',
                ],
                'warning',
                $now
            );
        }

        error_log("[PayPalWebhook] Payout marked failed: {$ref} — {$error}");
    }

    /* ─── Payout item unclaimed (recipient hasn't accepted) ─── */

    private function handlePayoutUnclaimed(\PDO $pdo, array $resource, string $now): void
    {
        $ref = $resource['payout_batch_id'] ?? $resource['payout_item_id'] ?? null;
        if (!$ref)
            return;

        // Find the freelancer
        $stmt = $pdo->prepare(
            'SELECT freelancer_id, amount FROM "payout"
             WHERE gateway_reference = :ref AND status IN (\'pending\', \'processing\') LIMIT 1'
        );
        $stmt->execute(['ref' => $ref]);
        $payout = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($payout && $payout['freelancer_id']) {
            $amount = number_format((float) $payout['amount'], 2);
            $this->notifyUser(
                $pdo,
                $payout['freelancer_id'],
                'billing.payout_unclaimed',
                '📬 PayPal Payout Awaiting',
                "Your PayPal payout of \${$amount} is waiting to be claimed. Please check your PayPal email and accept the payment.",
                [
                    'gateway_ref' => $ref,
                    'link' => '/dashboard/billing',
                ],
                'info',
                $now
            );
        }

        error_log("[PayPalWebhook] Payout unclaimed: {$ref}");
    }

    /* ─── Payout item refunded ─── */

    private function handlePayoutRefunded(\PDO $pdo, array $resource, string $now): void
    {
        $ref = $resource['payout_batch_id'] ?? $resource['payout_item_id'] ?? null;
        if (!$ref)
            return;

        $pdo->prepare(
            'UPDATE "payout" SET status = \'failed\', failure_reason = \'PayPal payout refunded\', processed_at = :now
             WHERE gateway_reference = :ref'
        )->execute(['ref' => $ref, 'now' => $now]);

        error_log("[PayPalWebhook] Payout refunded: {$ref}");
    }

    /* ─── Verify PayPal webhook signature ─── */

    private function verifySignature(string $payload, array $headers): bool
    {
        $webhookId = $_ENV['PAYPAL_WEBHOOK_ID']
            ?? getenv('PAYPAL_WEBHOOK_ID')
            ?: '';

        // In dev without webhook ID, skip verification
        if (empty($webhookId)) {
            error_log('[PayPalWebhook] No PAYPAL_WEBHOOK_ID set, skipping signature verification');
            return true;
        }

        $transmissionId = $this->getHeader($headers, 'paypal-transmission-id');
        $transmissionTime = $this->getHeader($headers, 'paypal-transmission-time');
        $certUrl = $this->getHeader($headers, 'paypal-cert-url');
        $authAlgo = $this->getHeader($headers, 'paypal-auth-algo');
        $transmissionSig = $this->getHeader($headers, 'paypal-transmission-sig');

        if (!$transmissionId || !$transmissionTime || !$transmissionSig) {
            return false;
        }

        // Call PayPal verify-webhook-signature API
        $clientId = $_ENV['PAYPAL_CLIENT_ID'] ?? getenv('PAYPAL_CLIENT_ID') ?: '';
        $secret = $_ENV['PAYPAL_CLIENT_SECRET'] ?? getenv('PAYPAL_SECRET') ?: '';
        $mode = $_ENV['PAYPAL_MODE'] ?? getenv('PAYPAL_MODE') ?: 'sandbox';
        $baseUrl = ($mode === 'sandbox')
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';

        try {
            // Get access token
            $tokenCh = curl_init("{$baseUrl}/v1/oauth2/token");
            curl_setopt_array($tokenCh, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
                CURLOPT_USERPWD => "{$clientId}:{$secret}",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
            ]);
            $tokenResp = curl_exec($tokenCh);
            curl_close($tokenCh);

            $token = json_decode($tokenResp, true)['access_token'] ?? null;
            if (!$token)
                return false;

            // Verify signature
            $verifyBody = json_encode([
                'auth_algo' => $authAlgo,
                'cert_url' => $certUrl,
                'transmission_id' => $transmissionId,
                'transmission_sig' => $transmissionSig,
                'transmission_time' => $transmissionTime,
                'webhook_id' => $webhookId,
                'webhook_event' => json_decode($payload, true),
            ]);

            $verifyCh = curl_init("{$baseUrl}/v1/notifications/verify-webhook-signature");
            curl_setopt_array($verifyCh, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $verifyBody,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    "Authorization: Bearer {$token}",
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
            ]);
            $verifyResp = curl_exec($verifyCh);
            curl_close($verifyCh);

            $result = json_decode($verifyResp, true);
            return ($result['verification_status'] ?? '') === 'SUCCESS';
        } catch (\Throwable $e) {
            error_log('[PayPalWebhook] Signature verification error: ' . $e->getMessage());
            return false;
        }
    }

    private function getHeader(array $headers, string $name): ?string
    {
        // PSR-7 headers are case-insensitive but stored as arrays
        foreach ($headers as $key => $values) {
            if (strtolower($key) === strtolower($name)) {
                return $values[0] ?? null;
            }
        }
        return null;
    }

    /* ─── Shared: insert notification + push via socket ─── */

    private function notifyUser(
        \PDO $pdo,
        string $userId,
        string $type,
        string $title,
        string $body,
        array $data,
        string $priority,
        string $now
    ): void {
        $notifId = $this->uuid();

        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                        'id' => $notifId,
                        'uid' => $userId,
                        'type' => $type,
                        'title' => $title,
                        'body' => $body,
                        'data' => json_encode($data),
                        'prio' => $priority,
                        'chan' => 'in_app',
                        'now' => $now,
                    ]);
        } catch (\Throwable $e) {
            error_log("[PayPalWebhook] notification insert: " . $e->getMessage());
        }

        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id' => $notifId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'priority' => $priority,
                'created_at' => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log("[PayPalWebhook] socket push: " . $e->getMessage());
        }
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
