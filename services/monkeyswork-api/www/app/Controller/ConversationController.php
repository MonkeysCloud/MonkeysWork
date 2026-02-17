<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\SocketEvent;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/conversations')]
#[Middleware('auth')]
final class ConversationController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'conv.index', summary: 'My conversations', tags: ['Messaging'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(DISTINCT cp.conversation_id) FROM "conversation_participants" cp
             WHERE cp.user_id = :uid'
        );
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT c.*, cp.unread_count,
                    (SELECT content FROM "message" m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
             FROM "conversation" c
             JOIN "conversation_participants" cp ON cp.conversation_id = c.id
             WHERE cp.user_id = :uid
             ORDER BY c.last_message_at DESC NULLS LAST
             LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('POST', '', name: 'conv.create', summary: 'Start conversation', tags: ['Messaging'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['participant_ids'])) {
            return $this->error('participant_ids are required');
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $pdo = $this->db->pdo();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'INSERT INTO "conversation" (id, contract_id, title, created_at, updated_at)
                 VALUES (:id, :cid, :title, :now, :now)'
            )->execute([
                'id'    => $id,
                'cid'   => $data['contract_id'] ?? null,
                'title' => $data['subject'] ?? $data['title'] ?? null,
                'now'   => $now,
            ]);

            // Add participants (including self)
            $participants = array_unique(array_merge([$userId], $data['participant_ids']));
            $ins = $pdo->prepare(
                'INSERT INTO "conversation_participants" (conversation_id, user_id, unread_count, joined_at)
                 VALUES (:cid, :uid, 0, :now)'
            );
            foreach ($participants as $pid) {
                $ins->execute(['cid' => $id, 'uid' => $pid, 'now' => $now]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[ConversationController::create] ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            error_log('[ConversationController::create] TRACE: ' . $e->getTraceAsString());
            return $this->json(['error' => true, 'message' => 'Failed to create conversation', 'debug' => $e->getMessage()], 500);
        }

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/{id}', name: 'conv.show', summary: 'Detail + messages', tags: ['Messaging'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request, 50);

        // Verify participant
        $check = $this->db->pdo()->prepare(
            'SELECT 1 FROM "conversation_participants" WHERE conversation_id = :cid AND user_id = :uid'
        );
        $check->execute(['cid' => $id, 'uid' => $userId]);
        if (!$check->fetch()) {
            return $this->forbidden();
        }

        $conv = $this->db->pdo()->prepare('SELECT * FROM "conversation" WHERE id = :id');
        $conv->execute(['id' => $id]);
        $data = $conv->fetch(\PDO::FETCH_ASSOC);

        if (!$data) {
            return $this->notFound('Conversation');
        }

        // Participants
        $parts = $this->db->pdo()->prepare(
            'SELECT u.id, u.display_name, u.avatar_url
             FROM "conversation_participants" cp JOIN "user" u ON u.id = cp.user_id
             WHERE cp.conversation_id = :cid'
        );
        $parts->execute(['cid' => $id]);
        $data['participants'] = $parts->fetchAll(\PDO::FETCH_ASSOC);

        // Messages (paginated)
        $msgs = $this->db->pdo()->prepare(
            'SELECT m.*, u.display_name AS sender_name
             FROM "message" m JOIN "user" u ON u.id = m.sender_id
             WHERE m.conversation_id = :cid
             ORDER BY m.created_at DESC LIMIT :lim OFFSET :off'
        );
        $msgs->bindValue('cid', $id);
        $msgs->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $msgs->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $msgs->execute();
        $data['messages'] = $msgs->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $data]);
    }

    #[Route('POST', '/{id}/messages', name: 'conv.message', summary: 'Send message', tags: ['Messaging'])]
    public function sendMessage(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $body = $data['body'] ?? $data['content'] ?? '';
        if (empty($body)) {
            return $this->error('Message body is required');
        }

        // Build attachments JSONB from attachment_url(s) if provided
        $attachments = '[]';
        if (!empty($data['attachment_url'])) {
            $urls = array_map('trim', explode(',', $data['attachment_url']));
            $attachments = json_encode(array_map(fn($u) => ['url' => $u], $urls));
        } elseif (!empty($data['attachments'])) {
            $attachments = is_string($data['attachments']) ? $data['attachments'] : json_encode($data['attachments']);
        }

        $msgId = $this->uuid();
        $now   = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo   = $this->db->pdo();

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'INSERT INTO "message" (id, conversation_id, sender_id, content, message_type,
                                        attachments, created_at)
                 VALUES (:id, :cid, :uid, :content, :type, :att, :now)'
            )->execute([
                'id'      => $msgId,
                'cid'     => $id,
                'uid'     => $userId,
                'content' => $body,
                'type'    => $data['message_type'] ?? 'text',
                'att'     => $attachments,
                'now'     => $now,
            ]);

            // Update conversation timestamp
            $pdo->prepare(
                'UPDATE "conversation" SET last_message_at = :now, updated_at = :now WHERE id = :cid'
            )->execute(['now' => $now, 'cid' => $id]);

            // Increment unread for other participants
            $pdo->prepare(
                'UPDATE "conversation_participants" SET unread_count = unread_count + 1
                 WHERE conversation_id = :cid AND user_id != :uid'
            )->execute(['cid' => $id, 'uid' => $userId]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[ConversationController::sendMessage] ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return $this->json(['error' => true, 'message' => 'Failed to send message', 'debug' => $e->getMessage()], 500);
        }

        // Fetch sender display_name for the socket payload
        $senderStmt = $pdo->prepare('SELECT display_name FROM "user" WHERE id = :uid');
        $senderStmt->execute(['uid' => $userId]);
        $senderName = $senderStmt->fetchColumn() ?: 'Unknown';

        // Push real-time via Redis → Socket.IO
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toConversation($id, 'message:new', [
                'id'              => $msgId,
                'conversation_id' => $id,
                'sender_id'       => $userId,
                'sender_name'     => $senderName,
                'content'         => $body,
                'message_type'    => $data['message_type'] ?? 'text',
                'attachments'     => json_decode($attachments, true),
                'created_at'      => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log('[ConversationController::sendMessage] socket emit: ' . $e->getMessage());
        }

        return $this->created(['data' => ['id' => $msgId]]);
    }

    #[Route('POST', '/{id}/read', name: 'conv.read', summary: 'Mark read', tags: ['Messaging'])]
    public function markRead(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "conversation_participants" SET unread_count = 0, last_read_at = :now
             WHERE conversation_id = :cid AND user_id = :uid'
        )->execute(['now' => $now, 'cid' => $id, 'uid' => $userId]);

        // Mark individual messages as read
        $this->db->pdo()->prepare(
            'UPDATE "message" SET read_at = :now
             WHERE conversation_id = :cid AND sender_id != :uid AND read_at IS NULL'
        )->execute(['now' => $now, 'cid' => $id, 'uid' => $userId]);

        return $this->json(['message' => 'Conversation marked as read']);
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
