<?php
declare(strict_types=1);

namespace App\Controller;

use App\Controller\ApiController;
use App\Service\GcsStorage;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/support')]
final class SupportController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private GcsStorage $gcs = new GcsStorage(),
    ) {
    }

    /* ── Create ticket (public — no auth required) ───── */

    #[Route('POST', '', name: 'support.create', summary: 'Submit a support ticket')]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        // Support both JSON and multipart/form-data
        $contentType = $request->getHeaderLine('Content-Type');
        if (str_contains($contentType, 'multipart/form-data')) {
            $data = $request->getParsedBody() ?? [];
        } else {
            $data = $this->body($request);
        }

        // Validate required fields
        if (empty($data['name'])) {
            return $this->error('Name is required');
        }
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return $this->error('A valid email is required');
        }
        if (empty($data['subject'])) {
            return $this->error('Subject is required');
        }
        if (empty($data['message'])) {
            return $this->error('Message is required');
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $category = $data['category'] ?? 'general';
        $priority = $data['priority'] ?? 'normal';

        // Optional: attach user_id if authenticated
        $userId = $this->userId($request);

        // Handle file attachments
        $attachments = [];
        $uploadedFiles = $request->getUploadedFiles();
        $files = $uploadedFiles['attachments'] ?? [];
        if (!is_array($files)) {
            $files = [$files];
        }

        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'zip'];
        $maxSize = 10 * 1024 * 1024; // 10MB
        $uploadDir = dirname(__DIR__, 2) . '/public/files/support';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        foreach ($files as $file) {
            if ($file->getError() !== UPLOAD_ERR_OK || $file->getSize() > $maxSize) {
                continue;
            }
            $ext = strtolower(pathinfo($file->getClientFilename(), PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts, true)) {
                continue;
            }
            $newName = $id . '-' . uniqid('', true) . '.' . $ext;
            $localPath = $uploadDir . '/' . $newName;
            $file->moveTo($localPath);

            // Upload to GCS
            $url = $this->gcs->upload($localPath, "support/{$newName}");

            $attachments[] = [
                'name' => $file->getClientFilename(),
                'url' => $url,
                'size' => $file->getSize(),
                'type' => $ext,
            ];
        }

        // Insert into DB
        $this->db->pdo()->prepare(
            'INSERT INTO support_ticket
                (id, user_id, name, email, subject, message, category, priority, status, attachments, created_at, updated_at)
             VALUES
                (:id, :user_id, :name, :email, :subject, :message, :category, :priority, :status, :attachments, :now, :now)'
        )->execute([
                    'id' => $id,
                    'user_id' => $userId,
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'subject' => $data['subject'],
                    'message' => $data['message'],
                    'category' => $category,
                    'priority' => $priority,
                    'status' => 'open',
                    'attachments' => json_encode($attachments),
                    'now' => $now,
                ]);

        // Send notification email to support
        $attachCount = count($attachments);
        $attachInfo = $attachCount > 0 ? "\n\nAttachments: {$attachCount} file(s)" : '';
        $this->sendEmail(
            'support@monkeysworks.com',
            "New Support Ticket: {$data['subject']}",
            "Name: {$data['name']}\nEmail: {$data['email']}\nCategory: {$category}\nPriority: {$priority}\n\n{$data['message']}{$attachInfo}"
        );

        return $this->created([
            'data' => [
                'id' => $id,
                'message' => 'Your support ticket has been submitted. We\'ll get back to you shortly.',
            ],
        ]);
    }

    /* ── Helpers ─────────────────────────────────────── */

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

    private function sendEmail(string $to, string $subject, string $body): void
    {
        try {
            $headers = "From: noreply@monkeysworks.com\r\n";
            $headers .= "Reply-To: noreply@monkeysworks.com\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            mail($to, $subject, $body, $headers);
        } catch (\Throwable) {
            // Silently fail — ticket is already saved in DB
        }
    }
}
