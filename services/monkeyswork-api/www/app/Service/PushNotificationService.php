<?php
declare(strict_types=1);

namespace App\Service;

use MonkeysLegion\Database\Contracts\ConnectionInterface;

/**
 * Sends push notifications via Firebase Cloud Messaging HTTP v1 API.
 *
 * Requires:
 * - GOOGLE_APPLICATION_CREDENTIALS env var pointing to the Firebase service account JSON file
 *   OR FIREBASE_SERVER_KEY env var for the legacy API.
 * - FCM_PROJECT_ID env var for the v1 API.
 */
class PushNotificationService
{
    private ConnectionInterface $db;

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
     * Send an FCM message using the legacy HTTP API (simpler, no OAuth).
     * For production, consider migrating to the v1 API with service account.
     */
    private function sendFcmMessage(string $token, string $title, string $body, array $data): void
    {
        $serverKey = getenv('FIREBASE_SERVER_KEY');
        if (!$serverKey) {
            error_log('[PushNotificationService] FIREBASE_SERVER_KEY not set, skipping push');
            return;
        }

        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'badge' => 1,
            ],
            'data' => $data,
            'priority' => 'high',
            'content_available' => true, // iOS background delivery
        ];

        $ch = curl_init('https://fcm.googleapis.com/fcm/send');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: key=' . $serverKey,
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
            error_log("[PushNotificationService] FCM send failed (HTTP $httpCode): $result");
        }

        // Handle invalid/expired tokens
        $decoded = json_decode($result, true);
        if (isset($decoded['results'][0]['error'])) {
            $error = $decoded['results'][0]['error'];
            if (in_array($error, ['NotRegistered', 'InvalidRegistration'])) {
                // Remove stale token
                $this->db->pdo()->prepare(
                    'DELETE FROM "device_token" WHERE token = :token'
                )->execute(['token' => $token]);
                error_log("[PushNotificationService] Removed stale token: $error");
            }
        }
    }
}
