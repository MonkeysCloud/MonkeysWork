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

#[RoutePrefix('/api/v1/admin/conversations')]
#[Middleware(['auth', 'role:admin'])]
final class AdminConversationController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── List all conversations ─────────────────────────── */

    #[Route('GET', '', name: 'admin.conversations', summary: 'All conversations', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ['1=1'];
        $params = [];

        if (!empty($q['search'])) {
            $where[] = '(co.title ILIKE :search OR uc.display_name ILIKE :search OR uf.display_name ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"conversation\" co
             LEFT JOIN \"contract\" ct ON ct.id = co.contract_id
             LEFT JOIN \"user\" uc ON uc.id = ct.client_id
             LEFT JOIN \"user\" uf ON uf.id = ct.freelancer_id
             WHERE {$w}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT co.id, co.title, co.contract_id, co.last_message_at, co.created_at,
                    ct.title AS contract_title, ct.status AS contract_status,
                    uc.display_name AS client_name, uc.avatar_url AS client_avatar,
                    uf.display_name AS freelancer_name, uf.avatar_url AS freelancer_avatar,
                    (SELECT COUNT(*) FROM \"message\" m WHERE m.conversation_id = co.id AND m.deleted_at IS NULL) AS message_count
             FROM \"conversation\" co
             LEFT JOIN \"contract\" ct ON ct.id = co.contract_id
             LEFT JOIN \"user\" uc ON uc.id = ct.client_id
             LEFT JOIN \"user\" uf ON uf.id = ct.freelancer_id
             WHERE {$w}
             ORDER BY co.last_message_at DESC NULLS LAST LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ── Read-only message thread ──────────────────────── */

    #[Route('GET', '/{id}/messages', name: 'admin.conversations.messages', summary: 'Read-only message thread', tags: ['Admin'])]
    public function messages(ServerRequestInterface $request, string $id): JsonResponse
    {
        $p = $this->pagination($request, 50);

        $stmt = $this->db->pdo()->prepare(
            'SELECT m.id, m.content, m.message_type, m.attachments, m.created_at, m.edited_at,
                    u.display_name AS sender_name, u.avatar_url AS sender_avatar, u.role AS sender_role
             FROM "message" m
             JOIN "user" u ON u.id = m.sender_id
             WHERE m.conversation_id = :cid AND m.deleted_at IS NULL
             ORDER BY m.created_at ASC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('cid', $id);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        $msgs = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($msgs as &$m) {
            if (is_string($m['attachments'] ?? null)) {
                $m['attachments'] = json_decode($m['attachments'], true) ?: [];
            }
        }

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "message" WHERE conversation_id = :cid AND deleted_at IS NULL'
        );
        $cnt->execute(['cid' => $id]);
        $total = (int) $cnt->fetchColumn();

        return $this->paginated($msgs, $total, $p['page'], $p['perPage']);
    }
}
