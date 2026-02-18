<?php
declare(strict_types=1);

namespace App\Service;

/**
 * PayPal Payouts API service.
 *
 * Uses the PayPal REST API to send payouts to freelancers' PayPal accounts.
 * Requires PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE env vars.
 */
final class PayPalService
{
    private string $baseUrl;
    private ?string $accessToken = null;

    public function __construct()
    {
        $mode = getenv('PAYPAL_MODE') ?: 'sandbox';
        $this->baseUrl = $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    /* ─── Authentication ─── */

    private function authenticate(): string
    {
        if ($this->accessToken) return $this->accessToken;

        $clientId = getenv('PAYPAL_CLIENT_ID');
        $secret   = getenv('PAYPAL_SECRET');

        if (!$clientId || !$secret) {
            throw new \RuntimeException('PayPal credentials not configured (PAYPAL_CLIENT_ID, PAYPAL_SECRET)');
        }

        $ch = curl_init("{$this->baseUrl}/v1/oauth2/token");
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
            CURLOPT_USERPWD        => "{$clientId}:{$secret}",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Accept-Language: en_US'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \RuntimeException("PayPal auth failed (HTTP {$httpCode}): {$response}");
        }

        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? '';

        return $this->accessToken;
    }

    /* ─── Payout ─── */

    /**
     * Send a payout to a PayPal email address.
     *
     * @param string $paypalEmail  Recipient's PayPal email
     * @param float  $amount       Amount in USD
     * @param string $currency     Currency code
     * @param string $note         Note to recipient
     * @param string $senderBatchId Unique batch ID (for idempotency)
     * @return array{batch_id: string, status: string}
     */
    public function createPayout(
        string $paypalEmail,
        float  $amount,
        string $currency = 'USD',
        string $note = 'MonkeysWork weekly payout',
        string $senderBatchId = '',
    ): array {
        $token = $this->authenticate();

        if (!$senderBatchId) {
            $senderBatchId = 'mw_payout_' . bin2hex(random_bytes(8));
        }

        $payload = [
            'sender_batch_header' => [
                'sender_batch_id' => $senderBatchId,
                'email_subject'   => 'You received a payout from MonkeysWork',
                'email_message'   => $note,
            ],
            'items' => [
                [
                    'recipient_type' => 'EMAIL',
                    'amount'         => [
                        'value'    => number_format($amount, 2, '.', ''),
                        'currency' => strtoupper($currency),
                    ],
                    'note'     => $note,
                    'receiver' => $paypalEmail,
                    'sender_item_id' => $senderBatchId . '_item1',
                ],
            ],
        ];

        $ch = curl_init("{$this->baseUrl}/v1/payments/payouts");
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode < 200 || $httpCode >= 300) {
            error_log("[PayPalService] Payout failed (HTTP {$httpCode}): {$response}");
            throw new \RuntimeException("PayPal payout failed: {$response}");
        }

        $data = json_decode($response, true);
        return [
            'batch_id' => $data['batch_header']['payout_batch_id'] ?? '',
            'status'   => $data['batch_header']['batch_status'] ?? 'UNKNOWN',
        ];
    }

    /**
     * Check payout batch status.
     */
    public function getPayoutStatus(string $batchId): array
    {
        $token = $this->authenticate();

        $ch = curl_init("{$this->baseUrl}/v1/payments/payouts/{$batchId}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \RuntimeException("PayPal status check failed (HTTP {$httpCode})");
        }

        return json_decode($response, true);
    }
}
