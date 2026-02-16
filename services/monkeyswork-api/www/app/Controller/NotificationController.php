<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/notifications')]
#[Middleware('auth')]
final class NotificationController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'notif.index', summary: 'My notifications', tags: ['Notifications'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare('SELECT COUNT(*) FROM "notification" WHERE user_id = :uid');
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "notification" WHERE user_id = :uid
             ORDER BY created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('POST', '/read-all', name: 'notif.readAll', summary: 'Mark all read', tags: ['Notifications'])]
    public function readAll(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "notification" SET read_at = :now WHERE user_id = :uid AND read_at IS NULL'
        )->execute(['now' => $now, 'uid' => $userId]);

        return $this->json(['message' => 'All notifications marked as read']);
    }

    #[Route('POST', '/{id}/read', name: 'notif.read', summary: 'Mark single read', tags: ['Notifications'])]
    public function read(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "notification" SET read_at = :now
             WHERE id = :id AND user_id = :uid AND read_at IS NULL'
        );
        $stmt->execute(['now' => $now, 'id' => $id, 'uid' => $userId]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Notification');
        }

        return $this->json(['message' => 'Notification marked as read']);
    }

    #[Route('GET', '/unread-count', name: 'notif.count', summary: 'Unread count', tags: ['Notifications'])]
    public function unreadCount(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "notification" WHERE user_id = :uid AND read_at IS NULL'
        );
        $stmt->execute(['uid' => $userId]);


        return $this->json(['data' => ['unread_count' => (int) $stmt->fetchColumn()]]);
    }

    #[Route('POST', '/{id}/reply', name: 'notif.reply', summary: 'Reply to notification', tags: ['Notifications'])]
    public function reply(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $pdo    = $this->db->pdo();
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $body = json_decode((string) $request->getBody(), true) ?? [];
        $message = trim($body['message'] ?? '');
        if ($message === '') {
            return $this->error('Message is required', 422);
        }

        // Fetch original notification
        $stmt = $pdo->prepare('SELECT * FROM "notification" WHERE id = :id AND user_id = :uid');
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        $notif = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$notif) {
            return $this->notFound('Notification');
        }

        // Generate UUID for the reply
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $replyId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));

        $attachmentId = !empty($body['attachment_id']) ? $body['attachment_id'] : null;

        // Persist in notification_reply table
        $pdo->prepare(
            'INSERT INTO "notification_reply" (id, notification_id, user_id, message, attachment_id, created_at)
             VALUES (:id, :nid, :uid, :msg, :aid, :now)'
        )->execute([
            'id'  => $replyId,
            'nid' => $id,
            'uid' => $userId,
            'msg' => $message,
            'aid' => $attachmentId,
            'now' => $now,
        ]);

        // Build response with attachment details
        $replyData = [
            'id'         => $replyId,
            'message'    => $message,
            'created_at' => $now,
        ];

        if ($attachmentId) {
            $aStmt = $pdo->prepare('SELECT file_name, file_url, mime_type FROM "attachment" WHERE id = :id');
            $aStmt->execute(['id' => $attachmentId]);
            $att = $aStmt->fetch(\PDO::FETCH_ASSOC);
            if ($att) {
                $replyData['attachment'] = $att;
            }
        }

        // If verification notification, also update verification status
        $data = json_decode($notif['data'] ?? '{}', true);
        $verifId = $data['verification_id'] ?? null;

        if ($verifId) {
            $vStmt = $pdo->prepare('SELECT data, status, reviewed_by_id FROM "verification" WHERE id = :id');
            $vStmt->execute(['id' => $verifId]);
            $verif = $vStmt->fetch(\PDO::FETCH_ASSOC);

            if ($verif) {
                $verifData = json_decode($verif['data'] ?? '{}', true);
                $verifData['user_reply'] = $message;
                $verifData['user_reply_at'] = $now;

                $pdo->prepare(
                    'UPDATE "verification" SET data = :data, status = \'in_review\', updated_at = :now WHERE id = :id'
                )->execute([
                    'data' => json_encode($verifData),
                    'now'  => $now,
                    'id'   => $verifId,
                ]);

                // Notify admin reviewer
                if (!empty($verif['reviewed_by_id'])) {
                    try {
                        $nb = random_bytes(16);
                        $nb[6] = chr((ord($nb[6]) & 0x0f) | 0x40);
                        $nb[8] = chr((ord($nb[8]) & 0x3f) | 0x80);
                        $nId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($nb), 4));
                        $pdo->prepare(
                            'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                             VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
                        )->execute([
                            'id'    => $nId,
                            'uid'   => $verif['reviewed_by_id'],
                            'type'  => 'verification.user_reply',
                            'title' => '💬 User replied to verification review',
                            'body'  => substr($message, 0, 200),
                            'data'  => json_encode(['verification_id' => $verifId, 'link' => '/dashboard/admin/verifications']),
                            'prio'  => 'info',
                            'chan'   => 'in_app',
                            'now'   => $now,
                        ]);
                    } catch (\Throwable $e) {
                        error_log("[NotificationController] reply notify: " . $e->getMessage());
                    }
                }
            }
        }

        return $this->json(['data' => $replyData]);
    }

    #[Route('GET', '/{id}/replies', name: 'notif.replies', summary: 'Get replies for notification', tags: ['Notifications'])]
    public function getReplies(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $pdo    = $this->db->pdo();

        // Verify the user owns this notification
        $check = $pdo->prepare('SELECT id FROM "notification" WHERE id = :id AND user_id = :uid');
        $check->execute(['id' => $id, 'uid' => $userId]);
        if (!$check->fetch()) {
            return $this->notFound('Notification');
        }

        // Fetch replies with attachment info
        $stmt = $pdo->prepare(
            'SELECT r.id, r.message, r.created_at,
                    a.id AS attachment_id, a.file_name, a.file_url, a.mime_type
             FROM "notification_reply" r
             LEFT JOIN "attachment" a ON a.id = r.attachment_id
             WHERE r.notification_id = :nid
             ORDER BY r.created_at ASC'
        );
        $stmt->execute(['nid' => $id]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $replies = array_map(function ($r) {
            $reply = [
                'id'         => $r['id'],
                'message'    => $r['message'],
                'created_at' => $r['created_at'],
            ];
            if ($r['attachment_id']) {
                $reply['attachment'] = [
                    'id'        => $r['attachment_id'],
                    'file_name' => $r['file_name'],
                    'file_url'  => $r['file_url'],
                    'mime_type' => $r['mime_type'],
                ];
            }
            return $reply;
        }, $rows);

        return $this->json(['data' => $replies]);
    }
}
