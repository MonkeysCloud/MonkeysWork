<?php
declare(strict_types=1);

namespace App\Service;

use MonkeysLegion\Database\Contracts\ConnectionInterface;

/**
 * Central email notification dispatcher.
 *
 * Checks user email preferences before sending.
 * Usage: $notifier->notify($userId, 'contract_emails', 'Contract Accepted', 'contract-accepted', $vars, ['contracts']);
 */
final class EmailNotificationService
{
    private MonkeysMailService $mail;

    public function __construct(
        private ConnectionInterface $db,
        ?MonkeysMailService $mail = null,
        )
    {
        $this->mail = $mail ?? new MonkeysMailService();
    }

    /**
     * Send an email notification, respecting user preferences.
     *
     * @param string   $userId          Recipient user ID
     * @param string   $preferenceKey   Key in email_preference table (e.g. 'contract_emails')
     * @param string   $subject         Email subject
     * @param string   $templateName    Template file name (without .php)
     * @param array    $vars            Template variables
     * @param string[] $tags            Tracking tags
     * @return bool    True if sent
     */
    public function notify(
        string $userId,
        string $preferenceKey,
        string $subject,
        string $templateName,
        array $vars = [],
        array $tags = [],
        ): bool
    {
        // Get user email
        $stmt = $this->db->pdo()->prepare(
            'SELECT email, display_name FROM "user" WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            error_log("[EmailNotification] User not found: {$userId}");
            return false;
        }

        // Check email preferences (default: enabled)
        if (!$this->isEnabled($userId, $preferenceKey)) {
            return false;
        }

        // Merge user name into vars
        $vars['userName'] = $vars['userName'] ?? $user['display_name'];

        return $this->mail->sendTemplate(
            $user['email'],
            $subject,
            $templateName,
            $vars,
            $tags,
        );
    }

    /**
     * Check if a notification category is enabled for a user.
     */
    private function isEnabled(string $userId, string $preferenceKey): bool
    {
        // account_emails is always sent (security-critical)
        if ($preferenceKey === 'account_emails') {
            return true;
        }

        $stmt = $this->db->pdo()->prepare(
            "SELECT {$preferenceKey} FROM \"email_preference\" WHERE user_id = :uid"
        );

        try {
            $stmt->execute(['uid' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        }
        catch (\Throwable) {
            // Table might not exist yet — default to enabled
            return true;
        }

        if (!$row) {
            return true; // No preference row = all enabled by default
        }

        return (bool)($row[$preferenceKey] ?? true);
    }
}