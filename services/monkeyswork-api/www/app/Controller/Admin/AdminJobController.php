<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use App\Service\SocketEvent;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/jobs')]
#[Middleware(['auth', 'role:admin'])]
final class AdminJobController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    /* ------------------------------------------------------------------ */
    /*   GET / — All jobs (existing)                                       */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '', name: 'admin.jobs', summary: 'All jobs', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[]          = 'j.status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['search'])) {
            $where[]          = 'j.title ILIKE :search';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"job\" j WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT j.*, u.display_name AS client_name
             FROM \"job\" j JOIN \"user\" u ON u.id = j.client_id
             WHERE {$w} ORDER BY j.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ------------------------------------------------------------------ */
    /*   GET /moderation — jobs needing review                             */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/moderation', name: 'admin.jobs.moderation', summary: 'Moderation queue', tags: ['Admin'])]
    public function queue(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ["j.moderation_status IN ('pending','human_review')"];
        $params = [];

        // Allow filtering by moderation_status
        if (!empty($q['moderation_status'])) {
            $where  = ['j.moderation_status = :ms'];
            $params['ms'] = $q['moderation_status'];
        }
        if (!empty($q['search'])) {
            $where[]          = 'j.title ILIKE :search';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"job\" j WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT j.id, j.title, j.status, j.moderation_status, j.moderation_ai_confidence,
                    j.budget_type, j.budget_min, j.budget_max, j.created_at,
                    u.display_name AS client_name, u.email AS client_email
             FROM \"job\" j
             JOIN \"user\" u ON u.id = j.client_id
             WHERE {$w}
             ORDER BY j.created_at ASC
             LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ------------------------------------------------------------------ */
    /*   GET /{id}/review — enriched detail for review                     */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{id}/review', name: 'admin.jobs.review', summary: 'Job review detail', tags: ['Admin'])]
    public function detail(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            'SELECT j.*, u.display_name AS client_name, u.email AS client_email,
                    u.avatar_url AS client_avatar, c.name AS category_name
             FROM "job" j
             JOIN "user" u ON u.id = j.client_id
             LEFT JOIN "category" c ON c.id = j.category_id
             WHERE j.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }

        // Attach skills
        $skills = $pdo->prepare(
            'SELECT s.id, s.name, s.slug FROM "job_skill" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = :jid'
        );
        $skills->execute(['jid' => $id]);
        $job['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

        // Attach attachments
        $att = $pdo->prepare(
            'SELECT id, file_name, file_url, file_size, mime_type
             FROM "attachment"
             WHERE entity_type = \'job\' AND entity_id = :jid
             ORDER BY sort_order ASC'
        );
        $att->execute(['jid' => $id]);
        $job['attachments'] = $att->fetchAll(\PDO::FETCH_ASSOC);

        // Parse AI result
        if (is_string($job['moderation_ai_result'] ?? null)) {
            $job['moderation_ai_result'] = json_decode($job['moderation_ai_result'], true);
        }

        // Conversation count
        $convCount = $pdo->prepare(
            'SELECT COUNT(*) FROM "job_moderation_conversation" WHERE job_id = :jid'
        );
        $convCount->execute(['jid' => $id]);
        $job['conversation_count'] = (int) $convCount->fetchColumn();

        return $this->json(['data' => $job]);
    }

    /* ------------------------------------------------------------------ */
    /*   POST /{id}/approve                                                */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/approve', name: 'admin.jobs.approve', summary: 'Approve job', tags: ['Admin'])]
    public function approve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data    = $this->body($request);
        $notes   = $data['notes'] ?? null;
        $pdo     = $this->db->pdo();
        $now     = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Fetch job
        $stmt = $pdo->prepare('SELECT client_id, title, status FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) return $this->notFound('Job');
        if (!in_array($job['status'], ['pending_review', 'revision_requested'], true)) {
            return $this->error('Job is not pending review');
        }

        $pdo->prepare(
            'UPDATE "job" SET status = \'open\', moderation_status = \'approved\',
                    moderation_reviewed_by = :admin, moderation_reviewer_notes = :notes,
                    moderation_reviewed_at = :now, published_at = :now, updated_at = :now
             WHERE id = :id'
        )->execute(['admin' => $adminId, 'notes' => $notes, 'now' => $now, 'id' => $id]);

        $this->notifyUser($job['client_id'], $id, $job['title'], 'approved', $pdo, $now, $notes);

        return $this->json(['message' => 'Job approved and published']);
    }

    /* ------------------------------------------------------------------ */
    /*   POST /{id}/reject                                                 */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/reject', name: 'admin.jobs.reject', summary: 'Reject job', tags: ['Admin'])]
    public function reject(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data    = $this->body($request);
        $notes   = $data['notes'] ?? null;
        $pdo     = $this->db->pdo();
        $now     = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $pdo->prepare('SELECT client_id, title, status FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) return $this->notFound('Job');
        if (!in_array($job['status'], ['pending_review', 'revision_requested'], true)) {
            return $this->error('Job is not pending review');
        }

        $pdo->prepare(
            'UPDATE "job" SET status = \'rejected\', moderation_status = \'rejected\',
                    moderation_reviewed_by = :admin, moderation_reviewer_notes = :notes,
                    moderation_reviewed_at = :now, updated_at = :now
             WHERE id = :id'
        )->execute(['admin' => $adminId, 'notes' => $notes, 'now' => $now, 'id' => $id]);

        $this->notifyUser($job['client_id'], $id, $job['title'], 'rejected', $pdo, $now, $notes);

        return $this->json(['message' => 'Job rejected']);
    }

    /* ------------------------------------------------------------------ */
    /*   POST /{id}/request-revision                                       */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/request-revision', name: 'admin.jobs.revision', summary: 'Request revision', tags: ['Admin'])]
    public function requestRevision(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data    = $this->body($request);
        $notes   = $data['notes'] ?? null;
        $pdo     = $this->db->pdo();
        $now     = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $pdo->prepare('SELECT client_id, title, status FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) return $this->notFound('Job');

        $pdo->prepare(
            'UPDATE "job" SET status = \'revision_requested\', moderation_status = \'human_review\',
                    moderation_reviewed_by = :admin, moderation_reviewer_notes = :notes,
                    moderation_reviewed_at = :now, updated_at = :now
             WHERE id = :id'
        )->execute(['admin' => $adminId, 'notes' => $notes, 'now' => $now, 'id' => $id]);

        // Also insert as conversation message
        if ($notes) {
            $msgId = $this->uuid();
            $pdo->prepare(
                'INSERT INTO "job_moderation_conversation" (id, job_id, sender_type, sender_id, message, created_at)
                 VALUES (:id, :jid, \'admin\', :sid, :msg, :now)'
            )->execute(['id' => $msgId, 'jid' => $id, 'sid' => $adminId, 'msg' => $notes, 'now' => $now]);
        }

        $this->notifyUser($job['client_id'], $id, $job['title'], 'revision_requested', $pdo, $now, $notes);

        return $this->json(['message' => 'Revision requested']);
    }

    /* ------------------------------------------------------------------ */
    /*   PATCH /{id}/status — simple status change (existing)              */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/{id}/status', name: 'admin.jobs.status', summary: 'Update job status', tags: ['Admin'])]
    public function updateStatus(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['status'])) {
            return $this->error('status is required');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt = $this->db->pdo()->prepare(
            'UPDATE "job" SET status = :status, updated_at = :now WHERE id = :id'
        );
        $stmt->execute(['status' => $data['status'], 'now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Job');
        }

        return $this->json(['message' => "Job status updated to {$data['status']}"]);
    }

    /* ------------------------------------------------------------------ */
    /*   GET /{id}/conversation — full thread                              */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{id}/conversation', name: 'admin.jobs.conversation', summary: 'Moderation conversation', tags: ['Admin'])]
    public function conversation(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        // Verify job exists
        $check = $pdo->prepare('SELECT id FROM "job" WHERE id = :id');
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            return $this->notFound('Job');
        }

        $stmt = $pdo->prepare(
            'SELECT c.id, c.sender_type, c.sender_id, c.message,
                    c.attachment_url, c.attachment_name, c.attachment_mime, c.attachment_size,
                    c.created_at, u.display_name AS sender_name, u.avatar_url AS sender_avatar
             FROM "job_moderation_conversation" c
             JOIN "user" u ON u.id = c.sender_id
             WHERE c.job_id = :jid
             ORDER BY c.created_at ASC'
        );
        $stmt->execute(['jid' => $id]);

        $messages = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $msg = [
                'id' => $row['id'],
                'sender' => $row['sender_type'],
                'sender_name' => $row['sender_name'],
                'sender_avatar' => $row['sender_avatar'],
                'message' => $row['message'],
                'timestamp' => $row['created_at'],
            ];
            if ($row['attachment_url']) {
                $msg['attachment'] = [
                    'id' => $row['id'],
                    'file_name' => $row['attachment_name'],
                    'file_url' => $row['attachment_url'],
                    'mime_type' => $row['attachment_mime'],
                    'file_size' => (int) $row['attachment_size'],
                ];
            }
            $messages[] = $msg;
        }

        return $this->json(['data' => $messages]);
    }

    /* ------------------------------------------------------------------ */
    /*   POST /{id}/message — admin sends message to client                */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/message', name: 'admin.jobs.message', summary: 'Send moderation message', tags: ['Admin'])]
    public function sendMessage(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data    = $this->body($request);
        $pdo     = $this->db->pdo();
        $now     = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        if (empty($data['message'])) {
            return $this->error('message is required');
        }

        // Verify job exists and get client
        $stmt = $pdo->prepare('SELECT client_id, title FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$job) return $this->notFound('Job');

        $msgId = $this->uuid();
        $pdo->prepare(
            'INSERT INTO "job_moderation_conversation" (id, job_id, sender_type, sender_id, message, created_at)
             VALUES (:id, :jid, \'admin\', :sid, :msg, :now)'
        )->execute([
            'id' => $msgId, 'jid' => $id, 'sid' => $adminId,
            'msg' => $data['message'], 'now' => $now,
        ]);

        // Notify client about new message
        $this->notifyUser($job['client_id'], $id, $job['title'], 'message', $pdo, $now, $data['message']);

        // Return the new message with sender info
        $adminStmt = $pdo->prepare('SELECT display_name, avatar_url FROM "user" WHERE id = :id');
        $adminStmt->execute(['id' => $adminId]);
        $admin = $adminStmt->fetch(\PDO::FETCH_ASSOC);

        return $this->created(['data' => [
            'id' => $msgId,
            'sender' => 'admin',
            'sender_name' => $admin['display_name'] ?? 'Admin',
            'sender_avatar' => $admin['avatar_url'] ?? null,
            'message' => $data['message'],
            'timestamp' => $now,
        ]]);
    }

    /* ------------------------------------------------------------------ */
    /*   UUID helper                                                       */
    /* ------------------------------------------------------------------ */
    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    /* ------------------------------------------------------------------ */
    /*   Notify user via notification table + Socket.IO                    */
    /* ------------------------------------------------------------------ */
    private function notifyUser(
        string $userId, string $jobId, string $title, string $status,
        \PDO $pdo, string $now, ?string $adminMessage = null
    ): void {
        $meta = match ($status) {
            'approved' => [
                'icon' => '✅', 'title' => 'Job Approved',
                'body' => "Your job \"{$title}\" has been approved and is now live!",
                'priority' => 'success',
            ],
            'rejected' => [
                'icon' => '❌', 'title' => 'Job Rejected',
                'body' => "Your job \"{$title}\" was not approved." . ($adminMessage ? " Reason: {$adminMessage}" : ''),
                'priority' => 'warning',
            ],
            'revision_requested' => [
                'icon' => '📝', 'title' => 'Revision Requested',
                'body' => "An admin has requested changes to your job \"{$title}\"." . ($adminMessage ? " Note: {$adminMessage}" : ''),
                'priority' => 'warning',
            ],
            'message' => [
                'icon' => '💬', 'title' => 'New Message About Your Job',
                'body' => "You have a new message about \"{$title}\".",
                'priority' => 'info',
            ],
            default => null,
        };

        if (!$meta) return;

        $notifId = $this->uuid();

        // 1. Persist notification
        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                'id' => $notifId, 'uid' => $userId,
                'type' => "job_moderation.{$status}",
                'title' => "{$meta['icon']} {$meta['title']}",
                'body' => $meta['body'],
                'data' => json_encode([
                    'job_id' => $jobId, 'status' => $status,
                    'link' => "/dashboard/jobs/{$jobId}",
                ]),
                'prio' => $meta['priority'], 'chan' => 'in_app', 'now' => $now,
            ]);
        } catch (\Throwable $e) {
            error_log("[AdminJobController] notification insert: " . $e->getMessage());
        }

        // 2. Push real-time via Redis → Socket.IO
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int)(getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id' => $notifId,
                'type' => "job_moderation.{$status}",
                'title' => "{$meta['icon']} {$meta['title']}",
                'body' => $meta['body'],
                'data' => [
                    'job_id' => $jobId, 'status' => $status,
                    'link' => "/dashboard/jobs/{$jobId}",
                ],
                'priority' => $meta['priority'],
                'created_at' => $now,
            ]);
            $redis->close();
        } catch (\Throwable $e) {
            error_log("[AdminJobController] socket emit: " . $e->getMessage());
        }
    }
}
