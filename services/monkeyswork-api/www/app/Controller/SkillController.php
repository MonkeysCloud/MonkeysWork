<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/skills')]
final class SkillController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'skills.index', summary: 'All skills', tags: ['Taxonomy'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $query = $request->getQueryParams();

        $sql = 'SELECT s.id, s.name, s.slug, s.icon, s.usage_count, c.name AS category_name
                FROM "skill" s
                LEFT JOIN "category" c ON c.id = s.category_id
                WHERE s.is_active = true';

        if (!empty($query['category_id'])) {
            $sql .= ' AND s.category_id = :cat';
        }

        $sql .= ' ORDER BY s.usage_count DESC';

        $stmt = $this->db->pdo()->prepare($sql);
        if (!empty($query['category_id'])) {
            $stmt->bindValue('cat', $query['category_id']);
        }
        $stmt->execute();

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('GET', '/search', name: 'skills.search', summary: 'Autocomplete', tags: ['Taxonomy'])]
    public function search(ServerRequestInterface $request): JsonResponse
    {
        $q = $request->getQueryParams()['q'] ?? '';

        if (strlen($q) < 2) {
            return $this->json(['data' => []]);
        }

        $sql = 'SELECT s.id, s.name, s.slug, s.icon, c.name AS category_name
                FROM "skill" s
                LEFT JOIN "category" c ON c.id = s.category_id
                WHERE s.is_active = true AND s.name ILIKE :q';
        $params = ['q' => "%{$q}%"];

        if (!empty($request->getQueryParams()['category_id'])) {
            $sql .= ' AND s.category_id = :cat';
            $params['cat'] = $request->getQueryParams()['category_id'];
        }

        $sql .= ' ORDER BY s.usage_count DESC LIMIT 20';

        $stmt = $this->db->pdo()->prepare($sql);
        $stmt->execute($params);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('GET', '/{slug}', name: 'skills.show', summary: 'Skill detail', tags: ['Taxonomy'])]
    public function show(ServerRequestInterface $request, string $slug): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT s.*, c.name AS category_name
             FROM "skill" s
             LEFT JOIN "category" c ON c.id = s.category_id
             WHERE s.slug = :slug'
        );
        $stmt->execute(['slug' => $slug]);
        $skill = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$skill) {
            return $this->notFound('Skill');
        }

        return $this->json(['data' => $skill]);
    }
}
