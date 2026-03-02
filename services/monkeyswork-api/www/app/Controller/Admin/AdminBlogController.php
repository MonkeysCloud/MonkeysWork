<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use App\Service\GcsStorage;
use App\Service\MonkeysMailService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/blog')]
#[Middleware(['auth', 'role:admin'])]
final class AdminBlogController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private GcsStorage $gcs = new GcsStorage(),
    ) {
    }

    /* ── List posts ──────────────────────────────────── */

    #[Route('GET', '', name: 'admin.blog.index', summary: 'List all blog posts', tags: ['Admin', 'Blog'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[] = 'bp.status = :status';
            $params['status'] = $q['status'];
        }
        if (!empty($q['tag'])) {
            $where[] = 'EXISTS (SELECT 1 FROM blog_post_tag bpt JOIN blog_tag bt ON bt.id = bpt.tag_id WHERE bpt.post_id = bp.id AND bt.slug = :tag)';
            $params['tag'] = $q['tag'];
        }
        if (!empty($q['search'])) {
            $where[] = '(bp.title ILIKE :search OR bp.excerpt ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM blog_post bp WHERE {$w}"
        );
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image,
                    bp.status, bp.published_at, bp.created_at, bp.updated_at,
                    u.display_name AS author_name, u.avatar_url AS author_avatar,
                    (SELECT string_agg(bt.name, ', ' ORDER BY bt.name)
                     FROM blog_post_tag bpt JOIN blog_tag bt ON bt.id = bpt.tag_id
                     WHERE bpt.post_id = bp.id) AS tags
             FROM blog_post bp
             JOIN \"user\" u ON u.id = bp.author_id
             WHERE {$w}
             ORDER BY bp.created_at DESC
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

    /* ── Show single post ────────────────────────────── */

    #[Route('GET', '/{id}', name: 'admin.blog.show', summary: 'Get blog post for editing', tags: ['Admin', 'Blog'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            'SELECT bp.*, u.display_name AS author_name, u.avatar_url AS author_avatar
             FROM blog_post bp
             JOIN "user" u ON u.id = bp.author_id
             WHERE bp.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $post = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$post) {
            return $this->notFound('Blog post');
        }

        // Fetch tags
        $tags = $pdo->prepare(
            'SELECT bt.id, bt.name, bt.slug
             FROM blog_post_tag bpt
             JOIN blog_tag bt ON bt.id = bpt.tag_id
             WHERE bpt.post_id = :pid
             ORDER BY bt.name'
        );
        $tags->execute(['pid' => $id]);
        $post['tags'] = $tags->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $post]);
    }

    /* ── Create post ─────────────────────────────────── */

    #[Route('POST', '', name: 'admin.blog.create', summary: 'Create blog post', tags: ['Admin', 'Blog'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['title'])) {
            return $this->error('title is required');
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Generate slug: use provided slug or auto-generate with date prefix
        $slug = !empty($data['slug'])
            ? $data['slug']
            : date('Y-m-d') . '-' . strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $data['title']), '-'));
        $slug = substr($slug, 0, 200);

        $status = $data['status'] ?? 'draft';
        $publishedAt = ($status === 'published') ? $now : null;

        $this->db->pdo()->prepare(
            'INSERT INTO blog_post (id, title, slug, excerpt, content, cover_image,
                                     status, author_id, published_at,
                                     meta_title, meta_description, created_at, updated_at)
             VALUES (:id, :title, :slug, :excerpt, :content, :cover, :status, :author,
                     :pub, :mt, :md, :now, :now)'
        )->execute([
                    'id' => $id,
                    'title' => $data['title'],
                    'slug' => $slug,
                    'excerpt' => $data['excerpt'] ?? null,
                    'content' => $data['content'] ?? '',
                    'cover' => $data['cover_image'] ?? null,
                    'status' => $status,
                    'author' => $userId,
                    'pub' => $publishedAt,
                    'mt' => $data['meta_title'] ?? null,
                    'md' => $data['meta_description'] ?? null,
                    'now' => $now,
                ]);

        // Attach tags
        $this->syncTags($id, $data['tag_ids'] ?? []);

        return $this->created(['data' => ['id' => $id, 'slug' => $slug]]);
    }

    /* ── Update post ─────────────────────────────────── */

    #[Route('PUT', '/{id}', name: 'admin.blog.update', summary: 'Update blog post', tags: ['Admin', 'Blog'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Build SET clause dynamically
        $fields = [];
        $params = ['id' => $id, 'now' => $now];

        foreach (['title', 'slug', 'excerpt', 'content', 'cover_image', 'status', 'meta_title', 'meta_description'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "{$f} = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        // If newly published, set published_at
        if (($data['status'] ?? '') === 'published') {
            $fields[] = 'published_at = COALESCE(published_at, :pub)';
            $params['pub'] = $now;
        }

        if (empty($fields)) {
            return $this->error('No fields to update');
        }

        $fields[] = 'updated_at = :now';
        $set = implode(', ', $fields);

        $stmt = $this->db->pdo()->prepare("UPDATE blog_post SET {$set} WHERE id = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Blog post');
        }

        // Sync tags if provided
        if (array_key_exists('tag_ids', $data)) {
            $this->syncTags($id, $data['tag_ids']);
        }

        return $this->json(['message' => 'Post updated']);
    }

    /* ── Delete post ─────────────────────────────────── */

    #[Route('DELETE', '/{id}', name: 'admin.blog.delete', summary: 'Delete blog post', tags: ['Admin', 'Blog'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare('DELETE FROM blog_post WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Blog post');
        }

        return $this->json(['message' => 'Post deleted']);
    }

    /* ── Publish / Unpublish ─────────────────────────── */

    #[Route('POST', '/{id}/publish', name: 'admin.blog.publish', summary: 'Publish blog post', tags: ['Admin', 'Blog'])]
    public function publish(ServerRequestInterface $request, string $id): JsonResponse
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            "UPDATE blog_post SET status = 'published', published_at = COALESCE(published_at, :now), updated_at = :now2 WHERE id = :id"
        );
        $stmt->execute(['now' => $now, 'now2' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Blog post');
        }

        return $this->json(['message' => 'Post published']);
    }

    /* ── Upload image ───────────────────────────────── */

    private const BLOG_UPLOAD_DIR = '/app/www/public/files/blog';
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    private const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    #[Route('POST', '/upload-image', name: 'admin.blog.upload', summary: 'Upload blog image', tags: ['Admin', 'Blog'])]
    public function uploadImage(ServerRequestInterface $request): JsonResponse
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $raw = $uploadedFiles['image'] ?? null;

            if (!$raw) {
                return $this->error('No image file provided');
            }

            // Handle raw $_FILES array
            if (is_array($raw) && isset($raw['tmp_name'])) {
                $tmpName = $raw['tmp_name'];
                $origName = $raw['name'] ?? 'upload';
                $rawError = (int) ($raw['error'] ?? UPLOAD_ERR_NO_FILE);
                $size = (int) ($raw['size'] ?? 0);

                if ($rawError !== UPLOAD_ERR_OK || !is_uploaded_file($tmpName)) {
                    return $this->error('Upload failed');
                }

                $mime = mime_content_type($tmpName);
                if (!in_array($mime, self::ALLOWED_TYPES, true)) {
                    return $this->error('Invalid image type. Allowed: jpg, png, gif, webp, svg');
                }
                if ($size > self::MAX_SIZE) {
                    return $this->error('File too large (max 10 MB)');
                }

                $ext = pathinfo($origName, PATHINFO_EXTENSION) ?: 'jpg';
                $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);

                if (!is_dir(self::BLOG_UPLOAD_DIR)) {
                    mkdir(self::BLOG_UPLOAD_DIR, 0755, true);
                }

                $filePath = self::BLOG_UPLOAD_DIR . '/' . $filename;
                move_uploaded_file($tmpName, $filePath);
            } elseif ($raw instanceof \Psr\Http\Message\UploadedFileInterface) {
                $file = $raw;
                if ($file->getError() !== UPLOAD_ERR_OK) {
                    return $this->error('Upload failed');
                }

                $origName = $file->getClientFilename() ?? 'upload.jpg';
                $mime = $file->getClientMediaType() ?? '';
                $size = $file->getSize() ?? 0;

                if (!in_array($mime, self::ALLOWED_TYPES, true)) {
                    return $this->error('Invalid image type');
                }
                if ($size > self::MAX_SIZE) {
                    return $this->error('File too large (max 10 MB)');
                }

                $ext = pathinfo($origName, PATHINFO_EXTENSION) ?: 'jpg';
                $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);

                if (!is_dir(self::BLOG_UPLOAD_DIR)) {
                    mkdir(self::BLOG_UPLOAD_DIR, 0755, true);
                }

                $filePath = self::BLOG_UPLOAD_DIR . '/' . $filename;
                $file->moveTo($filePath);
            } else {
                return $this->error('No image file provided');
            }

            $url = $this->gcs->upload($filePath, "files/blog/{$filename}");

            return $this->json(['data' => ['url' => $url, 'filename' => $filename]]);
        } catch (\Throwable $e) {
            error_log('[BlogUpload] ERROR: ' . $e->getMessage());
            return $this->error('Upload failed: ' . $e->getMessage(), 500);
        }
    }

    /* ── Tag CRUD ────────────────────────────────────── */

    #[Route('GET', '/tags', name: 'admin.blog.tags', summary: 'List all tags', tags: ['Admin', 'Blog'])]
    public function tags(ServerRequestInterface $request): JsonResponse
    {
        $stmt = $this->db->pdo()->query(
            'SELECT bt.id, bt.name, bt.slug, COUNT(bpt.post_id) AS post_count
             FROM blog_tag bt
             LEFT JOIN blog_post_tag bpt ON bpt.tag_id = bt.id
             GROUP BY bt.id, bt.name, bt.slug
             ORDER BY bt.name'
        );

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('POST', '/tags', name: 'admin.blog.tags.create', summary: 'Create tag', tags: ['Admin', 'Blog'])]
    public function createTag(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['name'])) {
            return $this->error('name is required');
        }

        $id = $this->uuid();
        $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $data['name']), '-'));

        $this->db->pdo()->prepare(
            'INSERT INTO blog_tag (id, name, slug) VALUES (:id, :name, :slug) ON CONFLICT (slug) DO NOTHING'
        )->execute(['id' => $id, 'name' => $data['name'], 'slug' => $slug]);

        return $this->created(['data' => ['id' => $id, 'name' => $data['name'], 'slug' => $slug]]);
    }

    #[Route('DELETE', '/tags/{id}', name: 'admin.blog.tags.delete', summary: 'Delete tag', tags: ['Admin', 'Blog'])]
    public function deleteTag(ServerRequestInterface $request, string $id): JsonResponse
    {
        $this->db->pdo()->prepare('DELETE FROM blog_tag WHERE id = :id')->execute(['id' => $id]);
        return $this->json(['message' => 'Tag deleted']);
    }

    /* ── Promote post via email ──────────────────────── */

    #[Route('GET', '/{id}/promote/count', name: 'admin.blog.promote.count', summary: 'Get audience counts for promotion', tags: ['Admin', 'Blog'])]
    public function promoteCount(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        $counts = [];
        foreach (['freelancer', 'client'] as $role) {
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM "user" WHERE role = :role AND email IS NOT NULL AND email != \'\'');
            $stmt->execute(['role' => $role]);
            $counts[$role] = (int) $stmt->fetchColumn();
        }

        return $this->json([
            'data' => [
                'freelancers' => $counts['freelancer'],
                'clients' => $counts['client'],
                'all' => $counts['freelancer'] + $counts['client'],
            ],
        ]);
    }

    #[Route('POST', '/{id}/promote', name: 'admin.blog.promote', summary: 'Send promotion emails for a blog post', tags: ['Admin', 'Blog'])]
    public function promote(ServerRequestInterface $request, string $id): JsonResponse
    {
        $data = $this->body($request);
        $audience = $data['audience'] ?? 'all';

        if (!in_array($audience, ['freelancers', 'clients', 'all'], true)) {
            return $this->error('audience must be freelancers, clients, or all');
        }

        $pdo = $this->db->pdo();

        // Fetch blog post
        $stmt = $pdo->prepare('SELECT title, slug, excerpt, cover_image FROM blog_post WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $post = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$post) {
            return $this->notFound('Blog post');
        }

        // Build user query by audience
        $roleFilter = match ($audience) {
            'freelancers' => "role = 'freelancer'",
            'clients' => "role = 'client'",
            default => "role IN ('freelancer', 'client')",
        };

        $userStmt = $pdo->prepare(
            "SELECT email, display_name FROM \"user\" WHERE {$roleFilter} AND email IS NOT NULL AND email != '' ORDER BY created_at"
        );
        $userStmt->execute();
        $users = $userStmt->fetchAll(\PDO::FETCH_ASSOC);

        if (empty($users)) {
            return $this->json(['data' => ['sent' => 0, 'audience' => $audience, 'message' => 'No recipients found']]);
        }

        // Build email data
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
        $postUrl = "{$frontendUrl}/blog/{$post['slug']}";
        $subject = $post['title'] . ' — MonkeysWorks Blog';

        $mail = new MonkeysMailService();
        $sent = 0;
        $failed = 0;

        // Send in batches of 50
        $batches = array_chunk($users, 50);
        foreach ($batches as $batch) {
            foreach ($batch as $user) {
                try {
                    $ok = $mail->sendTemplate(
                        $user['email'],
                        $subject,
                        'blog-promotion',
                        [
                            'userName' => $user['display_name'] ?? 'there',
                            'postTitle' => $post['title'],
                            'postExcerpt' => $post['excerpt'] ?? '',
                            'coverImage' => $post['cover_image'] ?? '',
                            'postUrl' => $postUrl,
                        ],
                        ['blog', 'promotion'],
                    );
                    if ($ok) {
                        $sent++;
                    } else {
                        $failed++;
                    }
                } catch (\Throwable $e) {
                    error_log("[AdminBlog] promote email failed for {$user['email']}: " . $e->getMessage());
                    $failed++;
                }
            }
        }

        error_log("[AdminBlog] Promotion sent for post '{$post['title']}': sent={$sent}, failed={$failed}, audience={$audience}");

        return $this->json([
            'data' => [
                'sent' => $sent,
                'failed' => $failed,
                'total' => count($users),
                'audience' => $audience,
            ],
        ]);
    }

    /* ── Helpers ──────────────────────────────────────── */

    private function syncTags(string $postId, array $tagIds): void
    {
        $pdo = $this->db->pdo();
        $pdo->prepare('DELETE FROM blog_post_tag WHERE post_id = :pid')->execute(['pid' => $postId]);

        if (!empty($tagIds)) {
            $insert = $pdo->prepare(
                'INSERT INTO blog_post_tag (post_id, tag_id) VALUES (:pid, :tid) ON CONFLICT DO NOTHING'
            );
            foreach ($tagIds as $tid) {
                $insert->execute(['pid' => $postId, 'tid' => $tid]);
            }
        }
    }

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
}
