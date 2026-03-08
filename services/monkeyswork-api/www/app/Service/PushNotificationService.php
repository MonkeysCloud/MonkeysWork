<?php
declare(strict_types=1);

namespace App\Service;

use MonkeysLegion\Database\Contracts\ConnectionInterface;

/**
 * Sends push notifications via Firebase Cloud Messaging HTTP v1 API.
 *
 * Requires the GOOGLE_APPLICATION_CREDENTIALS_JSON env var containing
 * the Firebase service account JSON key content.
 */
class PushNotificationService
{
    private ConnectionInterface $db;
    private ?string $accessToken = null;
    private int $tokenExpiry = 0;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    /**
     * Send a push notification to a specific user's devices.
     */
    public function sendToUser(string $userId, string $title, string $body, array $data = []): void
    {
        $tokens = $this->getTokensForUser($userId);
        if (empty($tokens)) {
            return;
        }

        foreach ($tokens as $token) {
            $this->sendFcmMessage($token, $title, $body, $data);
        }
    }

    /**
     * Send a push notification to multiple users.
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        foreach ($userIds as $userId) {
            $this->sendToUser($userId, $title, $body, $data);
        }
    }

    /**
     * Get all FCM tokens for a user.
     */
    private function getTokensForUser(string $userId): array
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT token FROM "device_token" WHERE user_id = :uid'
        );
        $stmt->execute(['uid' => $userId]);
        return array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'token');
    }

    /**
     * Send an FCM message using the v1 HTTP API with OAuth2.
     */
    private function sendFcmMessage(string $token, string $title, string $body, array $data): void
    {
        $saJson = $this->getServiceAccountJson();
        if (!$saJson) {
            error_log('[PushNotificationService] No service account credentials configured');
            return;
        }

        $sa = json_decode($saJson, true);
        if (!$sa || !isset($sa['project_id'])) {
            error_log('[PushNotificationService] Invalid service account JSON');
            return;
        }

        $accessToken = $this->getOAuth2Token($sa);
        if (!$accessToken) {
            error_log('[PushNotificationService] Failed to get OAuth2 token');
            return;
        }

        $projectId = $sa['project_id'];
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        // Convert data values to strings (FCM v1 requires string values in data)
        $stringData = [];
        foreach ($data as $k => $v) {
            $stringData[$k] = (string) $v;
        }

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => $stringData ?: (object) [],
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                    ],
                    'payload' => [
                        'aps' => [
                            'sound' => 'default',
                            'badge' => 1,
                            'content-available' => 1,
                        ],
                    ],
                ],
            ],
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("[PushNotificationService] FCM v1 send failed (HTTP $httpCode): $result");

            // Handle invalid/expired tokens
            $decoded = json_decode($result, true);
            $errorCode = $decoded['error']['details'][0]['errorCode'] ?? '';
            if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'])) {
                $this->db->pdo()->prepare(
                    'DELETE FROM "device_token" WHERE token = :token'
                )->execute(['token' => $token]);
                error_log("[PushNotificationService] Removed stale token: $errorCode");
            }
        } else {
            error_log("[PushNotificationService] Push sent OK to " . substr($token, 0, 20) . "...");
        }
    }

    /**
     * Get the service account JSON from environment.
     */
    private function getServiceAccountJson(): ?string
    {
        // Option 1: JSON content directly in env var
        $json = getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON');
        if ($json && $json !== '') {
            return $json;
        }

        // Option 2: Path to file
        $path = getenv('GOOGLE_APPLICATION_CREDENTIALS');
        if ($path && file_exists($path)) {
            return file_get_contents($path);
        }

        return null;
    }

    /**
     * Generate an OAuth2 access token using the service account's private key.
     * Uses a self-signed JWT to exchange for an access token.
     */
    private function getOAuth2Token(array $sa): ?string
    {
        // Return cached token if still valid
        if ($this->accessToken && time() < $this->tokenExpiry - 60) {
            return $this->accessToken;
        }

        $now = time();
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));

        $claims = [
            'iss' => $sa['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ];
        $payload = base64_encode(json_encode($claims));

        // Fix base64url encoding
        $header = str_replace(['+', '/', '='], ['-', '_', ''], $header);
        $payload = str_replace(['+', '/', '='], ['-', '_', ''], $payload);

        $toSign = "$header.$payload";
        $signature = '';

        $privateKey = openssl_pkey_get_private($sa['private_key']);
        if (!$privateKey) {
            error_log('[PushNotificationService] Invalid private key in service account');
            return null;
        }
        openssl_sign($toSign, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        $jwt = "$toSign.$signature";

        // Exchange JWT for access token
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("[PushNotificationService] OAuth2 token exchange failed: $result");
            return null;
        }

        $tokenData = json_decode($result, true);
        $this->accessToken = $tokenData['access_token'] ?? null;
        $this->tokenExpiry = $now + ($tokenData['expires_in'] ?? 3600);

        return $this->accessToken;
    }
}
