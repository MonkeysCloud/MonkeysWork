<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\PubSubPublisher;
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

    public function __construct(
        private ConnectionInterface $db,
        private ?PubSubPublisher $pubsub = null,
    ) {}

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
            "SELECT fp.*, u.display_name, u.avatar_url, u.country,
                    fp.verification_level
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

        // Attach verification badges
        $verifs = $this->db->pdo()->prepare(
            'SELECT type, status, ai_confidence AS confidence_score, updated_at
             FROM "verification"
             WHERE user_id = :id
             ORDER BY type ASC'
        );
        $verifs->execute(['id' => $id]);
        $verificationRows = $verifs->fetchAll(\PDO::FETCH_ASSOC);

        $profile['verifications'] = $verificationRows;
        $profile['verification_badges'] = $this->buildVerificationBadges($verificationRows);

        return $this->json(['data' => $profile]);
    }

    #[Route('PUT', '/me', name: 'freelancers.update', summary: 'Update own profile', tags: ['Freelancers'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // --- Update user-level fields ---
        $userFields = ['first_name', 'last_name', 'phone', 'country', 'state', 'display_name', 'avatar_url', 'languages'];
        $userSets   = [];
        $userParams = ['id' => $userId];

        foreach ($userFields as $field) {
            if (array_key_exists($field, $data)) {
                $userSets[]         = "\"{$field}\" = :{$field}";
                $userParams[$field] = $field === 'languages' ? json_encode($data[$field]) : $data[$field];
            }
        }

        if (!empty($userSets)) {
            $userSets[]        = '"updated_at" = :now';
            $userParams['now'] = $now;
            $sql = 'UPDATE "user" SET ' . implode(', ', $userSets) . ' WHERE id = :id';
            $this->db->pdo()->prepare($sql)->execute($userParams);
        }

        // --- Update profile fields ---
        $profileFields = ['headline', 'bio', 'hourly_rate', 'currency', 'experience_years',
                          'education', 'certifications', 'portfolio_urls', 'website_url',
                          'github_url', 'linkedin_url', 'availability_status',
                          'availability_hours_week'];
        $sets   = [];
        $params = ['id' => $userId];

        foreach ($profileFields as $field) {
            if (array_key_exists($field, $data)) {
                $v = in_array($field, ['education', 'certifications', 'portfolio_urls'])
                    ? json_encode($data[$field]) : $data[$field];
                $sets[]         = "\"{$field}\" = :{$field}";
                $params[$field] = $v;
            }
        }

        if (!empty($sets)) {
            $sets[]        = '"updated_at" = :now';
            $params['now'] = $now;
            $sql = 'UPDATE "freelancerprofile" SET ' . implode(', ', $sets) . ' WHERE user_id = :id';
            $this->db->pdo()->prepare($sql)->execute($params);
        }

        // --- Mark profile as completed ---
        $this->db->pdo()->prepare(
            'UPDATE "user" SET profile_completed = TRUE, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $userId]);

        // --- Compute profile completeness + publish event ---
        $completeness = $this->computeProfileCompleteness($userId);

        // Store computed score
        $this->db->pdo()->prepare(
            'UPDATE "freelancerprofile" SET profile_completeness = :score, updated_at = :now WHERE user_id = :id'
        )->execute(['score' => $completeness, 'now' => $now, 'id' => $userId]);

        // Publish profile-ready event when completeness >= 60%
        if ($completeness >= 60) {
            $pubsub = $this->pubsub ?? new PubSubPublisher();
            try {
                $pubsub->profileReady($userId);
            } catch (\Throwable) {
                // Non-critical: don't fail update if Pub/Sub is down
            }
        }

        return $this->json([
            'message'              => 'Profile updated',
            'profile_completed'    => true,
            'profile_completeness' => $completeness,
        ]);
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

    /**
     * Compute profile completeness score (0-100) based on filled fields.
     */
    private function computeProfileCompleteness(string $userId): int
    {
        $pdo = $this->db->pdo();

        // Fetch profile + user fields
        $stmt = $pdo->prepare(
            'SELECT u.display_name, u.first_name, u.last_name, u.avatar_url, u.country,
                    fp.headline, fp.bio, fp.hourly_rate, fp.experience_years,
                    fp.portfolio_urls, fp.education, fp.availability_status
             FROM "freelancerprofile" fp
             JOIN "user" u ON u.id = fp.user_id
             WHERE fp.user_id = :id'
        );
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) return 0;

        $score = 0;
        $checks = [
            ['field' => 'display_name',        'weight' => 10],
            ['field' => 'first_name',           'weight' => 5],
            ['field' => 'last_name',            'weight' => 5],
            ['field' => 'avatar_url',           'weight' => 10],
            ['field' => 'country',              'weight' => 5],
            ['field' => 'headline',             'weight' => 15],
            ['field' => 'bio',                  'weight' => 15],
            ['field' => 'hourly_rate',          'weight' => 10],
            ['field' => 'experience_years',     'weight' => 5],
            ['field' => 'availability_status',  'weight' => 5],
        ];

        foreach ($checks as $c) {
            $val = $row[$c['field']] ?? null;
            if ($val !== null && $val !== '' && $val !== '0') {
                $score += $c['weight'];
            }
        }

        // Portfolio bonus (up to 10)
        $portfolio = json_decode($row['portfolio_urls'] ?: '[]', true);
        if (!empty($portfolio)) $score += 10;

        // Skills bonus (up to 5)
        $skillStmt = $pdo->prepare('SELECT COUNT(*) FROM "freelancer_skills" WHERE freelancer_id = :id');
        $skillStmt->execute(['id' => $userId]);
        $skillCount = (int) $skillStmt->fetchColumn();
        if ($skillCount >= 3) $score += 5;

        return min(100, $score);
    }

    /**
     * Build verification badge summary from verification rows.
     *
     * @param array $verificationRows
     * @return array{level: string, badges: array, total_approved: int, total_types: int}
     */
    private function buildVerificationBadges(array $verificationRows): array
    {
        $allTypes  = ['identity', 'skill_assessment', 'portfolio', 'work_history', 'payment_method'];
        $approved  = ['approved', 'auto_approved'];
        $badges    = [];
        $approvedCount = 0;

        // Build badge map from actual verification rows
        $typeMap = [];
        foreach ($verificationRows as $row) {
            $typeMap[$row['type']] = $row;
        }

        foreach ($allTypes as $type) {
            if (isset($typeMap[$type])) {
                $row = $typeMap[$type];
                $isApproved = in_array($row['status'], $approved);
                if ($isApproved) $approvedCount++;

                $badges[] = [
                    'type'       => $type,
                    'label'      => $this->verificationLabel($type),
                    'status'     => $row['status'],
                    'verified'   => $isApproved,
                    'confidence' => $row['confidence_score'] ? (float) $row['confidence_score'] : null,
                    'verified_at' => $isApproved ? $row['updated_at'] : null,
                ];
            } else {
                $badges[] = [
                    'type'       => $type,
                    'label'      => $this->verificationLabel($type),
                    'status'     => 'not_submitted',
                    'verified'   => false,
                    'confidence' => null,
                    'verified_at' => null,
                ];
            }
        }

        // Determine level
        $level = match (true) {
            $approvedCount >= 4 => 'premium',
            $approvedCount >= 2 => 'verified',
            $approvedCount >= 1 => 'basic',
            default             => 'none',
        };

        return [
            'level'          => $level,
            'badges'         => $badges,
            'total_approved' => $approvedCount,
            'total_types'    => count($allTypes),
        ];
    }

    private function verificationLabel(string $type): string
    {
        return match ($type) {
            'identity'         => 'Identity Verified',
            'skill_assessment' => 'Skills Verified',
            'portfolio'        => 'Portfolio Verified',
            'work_history'     => 'Work History Verified',
            'payment_method'   => 'Payment Verified',
            default            => ucfirst(str_replace('_', ' ', $type)),
        };
    }
}
