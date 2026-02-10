<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\ReviewCreated;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1')]
#[Middleware('auth')]
final class ReviewController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {}

    #[Route('POST', '/reviews', name: 'reviews.create', summary: 'Leave review', tags: ['Reviews'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $required = ['contract_id', 'rating'];
        foreach ($required as $f) {
            if (!isset($data[$f])) {
                return $this->error("Field '{$f}' is required");
            }
        }

        $rating = (int) $data['rating'];
        if ($rating < 1 || $rating > 5) {
            return $this->error('Rating must be between 1 and 5');
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Determine reviewee from contract
        $c = $this->db->pdo()->prepare(
            'SELECT client_id, freelancer_id FROM "contract" WHERE id = :cid'
        );
        $c->execute(['cid' => $data['contract_id']]);
        $contract = $c->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return $this->notFound('Contract');
        }

        $revieweeId = $contract['client_id'] === $userId
            ? $contract['freelancer_id']
            : $contract['client_id'];

        $this->db->pdo()->prepare(
            'INSERT INTO "review" (id, contract_id, reviewer_id, reviewee_id, rating,
                                   communication_rating, quality_rating, timeliness_rating,
                                   comment, is_public, created_at, updated_at)
             VALUES (:id, :cid, :uid, :rid, :rating, :comm, :qual, :time, :comment, true, :now, :now)'
        )->execute([
            'id'      => $id,
            'cid'     => $data['contract_id'],
            'uid'     => $userId,
            'rid'     => $revieweeId,
            'rating'  => $rating,
            'comm'    => $data['communication_rating'] ?? $rating,
            'qual'    => $data['quality_rating'] ?? $rating,
            'time'    => $data['timeliness_rating'] ?? $rating,
            'comment' => $data['comment'] ?? null,
            'now'     => $now,
        ]);

        // Dispatch event
        $this->events?->dispatch(new ReviewCreated($id, $data['contract_id'], $userId, $revieweeId, $rating));

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/reviews/{id}', name: 'reviews.show', summary: 'Review detail', tags: ['Reviews'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT r.*, u.display_name AS reviewer_name
             FROM "review" r JOIN "user" u ON u.id = r.reviewer_id
             WHERE r.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            return $this->notFound('Review');
        }

        return $this->json(['data' => $review]);
    }

    #[Route('POST', '/reviews/{id}/respond', name: 'reviews.respond', summary: 'Reviewee reply', tags: ['Reviews'])]
    public function respond(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $stmt = $this->db->pdo()->prepare('SELECT reviewee_id FROM "review" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $review = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$review) {
            return $this->notFound('Review');
        }
        if ($review['reviewee_id'] !== $userId) {
            return $this->forbidden('Only the reviewee can respond');
        }

        $this->db->pdo()->prepare(
            'UPDATE "review" SET response = :resp, response_at = :now, updated_at = :now WHERE id = :id'
        )->execute([
            'resp' => $data['response'] ?? '',
            'now'  => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'id'   => $id,
        ]);

        return $this->json(['message' => 'Response added']);
    }

    #[Route('GET', '/users/{id}/reviews', name: 'users.reviews', summary: "User's reviews", tags: ['Reviews'])]
    public function byUser(ServerRequestInterface $request, string $id): JsonResponse
    {
        $p = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "review" WHERE reviewee_id = :uid AND is_public = true'
        );
        $cnt->execute(['uid' => $id]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT r.*, u.display_name AS reviewer_name, u.avatar_url AS reviewer_avatar
             FROM "review" r JOIN "user" u ON u.id = r.reviewer_id
             WHERE r.reviewee_id = :uid AND r.is_public = true
             ORDER BY r.created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $id);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
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
