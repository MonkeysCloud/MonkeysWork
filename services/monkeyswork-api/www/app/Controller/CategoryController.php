<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/categories')]
final class CategoryController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'categories.index', summary: 'All categories', tags: ['Taxonomy'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $stmt = $this->db->pdo()->query(
            'SELECT id, name, slug, parent_id, description, icon, sort_order, job_count
             FROM "category" WHERE is_active = true
             ORDER BY sort_order ASC, name ASC'
        );

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('GET', '/{slug}', name: 'categories.show', summary: 'Category + skills', tags: ['Taxonomy'])]
    public function show(ServerRequestInterface $request, string $slug): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "category" WHERE slug = :slug AND is_active = true'
        );
        $stmt->execute(['slug' => $slug]);
        $cat = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$cat) {
            return $this->notFound('Category');
        }

        $skills = $this->db->pdo()->prepare(
            'SELECT id, name, slug, icon, usage_count FROM "skill"
             WHERE category_id = :cid AND is_active = true
             ORDER BY usage_count DESC'
        );
        $skills->execute(['cid' => $cat['id']]);
        $cat['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $cat]);
    }
}
