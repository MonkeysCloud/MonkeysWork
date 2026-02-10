<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/freelancers')]
#[Middleware('auth')]
final class FreelancerController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'freelancers.index', summary: 'Search/list freelancers', tags: ['Freelancers'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $query = $request->getQueryParams();
        $p     = $this->pagination($request);

        $where  = ['1=1'];
        $params = [];

        if (!empty($query['skill'])) {
            $where[]          = 'EXISTS (SELECT 1 FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id WHERE fs.freelancer_id = fp.user_id AND s.slug = :skill)';
            $params['skill']  = $query['skill'];
        }
        if (!empty($query['min_rate'])) {
            $where[]             = 'fp.hourly_rate >= :min_rate';
            $params['min_rate']  = $query['min_rate'];
        }
        if (!empty($query['max_rate'])) {
            $where[]             = 'fp.hourly_rate <= :max_rate';
            $params['max_rate']  = $query['max_rate'];
        }
        if (!empty($query['availability'])) {
            $where[]                 = 'fp.availability_status = :avail';
            $params['avail']         = $query['availability'];
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"freelancerprofile\" fp WHERE {$whereSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT fp.*, u.display_name, u.avatar_url, u.country
             FROM \"freelancerprofile\" fp
             JOIN \"user\" u ON u.id = fp.user_id
             WHERE {$whereSql}
             ORDER BY fp.avg_rating DESC, fp.total_jobs_completed DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('limit', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('offset', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}', name: 'freelancers.show', summary: 'Profile detail', tags: ['Freelancers'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT fp.*, u.display_name, u.avatar_url, u.country, u.created_at AS member_since
             FROM "freelancerprofile" fp
             JOIN "user" u ON u.id = fp.user_id
             WHERE fp.user_id = :id'
        );
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$profile) {
            return $this->notFound('Freelancer');
        }

        // Attach skills
        $skills = $this->db->pdo()->prepare(
            'SELECT s.id, s.name, s.slug, fs.years_experience, fs.proficiency
             FROM "freelancer_skills" fs
             JOIN "skill" s ON s.id = fs.skill_id
             WHERE fs.freelancer_id = :id'
        );
        $skills->execute(['id' => $id]);
        $profile['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $profile]);
    }

    #[Route('PUT', '/me', name: 'freelancers.update', summary: 'Update own profile', tags: ['Freelancers'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $allowed = ['headline', 'bio', 'hourly_rate', 'currency', 'experience_years',
                     'education', 'certifications', 'portfolio_urls', 'website_url',
                     'github_url', 'linkedin_url', 'availability_status',
                     'availability_hours_week'];

        $sets   = [];
        $params = ['id' => $userId];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $v = in_array($field, ['education', 'certifications', 'portfolio_urls'])
                    ? json_encode($data[$field]) : $data[$field];
                $sets[]         = "\"{$field}\" = :{$field}";
                $params[$field] = $v;
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[]               = '"updated_at" = :now';
        $params['now']        = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sql = 'UPDATE "freelancerprofile" SET ' . implode(', ', $sets) . ' WHERE user_id = :id';
        $this->db->pdo()->prepare($sql)->execute($params);

        return $this->json(['message' => 'Profile updated']);
    }

    #[Route('PUT', '/me/skills', name: 'freelancers.skills', summary: 'Set skills', tags: ['Freelancers'])]
    public function updateSkills(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $skills = $data['skills'] ?? [];

        $pdo = $this->db->pdo();
        $pdo->beginTransaction();

        try {
            $pdo->prepare('DELETE FROM "freelancer_skills" WHERE freelancer_id = :id')
                ->execute(['id' => $userId]);

            $insert = $pdo->prepare(
                'INSERT INTO "freelancer_skills" (freelancer_id, skill_id, years_experience, proficiency)
                 VALUES (:fid, :sid, :years, :prof)'
            );

            foreach ($skills as $s) {
                $insert->execute([
                    'fid'   => $userId,
                    'sid'   => $s['skill_id'],
                    'years' => $s['years_experience'] ?? 0,
                    'prof'  => $s['proficiency'] ?? 'intermediate',
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error('Failed to update skills: ' . $e->getMessage(), 500);
        }

        return $this->json(['message' => 'Skills updated']);
    }

    #[Route('GET', '/me/stats', name: 'freelancers.stats', summary: 'Earnings/stats', tags: ['Freelancers'])]
    public function stats(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT total_earnings, total_jobs_completed, total_hours_logged,
                    avg_rating, total_reviews, success_rate, response_rate
             FROM "freelancerprofile" WHERE user_id = :id'
        );
        $stmt->execute(['id' => $userId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$stats) {
            return $this->notFound('Freelancer profile');
        }

        return $this->json(['data' => $stats]);
    }

    #[Route('GET', '/me/reviews', name: 'freelancers.reviews', summary: 'Reviews received', tags: ['Freelancers'])]
    public function reviews(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $countStmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "review" WHERE reviewee_id = :uid AND is_public = true'
        );
        $countStmt->execute(['uid' => $userId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT r.*, u.display_name AS reviewer_name, u.avatar_url AS reviewer_avatar
             FROM "review" r JOIN "user" u ON u.id = r.reviewer_id
             WHERE r.reviewee_id = :uid AND r.is_public = true
             ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('limit', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('offset', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}/portfolio', name: 'freelancers.portfolio', summary: 'Portfolio items', tags: ['Freelancers'])]
    public function portfolio(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT portfolio_urls, certifications FROM "freelancerprofile" WHERE user_id = :id'
        );
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$profile) {
            return $this->notFound('Freelancer');
        }

        return $this->json([
            'data' => [
                'portfolio_urls' => json_decode($profile['portfolio_urls'] ?: '[]', true),
                'certifications' => json_decode($profile['certifications'] ?: '[]', true),
            ],
        ]);
    }
}
