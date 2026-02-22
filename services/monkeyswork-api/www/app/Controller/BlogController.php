<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/blog')]
final class BlogController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /* ── List published posts ────────────────────────── */

    #[Route('GET', '', name: 'blog.index', summary: 'Public blog listing', tags: ['Blog'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ["bp.status = 'published'"];
        $params = [];

        if (!empty($q['tag'])) {
            $where[] = 'EXISTS (SELECT 1 FROM blog_post_tag bpt JOIN blog_tag bt ON bt.id = bpt.tag_id WHERE bpt.post_id = bp.id AND bt.slug = :tag)';
            $params['tag'] = $q['tag'];
        }
        if (!empty($q['search'])) {
            $where[] = '(bp.title ILIKE :search OR bp.excerpt ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM blog_post bp WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image,
                    bp.published_at,
                    u.display_name AS author_name, u.avatar_url AS author_avatar,
                    (SELECT string_agg(bt.name, ', ' ORDER BY bt.name)
                     FROM blog_post_tag bpt JOIN blog_tag bt ON bt.id = bpt.tag_id
                     WHERE bpt.post_id = bp.id) AS tags,
                    (SELECT json_agg(json_build_object('name', bt2.name, 'slug', bt2.slug))
                     FROM blog_post_tag bpt2 JOIN blog_tag bt2 ON bt2.id = bpt2.tag_id
                     WHERE bpt2.post_id = bp.id) AS tag_list
             FROM blog_post bp
             JOIN \"user\" u ON u.id = bp.author_id
             WHERE {$w}
             ORDER BY bp.published_at DESC
             LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['tag_list'] = json_decode($row['tag_list'] ?? '[]', true) ?: [];
        }

        return $this->paginated($rows, $total, $p['page'], $p['perPage']);
    }

    /* ── Single post by slug ─────────────────────────── */

    #[Route('GET', '/{slug}', name: 'blog.show', summary: 'Single blog post by slug', tags: ['Blog'])]
    public function show(ServerRequestInterface $request, string $slug): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            "SELECT bp.*, u.display_name AS author_name, u.avatar_url AS author_avatar
             FROM blog_post bp
             JOIN \"user\" u ON u.id = bp.author_id
             WHERE bp.slug = :slug AND bp.status = 'published'"
        );
        $stmt->execute(['slug' => $slug]);
        $post = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$post) {
            return $this->notFound('Blog post');
        }

        // Tags
        $tags = $pdo->prepare(
            'SELECT bt.id, bt.name, bt.slug
             FROM blog_post_tag bpt
             JOIN blog_tag bt ON bt.id = bpt.tag_id
             WHERE bpt.post_id = :pid
             ORDER BY bt.name'
        );
        $tags->execute(['pid' => $post['id']]);
        $post['tags'] = $tags->fetchAll(\PDO::FETCH_ASSOC);

        // Related posts (same tags, excluding self)
        $related = $pdo->prepare(
            "SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image, bp.published_at,
                    u.display_name AS author_name
             FROM blog_post bp
             JOIN \"user\" u ON u.id = bp.author_id
             WHERE bp.status = 'published' AND bp.id != :pid
               AND EXISTS (
                   SELECT 1 FROM blog_post_tag bpt
                   WHERE bpt.post_id = bp.id
                     AND bpt.tag_id IN (SELECT tag_id FROM blog_post_tag WHERE post_id = :pid2)
               )
             ORDER BY bp.published_at DESC
             LIMIT 3"
        );
        $related->execute(['pid' => $post['id'], 'pid2' => $post['id']]);
        $post['related'] = $related->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $post]);
    }

    /* ── Tags with post counts ───────────────────────── */

    #[Route('GET', '/tags', name: 'blog.tags', summary: 'Public tag list with post counts', tags: ['Blog'])]
    public function tags(ServerRequestInterface $request): JsonResponse
    {
        $stmt = $this->db->pdo()->query(
            "SELECT bt.id, bt.name, bt.slug, COUNT(bpt.post_id) AS post_count
             FROM blog_tag bt
             JOIN blog_post_tag bpt ON bpt.tag_id = bt.id
             JOIN blog_post bp ON bp.id = bpt.post_id AND bp.status = 'published'
             GROUP BY bt.id, bt.name, bt.slug
             HAVING COUNT(bpt.post_id) > 0
             ORDER BY post_count DESC, bt.name"
        );

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }
}
