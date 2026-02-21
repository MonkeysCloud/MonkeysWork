<?php
declare(strict_types=1);

namespace App\Service;

/**
 * MonkeysMail HTTP API wrapper.
 *
 * Sends transactional emails via the MonkeysMail SMTP relay API.
 * Config via env: MONKEYSMAIL_API_KEY, MONKEYSMAIL_API_BASE, MONKEYSMAIL_FROM_EMAIL, MONKEYSMAIL_FROM_NAME
 */
final class MonkeysMailService
{
    private string $apiKey;
    private string $apiBase;
    private string $fromEmail;
    private string $fromName;

    public function __construct()
    {
        $this->apiKey = getenv('MONKEYSMAIL_API_KEY') ?: '';
        $this->apiBase = rtrim(getenv('MONKEYSMAIL_API_BASE') ?: 'https://smtp.monkeysmail.com', '/');
        $this->fromEmail = getenv('MONKEYSMAIL_FROM_EMAIL') ?: 'no-reply@monkeysworks.com';
        $this->fromName = getenv('MONKEYSMAIL_FROM_NAME') ?: 'MonkeysWork';
    }

    /**
     * Send an email via MonkeysMail API.
     *
     * @param string|string[] $to        Recipient email(s)
     * @param string          $subject   Email subject
     * @param string          $html      HTML body
     * @param string          $text      Plain-text fallback
     * @param string[]        $tags      Optional tags for tracking
     * @param string|null     $replyTo   Optional reply-to address
     * @return bool True on success
     */
    public function send(
        string|array $to,
        string $subject,
        string $html,
        string $text = '',
        array $tags = [],
        ?string $replyTo = null,
        ): bool
    {
        if (!$this->apiKey) {
            error_log('[MonkeysMail] API key not configured — skipping email to: ' . (is_array($to) ? implode(',', $to) : $to));
            return false;
        }

        $recipients = is_array($to) ? $to : [$to];

        $payload = [
            'from' => ['email' => $this->fromEmail, 'name' => $this->fromName],
            'to' => $recipients,
            'subject' => $subject,
            'html' => $html,
            'text' => $text ?: strip_tags($html),
            'tags' => $tags,
        ];

        if ($replyTo) {
            $payload['reply_to'] = $replyTo;
        }

        $url = "{$this->apiBase}/messages/send";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "X-API-Key: {$this->apiKey}",
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            error_log("[MonkeysMail] cURL error: {$curlErr}");
            return false;
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            error_log("[MonkeysMail] HTTP {$httpCode}: {$response}");
            return false;
        }

        return true;
    }

    /**
     * Render an email template and send it.
     *
     * @param string|string[] $to           Recipient email(s)
     * @param string          $subject      Email subject
     * @param string          $templateName Template file name (without .php)
     * @param array           $vars         Variables to pass to the template
     * @param string[]        $tags         Optional tags
     */
    public function sendTemplate(
        string|array $to,
        string $subject,
        string $templateName,
        array $vars = [],
        array $tags = [],
        ): bool
    {
        $templateDir = dirname(__DIR__, 2) . '/resources/emails';
        $templateFile = "{$templateDir}/{$templateName}.php";

        if (!file_exists($templateFile)) {
            error_log("[MonkeysMail] Template not found: {$templateFile}");
            return false;
        }

        // Render template
        $vars['subject'] = $subject;
        $content = $this->renderTemplate($templateFile, $vars);

        // Wrap in layout
        $layoutFile = "{$templateDir}/layout.php";
        if (file_exists($layoutFile)) {
            $html = $this->renderTemplate($layoutFile, array_merge($vars, ['content' => $content]));
        }
        else {
            $html = $content;
        }

        return $this->send($to, $subject, $html, strip_tags($content), $tags);
    }

    private function renderTemplate(string $file, array $vars): string
    {
        extract($vars, EXTR_SKIP);
        ob_start();
        include $file;
        return ob_get_clean() ?: '';
    }
}