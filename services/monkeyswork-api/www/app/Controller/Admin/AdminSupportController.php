<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/support')]
#[Middleware(['auth', 'role:admin'])]
final class AdminSupportController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── List tickets ───────────────────────────────── */

    #[Route('GET', '', name: 'admin.support.index', summary: 'List support tickets', tags: ['Admin', 'Support'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ' WHERE 1=1';
        $params = [];

        if (!empty($q['status'])) {
            $where .= ' AND st.status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['category'])) {
            $where .= ' AND st.category = :category';
            $params['category'] = $q['category'];
        }
        if (!empty($q['priority'])) {
            $where .= ' AND st.priority = :priority';
            $params['priority'] = $q['priority'];
        }
        if (!empty($q['search'])) {
            $where .= ' AND (st.subject ILIKE :search OR st.email ILIKE :search OR st.name ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        // Count
        $count = $this->db->pdo()->prepare("SELECT COUNT(*) FROM support_ticket st{$where}");
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        // Fetch
        $stmt = $this->db->pdo()->prepare(
            "SELECT st.*, u.display_name AS user_display_name, u.avatar_url AS user_avatar
             FROM support_ticket st
             LEFT JOIN \"user\" u ON u.id = st.user_id
             {$where}
             ORDER BY
                CASE st.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'normal' THEN 3
                    WHEN 'low' THEN 4
                END,
                st.created_at DESC
             LIMIT {$p['perPage']} OFFSET {$p['offset']}"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->paginated($rows, $total, $p['page'], $p['perPage']);
    }

    /* ── Show single ticket ─────────────────────────── */

    #[Route('GET', '/{id}', name: 'admin.support.show', summary: 'Show ticket detail', tags: ['Admin', 'Support'])]
    public function show(ServerRequestInterface $request): JsonResponse
    {
        $id = $request->getAttribute('id');

        $stmt = $this->db->pdo()->prepare(
            'SELECT st.*, u.display_name AS user_display_name, u.avatar_url AS user_avatar
             FROM support_ticket st
             LEFT JOIN "user" u ON u.id = st.user_id
             WHERE st.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $ticket = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$ticket) {
            return $this->notFound('Ticket');
        }

        // Fetch replies
        $replies = $this->db->pdo()->prepare(
            'SELECT sr.*, u.display_name AS author_name, u.avatar_url AS author_avatar
             FROM support_reply sr
             LEFT JOIN "user" u ON u.id = sr.user_id
             WHERE sr.ticket_id = :tid
             ORDER BY sr.created_at ASC'
        );
        $replies->execute(['tid' => $id]);
        $ticket['replies'] = $replies->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $ticket]);
    }

    /* ── Update ticket (status, priority, assign) ──── */

    #[Route('PUT', '/{id}', name: 'admin.support.update', summary: 'Update ticket', tags: ['Admin', 'Support'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $id = $request->getAttribute('id');
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sets = ['updated_at = :now'];
        $params = ['id' => $id, 'now' => $now];

        if (isset($data['status'])) {
            $allowed = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
            if (!in_array($data['status'], $allowed, true)) {
                return $this->error('Invalid status');
            }
            $sets[] = 'status = :status';
            $params['status'] = $data['status'];

            if ($data['status'] === 'resolved' || $data['status'] === 'closed') {
                $sets[] = 'resolved_at = :resolved_at';
                $params['resolved_at'] = $now;
            }
        }

        if (isset($data['priority'])) {
            $sets[] = 'priority = :priority';
            $params['priority'] = $data['priority'];
        }

        if (isset($data['assigned_to'])) {
            $sets[] = 'assigned_to = :assigned_to';
            $params['assigned_to'] = $data['assigned_to'];
        }

        $this->db->pdo()->prepare(
            'UPDATE support_ticket SET ' . implode(', ', $sets) . ' WHERE id = :id'
        )->execute($params);

        return $this->json(['data' => ['id' => $id, 'updated' => true]]);
    }

    /* ── Reply to ticket ────────────────────────────── */

    #[Route('POST', '/{id}/reply', name: 'admin.support.reply', summary: 'Reply to ticket', tags: ['Admin', 'Support'])]
    public function reply(ServerRequestInterface $request): JsonResponse
    {
        $ticketId = $request->getAttribute('id');
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['message'])) {
            return $this->error('Message is required');
        }

        $replyId = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Insert reply
        $this->db->pdo()->prepare(
            'INSERT INTO support_reply (id, ticket_id, user_id, message, is_admin, created_at)
             VALUES (:id, :tid, :uid, :msg, true, :now)'
        )->execute([
                    'id' => $replyId,
                    'tid' => $ticketId,
                    'uid' => $userId,
                    'msg' => $data['message'],
                    'now' => $now,
                ]);

        // Update ticket status to in_progress
        $this->db->pdo()->prepare(
            'UPDATE support_ticket SET status = \'in_progress\', updated_at = :now WHERE id = :id AND status = \'open\''
        )->execute(['id' => $ticketId, 'now' => $now]);

        // Send email notification to user
        $ticket = $this->db->pdo()->prepare('SELECT email, name, subject FROM support_ticket WHERE id = :id');
        $ticket->execute(['id' => $ticketId]);
        $t = $ticket->fetch(\PDO::FETCH_ASSOC);

        if ($t) {
            $this->sendEmail(
                $t['email'],
                "Re: {$t['subject']} — MonkeysWork Support",
                "Hi {$t['name']},\n\nWe've replied to your support ticket:\n\n{$data['message']}\n\n—\nMonkeysWork Support Team"
            );
        }

        return $this->created([
            'data' => ['id' => $replyId, 'ticket_id' => $ticketId],
        ]);
    }

    /* ── Stats ──────────────────────────────────────── */

    #[Route('GET', '/stats', name: 'admin.support.stats', summary: 'Support ticket stats', tags: ['Admin', 'Support'])]
    public function stats(ServerRequestInterface $request): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stats = $pdo->query(
            "SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'open') AS open,
                COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
                COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
                COUNT(*) FILTER (WHERE status = 'closed') AS closed,
                COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h
             FROM support_ticket"
        )->fetch(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $stats]);
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
            $headers = "From: support@monkeysworks.com\r\n";
            $headers .= "Reply-To: support@monkeysworks.com\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            mail($to, $subject, $body, $headers);
        } catch (\Throwable) {
            // Silently fail
        }
    }
}
