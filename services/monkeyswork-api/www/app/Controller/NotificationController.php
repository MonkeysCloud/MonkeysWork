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
            'UPDATE "notification" SET is_read = true, read_at = :now WHERE user_id = :uid AND is_read = false'
        )->execute(['now' => $now, 'uid' => $userId]);

        return $this->json(['message' => 'All notifications marked as read']);
    }

    #[Route('POST', '/{id}/read', name: 'notif.read', summary: 'Mark single read', tags: ['Notifications'])]
    public function read(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "notification" SET is_read = true, read_at = :now
             WHERE id = :id AND user_id = :uid AND is_read = false'
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
            'SELECT COUNT(*) FROM "notification" WHERE user_id = :uid AND is_read = false'
        );
        $stmt->execute(['uid' => $userId]);

        return $this->json(['data' => ['unread_count' => (int) $stmt->fetchColumn()]]);
    }
}
