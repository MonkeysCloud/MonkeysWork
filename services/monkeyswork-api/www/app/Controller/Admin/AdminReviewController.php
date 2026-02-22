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

#[RoutePrefix('/api/v1/admin/reviews')]
#[Middleware(['auth', 'role:admin'])]
final class AdminReviewController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── List all reviews ───────────────────────────────── */

    #[Route('GET', '', name: 'admin.reviews', summary: 'All reviews', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ['1=1'];
        $params = [];

        if (!empty($q['min_rating'])) {
            $where[] = 'r.overall_rating >= :minr';
            $params['minr'] = $q['min_rating'];
        }
        if (!empty($q['max_rating'])) {
            $where[] = 'r.overall_rating <= :maxr';
            $params['maxr'] = $q['max_rating'];
        }
        if (isset($q['is_public'])) {
            $where[] = 'r.is_public = :pub';
            $params['pub'] = $q['is_public'] === 'true' ? 'true' : 'false';
        }
        if (!empty($q['search'])) {
            $where[] = '(ur.display_name ILIKE :search OR ue.display_name ILIKE :search OR r.comment ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"review\" r
             JOIN \"user\" ur ON ur.id = r.reviewer_id
             JOIN \"user\" ue ON ue.id = r.reviewee_id
             WHERE {$w}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT r.id, r.contract_id, r.overall_rating, r.communication_rating,
                    r.quality_rating, r.timeliness_rating, r.professionalism_rating,
                    r.comment, r.response, r.is_public, r.created_at,
                    ur.display_name AS reviewer_name, ur.email AS reviewer_email, ur.avatar_url AS reviewer_avatar,
                    ue.display_name AS reviewee_name, ue.email AS reviewee_email, ue.avatar_url AS reviewee_avatar,
                    c.title AS contract_title
             FROM \"review\" r
             JOIN \"user\" ur ON ur.id = r.reviewer_id
             JOIN \"user\" ue ON ue.id = r.reviewee_id
             LEFT JOIN \"contract\" c ON c.id = r.contract_id
             WHERE {$w}
             ORDER BY r.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ── Toggle visibility / update ────────────────────── */

    #[Route('PATCH', '/{id}', name: 'admin.reviews.update', summary: 'Toggle review visibility', tags: ['Admin'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sets = [];
        $params = ['id' => $id, 'now' => $now];

        if (isset($data['is_public'])) {
            $sets[] = '"is_public" = :pub';
            $params['pub'] = $data['is_public'] ? 'true' : 'false';
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "review" SET ' . implode(', ', $sets) . ' WHERE id = :id'
        );
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Review');
        }

        return $this->json(['message' => 'Review updated']);
    }

    /* ── Delete (hide) review ──────────────────────────── */

    #[Route('DELETE', '/{id}', name: 'admin.reviews.delete', summary: 'Hide review', tags: ['Admin'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt = $this->db->pdo()->prepare(
            'UPDATE "review" SET "is_public" = false, "updated_at" = :now WHERE id = :id'
        );
        $stmt->execute(['now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Review');
        }

        return $this->json(['message' => 'Review hidden']);
    }
}
