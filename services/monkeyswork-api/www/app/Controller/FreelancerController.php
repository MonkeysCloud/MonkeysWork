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

    /* ── Text search (name or email) ── */
    if (!empty($query['search'])) {
        $where[]           = '(u.display_name ILIKE :search OR u.email ILIKE :search)';
        $params['search']  = '%' . $query['search'] . '%';
    }

    /* ── Country / Region filter (supports comma-separated codes) ── */
    if (!empty($query['country'])) {
        $countries = array_filter(array_map('trim', explode(',', $query['country'])));
        if (count($countries) === 1) {
            $where[]             = 'u.country = :country';
            $params['country']   = $countries[0];
        } else {
            $cph = [];
            foreach ($countries as $ci => $cc) {
                $k = "country_{$ci}";
                $cph[] = ":{$k}";
                $params[$k] = $cc;
            }
            $where[] = 'u.country IN (' . implode(',', $cph) . ')';
        }
    }

    /* ── Single skill (backward compat) ── */
    if (!empty($query['skill'])) {
        $where[]          = 'EXISTS (SELECT 1 FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id WHERE fs.freelancer_id = fp.user_id AND s.slug = :skill)';
        $params['skill']  = $query['skill'];
    }

    /* ── Multi-skill: skills=react,node,figma (AND match) ── */
    if (!empty($query['skills'])) {
        $slugs = array_filter(array_map('trim', explode(',', $query['skills'])));
        foreach ($slugs as $i => $slug) {
            $key = "skill_{$i}";
            $where[] = "EXISTS (SELECT 1 FROM \"freelancer_skills\" fs JOIN \"skill\" s ON s.id = fs.skill_id WHERE fs.freelancer_id = fp.user_id AND s.slug = :{$key})";
            $params[$key] = $slug;
        }
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
    $fromSql  = '"freelancerprofile" fp JOIN "user" u ON u.id = fp.user_id';

    $countStmt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM {$fromSql} WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    /* ── Also fetch skills per freelancer ── */
    $stmt = $this->db->pdo()->prepare(
        "SELECT fp.*, u.display_name, u.avatar_url, u.email, u.country,
                fp.verification_level
         FROM {$fromSql}
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

    $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    /* Attach skills list to each freelancer */
    if ($rows) {
        $ids = array_column($rows, 'user_id');
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $skillStmt = $this->db->pdo()->prepare(
            "SELECT fs.freelancer_id, s.name, s.slug
             FROM \"freelancer_skills\" fs
             JOIN \"skill\" s ON s.id = fs.skill_id
             WHERE fs.freelancer_id IN ({$ph})"
        );
        $skillStmt->execute($ids);
        $skillMap = [];
        foreach ($skillStmt->fetchAll(\PDO::FETCH_ASSOC) as $sk) {
            $skillMap[$sk['freelancer_id']][] = ['name' => $sk['name'], 'slug' => $sk['slug']];
        }
        foreach ($rows as &$row) {
            $row['skills'] = $skillMap[$row['user_id']] ?? [];
        }
    }

    return $this->paginated($rows, $total, $p['page'], $p['perPage']);
}
    /* ------------------------------------------------------------------ */
    /*  GET /me – Current user's freelancer profile (never 404s)          */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/me', name: 'freelancers.me', summary: 'Own profile', tags: ['Freelancers'])]
    #[Middleware(['auth'])]
    public function me(ServerRequestInterface $request): JsonResponse
    {
        try {
            error_log('[FreelancerController::me] START');
            $userId = $this->userId($request);
            error_log('[FreelancerController::me] userId=' . $userId);

            $stmt = $this->db->pdo()->prepare(
                'SELECT fp.*, u.display_name, u.avatar_url, u.country, u.first_name, u.last_name,
                        u.phone, u.state, u.languages, u.created_at AS member_since
                 FROM "freelancerprofile" fp
                 JOIN "user" u ON u.id = fp.user_id
                 WHERE fp.user_id = :id'
            );
            $stmt->execute(['id' => $userId]);
            $profile = $stmt->fetch(\PDO::FETCH_ASSOC);
            error_log('[FreelancerController::me] profile found=' . ($profile ? 'yes' : 'no'));

            if (!$profile) {
                // Return minimal defaults so the frontend can render empty fields
                $uStmt = $this->db->pdo()->prepare(
                    'SELECT id, display_name, avatar_url, country, first_name, last_name,
                            phone, state, languages, created_at AS member_since
                     FROM "user" WHERE id = :id'
                );
                $uStmt->execute(['id' => $userId]);
                $u = $uStmt->fetch(\PDO::FETCH_ASSOC) ?: [];

                $profile = array_merge($u, [
                    'user_id'               => $userId,
                    'headline'              => null,
                    'bio'                   => null,
                    'hourly_rate'           => null,
                    'currency'              => 'USD',
                    'experience_years'      => null,
                    'availability_status'   => 'available',
                    'availability_hours_week' => 40,
                    'website_url'           => null,
                    'github_url'            => null,
                    'linkedin_url'          => null,
                    'profile_completeness'  => 0,
                    'skills'                => [],
                    'verifications'         => [],
                    'verification_badges'   => [],
                ]);

                error_log('[FreelancerController::me] returning defaults');
                return $this->json(['data' => $profile]);
            }

            // Attach skills
            error_log('[FreelancerController::me] loading skills');
            $skills = $this->db->pdo()->prepare(
                'SELECT s.id, s.name, s.slug, fs.years_experience, fs.proficiency
                 FROM "freelancer_skills" fs
                 JOIN "skill" s ON s.id = fs.skill_id
                 WHERE fs.freelancer_id = :id'
            );
            $skills->execute(['id' => $userId]);
            $profile['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

            // Attach verification badges
            error_log('[FreelancerController::me] loading verifications');
            $verifs = $this->db->pdo()->prepare(
                'SELECT type, status, ai_confidence AS confidence_score, updated_at
                 FROM "verification"
                 WHERE user_id = :id
                 ORDER BY type ASC'
            );
            $verifs->execute(['id' => $userId]);
            $verificationRows = $verifs->fetchAll(\PDO::FETCH_ASSOC);

            $profile['verifications'] = $verificationRows;
            error_log('[FreelancerController::me] building badges');
            $profile['verification_badges'] = $this->buildVerificationBadges($verificationRows);

            // Decode JSONB fields so frontend receives arrays, not JSON strings
            foreach (['portfolio_urls', 'education', 'certifications', 'languages'] as $jsonCol) {
                if (isset($profile[$jsonCol]) && is_string($profile[$jsonCol])) {
                    $profile[$jsonCol] = json_decode($profile[$jsonCol], true) ?? [];
                }
            }

            error_log('[FreelancerController::me] SUCCESS');
            return $this->json(['data' => $profile]);
        } catch (\Throwable $e) {
            error_log('[FreelancerController::me] ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            error_log('[FreelancerController::me] TRACE: ' . $e->getTraceAsString());
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('GET', '/{id}', name: 'freelancers.show', summary: 'Profile detail', tags: ['Freelancers'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $pdo = $this->db->pdo();

        $stmt = $pdo->prepare(
            'SELECT fp.*, u.display_name, u.avatar_url, u.country, u.first_name, u.last_name,
                    u.languages, u.created_at AS member_since
             FROM "freelancerprofile" fp
             JOIN "user" u ON u.id = fp.user_id
             WHERE fp.user_id = :id'
        );
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$profile) {
            return $this->notFound('Freelancer');
        }

        // ── Visibility check ──
        $visibility = $profile['profile_visibility'] ?? 'public';

        if ($visibility === 'private') {
            // Only the owner can see their own private profile
            try {
                $currentUserId = $this->userId($request);
            } catch (\Throwable) {
                $currentUserId = null;
            }
            if ($currentUserId !== $id) {
                return $this->json(['error' => 'This profile is private'], 403);
            }
        }

        if ($visibility === 'logged_in') {
            try {
                $this->userId($request); // throws if not authenticated
            } catch (\Throwable) {
                return $this->json(['error' => 'Login required to view this profile'], 401);
            }
        }

        // ── Decode JSONB fields ──
        foreach (['portfolio_urls', 'education', 'certifications', 'languages'] as $jsonCol) {
            if (isset($profile[$jsonCol]) && is_string($profile[$jsonCol])) {
                $profile[$jsonCol] = json_decode($profile[$jsonCol], true) ?? [];
            }
        }

        // ── Attach skills ──
        $skills = $pdo->prepare(
            'SELECT s.id, s.name, s.slug, fs.years_experience, fs.proficiency
             FROM "freelancer_skills" fs
             JOIN "skill" s ON s.id = fs.skill_id
             WHERE fs.freelancer_id = :id'
        );
        $skills->execute(['id' => $id]);
        $profile['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

        // ── Attach verification badges ──
        $verifs = $pdo->prepare(
            'SELECT type, status, ai_confidence AS confidence_score, updated_at
             FROM "verification"
             WHERE user_id = :id
             ORDER BY type ASC'
        );
        $verifs->execute(['id' => $id]);
        $verificationRows = $verifs->fetchAll(\PDO::FETCH_ASSOC);

        $profile['verifications'] = $verificationRows;
        $profile['verification_badges'] = $this->buildVerificationBadges($verificationRows);

        // ── Attach public reviews ──
        $revStmt = $pdo->prepare(
            'SELECT r.id, r.overall_rating, r.communication_rating, r.quality_rating,
                    r.timeliness_rating, r.professionalism_rating,
                    r.comment, r.response, r.response_at, r.created_at,
                    u.display_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
                    c.title AS contract_title
             FROM "review" r
             JOIN "user" u ON u.id = r.reviewer_id
             LEFT JOIN "contract" c ON c.id = r.contract_id
             WHERE r.reviewee_id = :uid AND r.is_public = true
             ORDER BY r.created_at DESC
             LIMIT 20'
        );
        $revStmt->execute(['uid' => $id]);
        $profile['reviews'] = $revStmt->fetchAll(\PDO::FETCH_ASSOC);

        // ── Attach work history (completed contracts) ──
        $whStmt = $pdo->prepare(
            'SELECT c.id, c.title, c.contract_type, c.status,
                    c.started_at, c.completed_at,
                    u.display_name AS client_name
             FROM "contract" c
             JOIN "user" u ON u.id = c.client_id
             WHERE c.freelancer_id = :uid AND c.status = :status
             ORDER BY c.completed_at DESC
             LIMIT 20'
        );
        $whStmt->execute(['uid' => $id, 'status' => 'completed']);
        $profile['work_history'] = $whStmt->fetchAll(\PDO::FETCH_ASSOC);

        // ── Strip sensitive fields ──
        unset($profile['profile_embedding']);

        return $this->json(['data' => $profile]);
    }

    #[Route('PUT', '/me', name: 'freelancers.update', summary: 'Update own profile', tags: ['Freelancers'])]
    #[Middleware(['auth'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        try {
        error_log('[FreelancerController::update] START');
        $userId = $this->userId($request);
        $data   = $this->body($request);
        error_log('[FreelancerController::update] userId=' . $userId . ' data_keys=' . implode(',', array_keys($data)));
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

        // --- Ensure freelancer profile row exists (handles first-time or failed wizard) ---
        $this->db->pdo()->prepare(
            'INSERT INTO "freelancerprofile" (user_id, created_at, updated_at)
             VALUES (:id, :now, :now)
             ON CONFLICT (user_id) DO NOTHING'
        )->execute(['id' => $userId, 'now' => $now]);

        // --- Update profile fields ---
        $profileFields = ['headline', 'bio', 'hourly_rate', 'currency', 'experience_years',
                          'education', 'certifications', 'portfolio_urls', 'website_url',
                          'github_url', 'linkedin_url', 'availability_status',
                          'availability_hours_week', 'profile_visibility'];
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

        error_log('[FreelancerController::update] SUCCESS completeness=' . $completeness);
        return $this->json([
            'message'              => 'Profile updated',
            'profile_completed'    => true,
            'profile_completeness' => $completeness,
        ]);
        } catch (\Throwable $e) {
            error_log('[FreelancerController::update] ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            error_log('[FreelancerController::update] TRACE: ' . $e->getTraceAsString());
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('PUT', '/me/skills', name: 'freelancers.skills', summary: 'Set skills', tags: ['Freelancers'])]
    #[Middleware(['auth'])]
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
    #[Middleware(['auth'])]
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
    #[Middleware(['auth'])]
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
