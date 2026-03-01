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

#[RoutePrefix('/api/v1/admin/verifications')]
#[Middleware(['auth', 'role:admin,ops'])]
final class AdminVerifController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ------------------------------------------------------------------ */
    /*  GET /queue — items needing review                                  */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/queue', name: 'admin.verif.queue', summary: 'Review queue', tags: ['Admin'])]
    public function queue(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $params = $request->getQueryParams();
        $pdo = $this->db->pdo();

        $where = [];
        $binds = [];

        // Status filter — default to queue statuses
        $filterStatus = $params['status'] ?? null;
        if ($filterStatus && in_array($filterStatus, ['pending', 'in_review', 'human_review', 'info_requested', 'approved', 'rejected'], true)) {
            $where[] = 'v.status = :status';
            $binds['status'] = $filterStatus;
        } else {
            $where[] = "v.status IN ('pending', 'in_review', 'human_review', 'info_requested')";
        }

        // Type filter
        $filterType = $params['type'] ?? null;
        if ($filterType) {
            $where[] = 'v.type = :type';
            $binds['type'] = $filterType;
        }

        // Search by user name or email
        $search = $params['search'] ?? null;
        if ($search) {
            $where[] = '(u.display_name ILIKE :search OR u.email ILIKE :search)';
            $binds['search'] = "%{$search}%";
        }

        $whereClause = implode(' AND ', $where);

        $cnt = $pdo->prepare("SELECT COUNT(*) FROM \"verification\" v JOIN \"user\" u ON u.id = v.user_id WHERE {$whereClause}");
        $cnt->execute($binds);
        $total = (int) $cnt->fetchColumn();

        $stmt = $pdo->prepare(
            "SELECT v.*, u.display_name, u.email
             FROM \"verification\" v JOIN \"user\" u ON u.id = v.user_id
             WHERE {$whereClause}
             ORDER BY v.created_at ASC LIMIT :lim OFFSET :off"
        );
        foreach ($binds as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }
    /* ------------------------------------------------------------------ */
    /*  GET /{id} — enriched detail for review                             */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{id}', name: 'admin.verif.detail', summary: 'Verification detail', tags: ['Admin'])]
    public function detail(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        // Base verification + user info
        $stmt = $pdo->prepare(
            'SELECT v.*, u.display_name, u.email, u.role
             FROM "verification" v JOIN "user" u ON u.id = v.user_id
             WHERE v.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return $this->notFound('Verification');
        }

        // Enrich with freelancer profile data
        $profStmt = $pdo->prepare(
            'SELECT headline, bio, hourly_rate, currency, experience_years,
                    certifications, portfolio_urls, education,
                    website_url, github_url, linkedin_url,
                    availability_status, availability_hours_week,
                    avg_rating, total_reviews, total_jobs_completed, total_earnings
             FROM "freelancerprofile" WHERE user_id = :uid'
        );
        $profStmt->execute(['uid' => $row['user_id']]);
        $profile = $profStmt->fetch(\PDO::FETCH_ASSOC);

        if ($profile) {
            // Decode JSONB fields
            foreach (['certifications', 'portfolio_urls', 'education'] as $jsonCol) {
                if (isset($profile[$jsonCol]) && is_string($profile[$jsonCol])) {
                    $profile[$jsonCol] = json_decode($profile[$jsonCol], true) ?? [];
                }
            }
            $row['profile'] = $profile;
        }

        // Enrich with skills
        $skillStmt = $pdo->prepare(
            'SELECT s.name, fs.proficiency, fs.years_experience
             FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id
             WHERE fs.freelancer_id = :uid ORDER BY fs.years_experience DESC'
        );
        $skillStmt->execute(['uid' => $row['user_id']]);
        $row['skills'] = $skillStmt->fetchAll(\PDO::FETCH_ASSOC);

        // Decode verification data/ai_result
        foreach (['data', 'ai_result'] as $jsonCol) {
            if (isset($row[$jsonCol]) && is_string($row[$jsonCol])) {
                $row[$jsonCol] = json_decode($row[$jsonCol], true);
            }
        }

        // Fetch verification-related attachments (e.g. government ID photos)
        $attStmt = $pdo->prepare(
            'SELECT id, file_name, file_url, mime_type, file_size, created_at
             FROM "attachment"
             WHERE entity_type = \'verification\' AND uploaded_by_id = :uid
             ORDER BY created_at DESC'
        );
        $attStmt->execute(['uid' => $row['user_id']]);
        $row['attachments'] = $attStmt->fetchAll(\PDO::FETCH_ASSOC);

        // Fetch payment methods (for payment_method verifications)
        if ($row['type'] === 'payment_method') {
            $pmStmt = $pdo->prepare(
                'SELECT type, provider, last_four, is_default, expiry, verified, created_at
                 FROM "paymentmethod" WHERE user_id = :uid AND is_active = true
                 ORDER BY is_default DESC, created_at DESC'
            );
            $pmStmt->execute(['uid' => $row['user_id']]);
            $row['payment_methods'] = $pmStmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        return $this->json($row);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /{id}/approve                                                 */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/approve', name: 'admin.verif.approve', summary: 'Approve verification', tags: ['Admin'])]
    public function approve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            'UPDATE "verification" SET status = \'approved\', reviewed_by_id = :uid,
                    reviewer_notes = :notes, reviewed_at = :now, updated_at = :now
             WHERE id = :id RETURNING user_id, type'
        );
        $stmt->execute([
            'uid' => $adminId,
            'notes' => $data['notes'] ?? null,
            'now' => $now,
            'id' => $id,
        ]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return $this->notFound('Verification');
        }

        $this->notifyUser($row['user_id'], $id, $row['type'], 'approved', $pdo, $now);

        return $this->json(['message' => 'Verification approved']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /{id}/reject                                                  */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/reject', name: 'admin.verif.reject', summary: 'Reject verification', tags: ['Admin'])]
    public function reject(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            'UPDATE "verification" SET status = \'rejected\', reviewed_by_id = :uid,
                    reviewer_notes = :notes, reviewed_at = :now, updated_at = :now
             WHERE id = :id RETURNING user_id, type'
        );
        $stmt->execute([
            'uid' => $adminId,
            'notes' => $data['reason'] ?? $data['notes'] ?? null,
            'now' => $now,
            'id' => $id,
        ]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return $this->notFound('Verification');
        }

        $this->notifyUser(
            $row['user_id'],
            $id,
            $row['type'],
            'rejected',
            $pdo,
            $now,
            $data['reason'] ?? $data['notes'] ?? null
        );

        return $this->json(['message' => 'Verification rejected']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /{id}/request-info                                            */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/request-info', name: 'admin.verif.requestInfo', summary: 'Request more info', tags: ['Admin'])]
    public function requestInfo(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();

        if (empty($data['message'])) {
            return $this->error('Message is required');
        }

        $stmt = $pdo->prepare(
            'UPDATE "verification" SET status = \'info_requested\', reviewed_by_id = :uid,
                    reviewer_notes = :notes, updated_at = :now
             WHERE id = :id RETURNING user_id, type'
        );
        $stmt->execute([
            'uid' => $adminId,
            'notes' => $data['message'],
            'now' => $now,
            'id' => $id,
        ]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return $this->notFound('Verification');
        }

        $this->notifyUser(
            $row['user_id'],
            $id,
            $row['type'],
            'info_requested',
            $pdo,
            $now,
            $data['message']
        );

        return $this->json(['message' => 'Information requested']);
    }

    /* ------------------------------------------------------------------ */
    /*  GET /{id}/conversation — full thread for a verification            */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{id}/conversation', name: 'admin.verif.conversation', summary: 'Get verification conversation', tags: ['Admin'])]
    public function conversation(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        // Verify the verification exists
        $check = $pdo->prepare('SELECT id, user_id FROM "verification" WHERE id = :id');
        $check->execute(['id' => $id]);
        $verif = $check->fetch(\PDO::FETCH_ASSOC);
        if (!$verif) {
            return $this->notFound('Verification');
        }

        $userId = $verif['user_id'];
        $thread = [];

        // 1) Admin messages sent TO the user (notifications with verification_id in data)
        $nStmt = $pdo->prepare(
            "SELECT n.id, n.title, n.body, n.type, n.created_at, n.data
             FROM \"notification\" n
             WHERE n.user_id = :uid
               AND n.data::text LIKE :vid_pattern
             ORDER BY n.created_at ASC"
        );
        $nStmt->execute([
            'uid' => $userId,
            'vid_pattern' => '%' . $id . '%',
        ]);

        foreach ($nStmt->fetchAll(\PDO::FETCH_ASSOC) as $n) {
            $nData = json_decode($n['data'] ?? '{}', true);
            if (($nData['verification_id'] ?? '') !== $id)
                continue;
            $thread[] = [
                'id' => $n['id'],
                'sender' => 'admin',
                'type' => $n['type'],
                'title' => $n['title'],
                'message' => $n['body'] ?? '',
                'timestamp' => $n['created_at'],
            ];
        }

        // 2) User replies to those notifications (from notification_reply)
        $rStmt = $pdo->prepare(
            "SELECT r.id, r.message, r.created_at,
                    a.id AS attachment_id, a.file_name, a.file_url, a.mime_type, a.file_size
             FROM \"notification_reply\" r
             LEFT JOIN \"attachment\" a ON a.id = r.attachment_id
             WHERE r.user_id = :uid
               AND r.notification_id IN (
                   SELECT n.id FROM \"notification\" n
                   WHERE n.user_id = :uid2
                     AND n.data::text LIKE :vid_pattern
               )
             ORDER BY r.created_at ASC"
        );
        $rStmt->execute([
            'uid' => $userId,
            'uid2' => $userId,
            'vid_pattern' => '%' . $id . '%',
        ]);

        foreach ($rStmt->fetchAll(\PDO::FETCH_ASSOC) as $r) {
            $entry = [
                'id' => $r['id'],
                'sender' => 'user',
                'message' => $r['message'],
                'timestamp' => $r['created_at'],
            ];
            if ($r['attachment_id']) {
                $entry['attachment'] = [
                    'id' => $r['attachment_id'],
                    'file_name' => $r['file_name'],
                    'file_url' => $r['file_url'],
                    'mime_type' => $r['mime_type'],
                    'file_size' => (int) $r['file_size'],
                ];
            }
            $thread[] = $entry;
        }

        // Sort all by timestamp
        usort($thread, fn($a, $b) => strcmp($a['timestamp'], $b['timestamp']));

        return $this->json(['data' => $thread]);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /{id}/message — admin sends message to user about verif       */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/{id}/message', name: 'admin.verif.message', summary: 'Send message to user', tags: ['Admin'])]
    public function sendMessage(ServerRequestInterface $request, string $id): JsonResponse
    {
        $adminId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();

        $message = trim($data['message'] ?? '');
        if ($message === '') {
            return $this->error('Message is required');
        }

        // Get verification + user
        $stmt = $pdo->prepare('SELECT user_id, type FROM "verification" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $verif = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$verif) {
            return $this->notFound('Verification');
        }

        $typeLabels = [
            'identity' => 'Identity',
            'skill_assessment' => 'Skill Assessment',
            'portfolio' => 'Portfolio',
            'work_history' => 'Work History',
            'payment_method' => 'Payment Method',
        ];
        $label = $typeLabels[$verif['type']] ?? ucfirst(str_replace('_', ' ', $verif['type']));

        // Create notification for user
        $notifId = $this->uuid();
        $pdo->prepare(
            'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
             VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
        )->execute([
                    'id' => $notifId,
                    'uid' => $verif['user_id'],
                    'type' => 'verification.admin_message',
                    'title' => "💬 {$label} — Message from Reviewer",
                    'body' => $message,
                    'data' => json_encode([
                        'verification_id' => $id,
                        'verification_type' => $verif['type'],
                        'link' => '/dashboard/messages',
                    ]),
                    'prio' => 'info',
                    'chan' => 'in_app',
                    'now' => $now,
                ]);

        // Also emit via Socket.IO
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($verif['user_id'], 'notification:new', [
                'id' => $notifId,
                'type' => 'verification.admin_message',
                'title' => "💬 {$label} — Message from Reviewer",
                'body' => $message,
                'data' => [
                    'verification_id' => $id,
                    'verification_type' => $verif['type'],
                    'link' => '/dashboard/messages',
                ],
                'priority' => 'info',
                'created_at' => $now,
            ]);
            $redis->close();
        } catch (\Throwable $e) {
            error_log("[AdminVerif] message socket emit: " . $e->getMessage());
        }

        return $this->json([
            'data' => [
                'id' => $notifId,
                'message' => $message,
                'timestamp' => $now,
            ]
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  UUID helper                                                        */
    /* ------------------------------------------------------------------ */
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

    /* ------------------------------------------------------------------ */
    /*  Notify user via notification table + Socket.IO                     */
    /* ------------------------------------------------------------------ */
    private function notifyUser(
        string $userId,
        string $verifId,
        string $type,
        string $status,
        \PDO $pdo,
        string $now,
        ?string $adminMessage = null
    ): void {
        $typeLabels = [
            'identity' => 'Identity',
            'skill_assessment' => 'Skill Assessment',
            'portfolio' => 'Portfolio',
            'work_history' => 'Work History',
            'payment_method' => 'Payment Method',
        ];
        $label = $typeLabels[$type] ?? ucfirst(str_replace('_', ' ', $type));

        $meta = match ($status) {
            'approved' => [
                'icon' => '✅',
                'title' => "{$label} Verified",
                'body' => "Your {$label} verification has been approved by our review team.",
                'priority' => 'success',
            ],
            'rejected' => [
                'icon' => '❌',
                'title' => "{$label} Verification Declined",
                'body' => $adminMessage
                    ? "Your {$label} verification was declined: {$adminMessage}"
                    : "Your {$label} verification was declined. Please review and resubmit.",
                'priority' => 'warning',
            ],
            'info_requested' => [
                'icon' => '📋',
                'title' => "{$label} — More Info Needed",
                'body' => $adminMessage
                    ? "Our team needs more information about your {$label} verification: {$adminMessage}"
                    : "Our team needs more information about your {$label} verification.",
                'priority' => 'info',
            ],
            default => null,
        };

        if (!$meta)
            return;

        $notifId = $this->uuid();

        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                        'id' => $notifId,
                        'uid' => $userId,
                        'type' => "verification.{$status}",
                        'title' => "{$meta['icon']} {$meta['title']}",
                        'body' => $meta['body'],
                        'data' => json_encode([
                            'verification_id' => $verifId,
                            'verification_type' => $type,
                            'status' => $status,
                            'link' => '/dashboard/settings/verification',
                        ]),
                        'prio' => $meta['priority'],
                        'chan' => 'in_app',
                        'now' => $now,
                    ]);
        } catch (\Throwable $e) {
            error_log("[AdminVerif] notification insert: " . $e->getMessage());
        }

        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id' => $notifId,
                'type' => "verification.{$status}",
                'title' => "{$meta['icon']} {$meta['title']}",
                'body' => $meta['body'],
                'data' => [
                    'verification_id' => $verifId,
                    'verification_type' => $type,
                    'status' => $status,
                    'link' => '/dashboard/settings/verification',
                ],
                'priority' => $meta['priority'],
                'created_at' => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log("[AdminVerif] socket emit: " . $e->getMessage());
        }
    }
}
