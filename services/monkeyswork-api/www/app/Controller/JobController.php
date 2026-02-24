<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\JobCreated;
use App\Event\JobPublished;
use App\Service\PubSubPublisher;
use App\Service\SocketEvent;
use App\Service\VertexAiScorer;
use App\Validator\JobValidator;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/jobs')]
#[Middleware('auth')]
final class JobController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private JobValidator $jobValidator = new JobValidator(),
        private ?EventDispatcherInterface $events = null,
        private ?PubSubPublisher $pubsub = null,
    ) {
    }

    #[Route('GET', '', name: 'jobs.index', summary: 'Search/browse jobs', tags: ['Jobs'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $q = $request->getQueryParams();
        $p = $this->pagination($request);

        $where = ['"j"."status" = \'open\''];
        $params = [];

        if (!empty($q['category_id'])) {
            $where[] = 'j.category_id = :cat';
            $params['cat'] = $q['category_id'];
        }
        if (!empty($q['budget_type'])) {
            $where[] = 'j.budget_type = :bt';
            $params['bt'] = $q['budget_type'];
        }
        if (!empty($q['min_budget'])) {
            $where[] = 'j.budget_min >= :minb';
            $params['minb'] = $q['min_budget'];
        }
        if (!empty($q['max_budget'])) {
            $where[] = 'j.budget_max <= :maxb';
            $params['maxb'] = $q['max_budget'];
        }
        if (!empty($q['search'])) {
            $where[] = '(j.title ILIKE :search OR j.description ILIKE :search)';
            $params['search'] = "%{$q['search']}%";
        }
        if (!empty($q['skill'])) {
            $where[] = 'EXISTS (SELECT 1 FROM "job_skills" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = j.id AND s.slug = :skill)';
            $params['skill'] = $q['skill'];
        }
        if (!empty($q['region'])) {
            $where[] = "(j.location_type = 'worldwide' OR j.location_regions @> :region::jsonb)";
            $params['region'] = json_encode([$q['region']]);
        }
        if (!empty($q['country'])) {
            $where[] = "(j.location_type = 'worldwide' OR j.location_countries @> :country::jsonb)";
            $params['country'] = json_encode([$q['country']]);
        }

        $w = implode(' AND ', $where);

        $cntStmt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"job\" j WHERE {$w}");
        $cntStmt->execute($params);
        $total = (int) $cntStmt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT j.*, u.display_name AS client_name, c.name AS category_name
             FROM \"job\" j
             JOIN \"user\" u ON u.id = j.client_id
             LEFT JOIN \"category\" c ON c.id = j.category_id
             WHERE {$w}
             ORDER BY j.published_at DESC NULLS LAST
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

    #[Route('POST', '', name: 'jobs.create', summary: 'Create job', tags: ['Jobs'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (!$userId) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        // Validate input
        $validationError = $this->jobValidator->validateOrFail($data);
        if ($validationError) {
            return $validationError;
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Generate slug from title
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title']), '-'));
        $slug = substr($slug, 0, 200) . '-' . substr($id, 0, 8);

        $this->db->pdo()->prepare(
            'INSERT INTO "job" (id, client_id, title, slug, description, category_id, budget_type,
                                budget_min, budget_max, weekly_hours_limit, currency, estimated_duration,
                                experience_level, status, visibility, ai_scope,
                                location_type, location_regions, location_countries,
                                milestones_suggested,
                                created_at, updated_at)
             VALUES (:id, :client_id, :title, :slug, :desc, :cat, :bt, :bmin, :bmax, :whl, :cur,
                     :dur, :exp, \'draft\', :vis, :ai,
                     :loc_type, :loc_regions, :loc_countries,
                     :milestones,
                     :now, :now)'
        )->execute([
                    'id' => $id,
                    'client_id' => $userId,
                    'title' => $data['title'],
                    'slug' => $slug,
                    'desc' => $data['description'],
                    'cat' => $data['category_id'] ?? null,
                    'bt' => $data['budget_type'],
                    'bmin' => $data['budget_min'] ?? null,
                    'bmax' => $data['budget_max'] ?? null,
                    'whl' => ($data['budget_type'] === 'hourly' && isset($data['weekly_hours_limit'])) ? (int) $data['weekly_hours_limit'] : null,
                    'cur' => $data['currency'] ?? 'USD',
                    'dur' => $data['estimated_duration'] ?? $data['duration_weeks'] ?? null,
                    'exp' => $data['experience_level'] ?? 'intermediate',
                    'vis' => $data['visibility'] ?? 'public',
                    'ai' => '{}',
                    'loc_type' => $data['location_type'] ?? 'worldwide',
                    'loc_regions' => json_encode($data['location_regions'] ?? []),
                    'loc_countries' => json_encode($data['location_countries'] ?? []),
                    'milestones' => json_encode($data['milestones_suggested'] ?? []),
                    'now' => $now,
                ]);

        // Attach skills
        $skillIds = $data['skill_ids'] ?? $data['skills'] ?? [];
        if (!empty($skillIds)) {
            $insert = $this->db->pdo()->prepare(
                'INSERT INTO "job_skills" (job_id, skill_id) VALUES (:jid, :sid) ON CONFLICT DO NOTHING'
            );
            foreach ($skillIds as $skillId) {
                $insert->execute(['jid' => $id, 'sid' => $skillId]);
            }
        }

        // Dispatch event
        if ($userId) {
            $this->events?->dispatch(new JobCreated($id, $userId, $data['title']));
        }

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/me', name: 'jobs.mine', summary: 'My posted jobs', tags: ['Jobs'])]
    public function mine(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);

        $cntStmt = $this->db->pdo()->prepare('SELECT COUNT(*) FROM "job" WHERE client_id = :uid');
        $cntStmt->execute(['uid' => $userId]);
        $total = (int) $cntStmt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "job" WHERE client_id = :uid ORDER BY created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}', name: 'jobs.show', summary: 'Job detail', tags: ['Jobs'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT j.*, u.display_name AS client_name, c.name AS category_name
             FROM "job" j
             JOIN "user" u ON u.id = j.client_id
             LEFT JOIN "category" c ON c.id = j.category_id
             WHERE j.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }

        // Attach skills
        $skills = $this->db->pdo()->prepare(
            'SELECT s.id, s.name, s.slug FROM "job_skills" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = :jid'
        );
        $skills->execute(['jid' => $id]);
        $job['skills'] = $skills->fetchAll(\PDO::FETCH_ASSOC);

        // Attach attachments (polymorphic attachment table)
        $att = $this->db->pdo()->prepare(
            'SELECT id, file_name, file_url, file_size, mime_type
             FROM "attachment"
             WHERE entity_type = \'job\' AND entity_id = :jid
             ORDER BY sort_order ASC'
        );
        $att->execute(['jid' => $id]);
        $job['attachments'] = $att->fetchAll(\PDO::FETCH_ASSOC);

        // Increment views_count
        $this->db->pdo()->prepare(
            'UPDATE "job" SET views_count = views_count + 1 WHERE id = :id'
        )->execute(['id' => $id]);

        return $this->json(['data' => $job]);
    }

    #[Route('PATCH', '/{id}', name: 'jobs.update', summary: 'Update job', tags: ['Jobs'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        // Verify ownership
        $stmt = $this->db->pdo()->prepare('SELECT client_id, status FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden('Not your job');
        }

        $allowed = [
            'title',
            'description',
            'category_id',
            'budget_type',
            'budget_min',
            'budget_max',
            'weekly_hours_limit',
            'currency',
            'estimated_duration',
            'experience_level',
            'visibility',
            'location_type',
            'location_regions',
            'location_countries',
            'milestones_suggested'
        ];

        $jsonFields = ['location_regions', 'location_countries', 'milestones_suggested'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                if (in_array($field, $jsonFields, true)) {
                    $sets[] = "\"{$field}\" = :{$field}::jsonb";
                    $params[$field] = json_encode($data[$field]);
                } else {
                    $sets[] = "\"{$field}\" = :{$field}";
                    $params[$field] = $data[$field];
                }
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare('UPDATE "job" SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);

        return $this->json(['message' => 'Job updated']);
    }

    #[Route('POST', '/{id}/publish', name: 'jobs.publish', summary: 'Submit for moderation & publish', tags: ['Jobs'])]
    public function publish(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare('SELECT client_id, status, title, description, budget_type, budget_min, budget_max, experience_level, category_id FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden();
        }
        if (!in_array($job['status'], ['draft', 'revision_requested'], true)) {
            return $this->error('Job can only be published from draft or revision_requested status');
        }

        // Require at least one verified payment method to publish
        $pmCheck = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "paymentmethod"
             WHERE user_id = :uid AND is_active = true AND verified = true
               AND (stripe_payment_method_id IS NOT NULL OR type = \'paypal\')'
        );
        $pmCheck->execute(['uid' => $userId]);
        if ((int) $pmCheck->fetchColumn() === 0) {
            return $this->error(
                'A verified payment method is required to publish a job. Please add a card or verify your bank account.',
                400
            );
        }

        $pdo = $this->db->pdo();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Set status to pending_review while scoring
        $pdo->prepare(
            'UPDATE "job" SET status = \'pending_review\', moderation_status = \'pending\', updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        // ── Inline AI scoring (works in both dev and prod) ──
        $scorer = new VertexAiScorer();
        $aiScore = $scorer->scoreJob($job);
        $aiResult = [
            'confidence' => $aiScore['confidence'],
            'flags' => $aiScore['flags'],
            'quality_score' => $aiScore['quality'],
            'model' => $aiScore['model'],
        ];
        $confidence = number_format($aiScore['confidence'], 4);

        if ($aiScore['confidence'] >= 0.85) {
            $pdo->prepare(
                'UPDATE "job" SET status = \'open\', moderation_status = \'auto_approved\',
                        moderation_ai_result = :ai, moderation_ai_confidence = :conf,
                        moderation_ai_model_version = :model,
                        published_at = :now, updated_at = :now
                 WHERE id = :id'
            )->execute([
                        'ai' => json_encode($aiResult),
                        'conf' => $confidence,
                        'model' => $aiScore['model'],
                        'now' => $now,
                        'id' => $id,
                    ]);

            $this->events?->dispatch(new JobPublished($id, $userId));
            $this->publishToPubSub($id, $pdo);
            $this->notifyJobModeration($userId, $id, $job['title'], 'approved', $aiScore['confidence'], $pdo, $now);

            return $this->json(['message' => 'Job auto-approved and published', 'moderation_status' => 'auto_approved']);

        } elseif ($aiScore['confidence'] <= 0.3) {
            $pdo->prepare(
                'UPDATE "job" SET status = \'rejected\', moderation_status = \'auto_rejected\',
                        moderation_ai_result = :ai, moderation_ai_confidence = :conf,
                        moderation_ai_model_version = :model, updated_at = :now
                 WHERE id = :id'
            )->execute([
                        'ai' => json_encode($aiResult),
                        'conf' => $confidence,
                        'model' => $aiScore['model'],
                        'now' => $now,
                        'id' => $id,
                    ]);

            $this->notifyJobModeration($userId, $id, $job['title'], 'rejected', $aiScore['confidence'], $pdo, $now);
            return $this->json(['message' => 'Job did not pass content moderation', 'moderation_status' => 'auto_rejected', 'flags' => $aiScore['flags']]);

        } else {
            $pdo->prepare(
                'UPDATE "job" SET status = \'pending_review\', moderation_status = \'human_review\',
                        moderation_ai_result = :ai, moderation_ai_confidence = :conf,
                        moderation_ai_model_version = :model, updated_at = :now
                 WHERE id = :id'
            )->execute([
                        'ai' => json_encode($aiResult),
                        'conf' => $confidence,
                        'model' => $aiScore['model'],
                        'now' => $now,
                        'id' => $id,
                    ]);

            $this->notifyJobModeration($userId, $id, $job['title'], 'in_review', $aiScore['confidence'], $pdo, $now);
            return $this->json(['message' => 'Job submitted for admin review', 'moderation_status' => 'human_review']);
        }
    }

    /**
     * Extract Pub/Sub publish logic (reused from original publish)
     */
    private function publishToPubSub(string $id, \PDO $pdo): void
    {
        try {
            $pubsub = $this->pubsub ?? new PubSubPublisher();
            $jobStmt = $pdo->prepare(
                'SELECT title, description, category_id, budget_type, budget_min, budget_max,
                        experience_level FROM "job" WHERE id = :id'
            );
            $jobStmt->execute(['id' => $id]);
            $jobData = $jobStmt->fetch(\PDO::FETCH_ASSOC);

            $skillStmt = $pdo->prepare(
                'SELECT s.name FROM "job_skills" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = :jid'
            );
            $skillStmt->execute(['jid' => $id]);
            $skillNames = array_column($skillStmt->fetchAll(\PDO::FETCH_ASSOC), 'name');

            $pubsub->jobPublished($id, [
                'title' => $jobData['title'] ?? '',
                'description' => $jobData['description'] ?? '',
                'skills' => $skillNames,
                'budget_min' => isset($jobData['budget_min']) ? (float) $jobData['budget_min'] : null,
                'budget_max' => isset($jobData['budget_max']) ? (float) $jobData['budget_max'] : null,
                'category_id' => $jobData['category_id'] ?? null,
                'experience_level' => $jobData['experience_level'] ?? null,
            ]);
        } catch (\Throwable) {
            // Non-critical
        }
    }

    /* (Job moderation scoring is now handled by VertexAiScorer service) */

    /**
     * Notify client about moderation status.
     */
    private function notifyJobModeration(
        string $userId,
        string $jobId,
        string $title,
        string $status,
        float $confidence,
        \PDO $pdo,
        string $now
    ): void {
        $meta = match ($status) {
            'approved' => [
                'icon' => '✅',
                'title' => 'Job Approved',
                'body' => "Your job \"{$title}\" has been approved and is now live!",
                'priority' => 'success',
            ],
            'in_review' => [
                'icon' => '🔄',
                'title' => 'Job Under Review',
                'body' => "Your job \"{$title}\" has been submitted for admin review.",
                'priority' => 'info',
            ],
            'rejected' => [
                'icon' => '❌',
                'title' => 'Job Not Approved',
                'body' => "Your job \"{$title}\" did not pass content moderation. Please review and update.",
                'priority' => 'warning',
            ],
            'revision_requested' => [
                'icon' => '📝',
                'title' => 'Revision Requested',
                'body' => "An admin has requested changes to your job \"{$title}\".",
                'priority' => 'warning',
            ],
            default => null,
        };

        if (!$meta)
            return;

        $notifId = $this->uuid();
        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                        'id' => $notifId,
                        'uid' => $userId,
                        'type' => "job_moderation.{$status}",
                        'title' => "{$meta['icon']} {$meta['title']}",
                        'body' => $meta['body'],
                        'data' => json_encode([
                            'job_id' => $jobId,
                            'status' => $status,
                            'confidence' => $confidence,
                            'link' => "/dashboard/jobs/{$jobId}",
                        ]),
                        'prio' => $meta['priority'],
                        'chan' => 'in_app',
                        'now' => $now,
                    ]);
        } catch (\Throwable $e) {
            error_log("[JobController] notification insert: " . $e->getMessage());
        }

        // Real-time push via Redis → Socket.IO
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id' => $notifId,
                'type' => "job_moderation.{$status}",
                'title' => "{$meta['icon']} {$meta['title']}",
                'body' => $meta['body'],
                'data' => [
                    'job_id' => $jobId,
                    'status' => $status,
                    'confidence' => $confidence,
                    'link' => "/dashboard/jobs/{$jobId}",
                ],
                'priority' => $meta['priority'],
                'created_at' => $now,
            ]);
            $redis->close();
        } catch (\Throwable $e) {
            error_log("[JobController] socket emit: " . $e->getMessage());
        }
    }

    #[Route('POST', '/{id}/close', name: 'jobs.close', summary: 'Close job', tags: ['Jobs'])]
    public function close(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare('SELECT client_id FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "job" SET status = \'cancelled\', closed_at = :now, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Job closed']);
    }

    #[Route('DELETE', '/{id}', name: 'jobs.delete', summary: 'Delete draft', tags: ['Jobs'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare('SELECT client_id, status FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden();
        }
        if ($job['status'] !== 'draft') {
            return $this->error('Only drafts can be deleted');
        }

        $this->db->pdo()->prepare('DELETE FROM "job" WHERE id = :id')->execute(['id' => $id]);

        return $this->noContent();
    }

    #[Route('GET', '/{id}/proposals', name: 'jobs.proposals', summary: 'List proposals for job', tags: ['Jobs'])]
    public function proposals(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);

        // Verify ownership
        $stmt = $this->db->pdo()->prepare('SELECT client_id FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $cntStmt = $this->db->pdo()->prepare('SELECT COUNT(*) FROM "proposal" WHERE job_id = :jid');
        $cntStmt->execute(['jid' => $id]);
        $total = (int) $cntStmt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT p.*, u.display_name AS freelancer_name, u.avatar_url AS freelancer_avatar
             FROM "proposal" p JOIN "user" u ON u.id = p.freelancer_id
             WHERE p.job_id = :jid
             ORDER BY p.ai_match_score DESC NULLS LAST, p.created_at ASC
             LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('jid', $id);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}/matches', name: 'jobs.matches', summary: 'AI-ranked matches', tags: ['Jobs'])]
    public function matches(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        // Verify ownership
        $stmt = $this->db->pdo()->prepare('SELECT client_id FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }
        if ($job['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $matchUrl = getenv('AI_MATCH_URL') ?: 'http://ai-match-v1:8080/api/v1/match/rank';

        // Build candidate list from freelancer profiles
        $candidates = $this->db->pdo()->prepare(
            'SELECT fp.user_id AS freelancer_id, fp.hourly_rate, fp.experience_years,
                    fp.profile_completeness, fp.avg_rating, fp.total_jobs_completed,
                    (SELECT string_agg(s.name, \',\') FROM "freelancer_skills" fs
                     JOIN "skill" s ON s.id = fs.skill_id
                     WHERE fs.freelancer_id = fp.user_id) AS skill_names
             FROM "freelancerprofile" fp
             WHERE fp.availability_status = \'available\'
             ORDER BY fp.avg_rating DESC NULLS LAST
             LIMIT 50'
        );
        $candidates->execute();
        $rows = $candidates->fetchAll(\PDO::FETCH_ASSOC);

        // Fetch job skills
        $skillStmt = $this->db->pdo()->prepare(
            'SELECT s.name FROM "job_skills" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = :jid'
        );
        $skillStmt->execute(['jid' => $id]);
        $jobSkills = array_column($skillStmt->fetchAll(\PDO::FETCH_ASSOC), 'name');

        // Fetch job budget
        $jobDetail = $this->db->pdo()->prepare(
            'SELECT budget_min, budget_max, experience_level FROM "job" WHERE id = :id'
        );
        $jobDetail->execute(['id' => $id]);
        $jd = $jobDetail->fetch(\PDO::FETCH_ASSOC);

        // Format candidates for match service
        $candidatePayload = [];
        foreach ($rows as $r) {
            $candidatePayload[] = [
                'freelancer_id' => $r['freelancer_id'],
                'skills' => $r['skill_names'] ? explode(',', $r['skill_names']) : [],
                'hourly_rate' => $r['hourly_rate'] ? (float) $r['hourly_rate'] : null,
                'experience_years' => $r['experience_years'] ? (int) $r['experience_years'] : null,
                'profile_completeness' => $r['profile_completeness'] ? (float) $r['profile_completeness'] : null,
                'avg_rating' => $r['avg_rating'] ? (float) $r['avg_rating'] : null,
                'total_jobs_completed' => $r['total_jobs_completed'] ? (int) $r['total_jobs_completed'] : null,
            ];
        }

        $payload = [
            'job_id' => $id,
            'job_skills' => $jobSkills,
            'job_budget_min' => $jd['budget_min'] ? (float) $jd['budget_min'] : null,
            'job_budget_max' => $jd['budget_max'] ? (float) $jd['budget_max'] : null,
            'experience_level' => $jd['experience_level'] ?? null,
            'candidates' => $candidatePayload,
            'limit' => 20,
        ];

        $ch = curl_init($matchUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 5000,
            CURLOPT_CONNECTTIMEOUT_MS => 1000,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json(['data' => [], 'status' => 'ai_service_unavailable']);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }

    #[Route('POST', '/{id}/invite', name: 'jobs.invite', summary: 'Invite freelancer', tags: ['Jobs'])]
    public function invite(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['freelancer_id'])) {
            return $this->error('freelancer_id is required');
        }

        // Verify job ownership
        $stmt = $this->db->pdo()->prepare('SELECT client_id FROM "job" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job || $job['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $invId = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "invitations" (id, job_id, client_id, freelancer_id, message, status, created_at)
             VALUES (:id, :jid, :cid, :fid, :msg, \'pending\', :now)'
        )->execute([
                    'id' => $invId,
                    'jid' => $id,
                    'cid' => $userId,
                    'fid' => $data['freelancer_id'],
                    'msg' => $data['message'] ?? null,
                    'now' => $now,
                ]);

        return $this->created(['data' => ['id' => $invId]]);
    }

    /* ── Country → Region mapping (must match frontend REGIONS) ─── */
    private const COUNTRY_TO_REGION = [
        // North America
        'US' => 'north_america',
        'CA' => 'north_america',
        'MX' => 'north_america',
        // Europe
        'GB' => 'europe',
        'DE' => 'europe',
        'FR' => 'europe',
        'ES' => 'europe',
        'IT' => 'europe',
        'NL' => 'europe',
        'SE' => 'europe',
        'PL' => 'europe',
        'PT' => 'europe',
        'IE' => 'europe',
        'CH' => 'europe',
        'NO' => 'europe',
        'DK' => 'europe',
        'FI' => 'europe',
        'AT' => 'europe',
        'BE' => 'europe',
        'CZ' => 'europe',
        'RO' => 'europe',
        'HU' => 'europe',
        'GR' => 'europe',
        // Latin America
        'BR' => 'latin_america',
        'AR' => 'latin_america',
        'CL' => 'latin_america',
        'CO' => 'latin_america',
        'PE' => 'latin_america',
        'UY' => 'latin_america',
        'EC' => 'latin_america',
        'VE' => 'latin_america',
        'CR' => 'latin_america',
        'PA' => 'latin_america',
        // Asia Pacific
        'AU' => 'asia_pacific',
        'NZ' => 'asia_pacific',
        'JP' => 'asia_pacific',
        'KR' => 'asia_pacific',
        'SG' => 'asia_pacific',
        'IN' => 'asia_pacific',
        'PH' => 'asia_pacific',
        'TH' => 'asia_pacific',
        'MY' => 'asia_pacific',
        'ID' => 'asia_pacific',
        'VN' => 'asia_pacific',
        'TW' => 'asia_pacific',
        'HK' => 'asia_pacific',
        // Middle East & Africa
        'AE' => 'middle_east_africa',
        'SA' => 'middle_east_africa',
        'IL' => 'middle_east_africa',
        'ZA' => 'middle_east_africa',
        'NG' => 'middle_east_africa',
        'KE' => 'middle_east_africa',
        'EG' => 'middle_east_africa',
        'QA' => 'middle_east_africa',
        'KW' => 'middle_east_africa',
        'BH' => 'middle_east_africa',
    ];

    /** Recommended jobs for the current freelancer, scored & ranked */
    #[Route('GET', '/recommended', name: 'jobs.recommended', summary: 'Recommended jobs for freelancer', tags: ['Jobs'])]
    public function recommended(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        $pdo = $this->db->pdo();
        $p = $this->pagination($request, 20);

        // ── 1. Gather freelancer profile ────────────────────────
        $uStmt = $pdo->prepare('SELECT country, metadata FROM "user" WHERE id = :uid');
        $uStmt->execute(['uid' => $userId]);
        $user = $uStmt->fetch(\PDO::FETCH_ASSOC);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $meta = json_decode($user['metadata'] ?? '{}', true) ?: [];
        $hourlyRate = (float) ($meta['hourly_rate'] ?? 0);
        $primarySkill = $meta['primary_skill'] ?? '';
        $country = strtoupper(trim($user['country'] ?? ''));
        $region = self::COUNTRY_TO_REGION[$country] ?? '';

        // ── 2. Freelancer skill IDs ─────────────────────────────
        $fsStmt = $pdo->prepare('SELECT skill_id FROM freelancer_skills WHERE freelancer_id = :uid');
        $fsStmt->execute(['uid' => $userId]);
        $freelancerSkillIds = $fsStmt->fetchAll(\PDO::FETCH_COLUMN);

        // Fallback: match primary_skill name to skill table
        if (empty($freelancerSkillIds) && $primarySkill) {
            $psStmt = $pdo->prepare("SELECT id FROM skill WHERE LOWER(name) = LOWER(:ps) LIMIT 1");
            $psStmt->execute(['ps' => $primarySkill]);
            $psId = $psStmt->fetchColumn();
            if ($psId) {
                $freelancerSkillIds = [$psId];
            }
        }

        // ── 3. Build scored query ───────────────────────────────
        // We build score components in PHP and inject safe values via bind params.
        // Each component is 0-100, then weighted & summed.

        $sql = "
        WITH job_base AS (
            SELECT j.id, j.title, j.slug, j.status, j.budget_type, j.budget_min, j.budget_max,
                   j.currency, j.experience_level, j.location_type, j.location_regions, j.location_countries,
                   j.category_id, j.published_at, j.created_at,
                   u.display_name AS client_name,
                   c.name AS category_name,
                   (SELECT COUNT(*) FROM job_skills WHERE job_id = j.id) AS total_skills
            FROM \"job\" j
            JOIN \"user\" u ON u.id = j.client_id
            LEFT JOIN \"category\" c ON c.id = j.category_id
            WHERE j.status = 'open'
              AND j.client_id != :uid
              AND NOT EXISTS (SELECT 1 FROM proposal pr WHERE pr.job_id = j.id AND pr.freelancer_id = :uid2)
        ),
        skill_match AS (
            SELECT jb.id AS job_id,
                   COUNT(DISTINCT js.skill_id) FILTER (WHERE js.skill_id = ANY(:skill_ids::uuid[])) AS matched,
                   GREATEST(jb.total_skills, 1) AS total
            FROM job_base jb
            LEFT JOIN job_skills js ON js.job_id = jb.id
            GROUP BY jb.id, jb.total_skills
        )
        SELECT jb.*,
               sm.matched AS matched_skills,
               sm.total   AS total_job_skills,

               -- Skill score (0-100): matched/total * 100, weight 40%
               CASE WHEN sm.total > 0 THEN ROUND(sm.matched::numeric / sm.total * 100) ELSE 50 END AS skill_score,

               -- Rate score (0-100): how well freelancer rate fits budget, weight 25%
               CASE
                   WHEN :rate <= 0 THEN 50
                   WHEN jb.budget_type = 'fixed' THEN 50
                   WHEN :rate2 BETWEEN COALESCE(jb.budget_min, 0) AND COALESCE(jb.budget_max, 999999) THEN 100
                   WHEN :rate3 < COALESCE(jb.budget_min, 0) THEN GREATEST(0, 100 - (COALESCE(jb.budget_min, 0) - :rate4) * 2)
                   ELSE GREATEST(0, 100 - (:rate5 - COALESCE(jb.budget_max, 999999)) * 2)
               END AS rate_score,

               -- Location score (0-100), weight 20%
               CASE
                   WHEN jb.location_type = 'worldwide' THEN 100
                   WHEN jb.location_type = 'countries' AND :country != '' AND jb.location_countries @> (:country_json)::jsonb THEN 100
                   WHEN jb.location_type = 'regions' AND :region != '' AND jb.location_regions @> (:region_json)::jsonb THEN 100
                   WHEN jb.location_type = 'countries' AND :country2 = '' THEN 50
                   WHEN jb.location_type = 'regions' AND :region2 = '' THEN 50
                   ELSE 0
               END AS location_score,

               -- Experience score (0-100), weight 15%  (neutral if no data)
               50 AS experience_score

        FROM job_base jb
        JOIN skill_match sm ON sm.job_id = jb.id
        ORDER BY (
            CASE WHEN sm.total > 0 THEN ROUND(sm.matched::numeric / sm.total * 100) ELSE 50 END * 0.40 +
            CASE
                WHEN :rate6 <= 0 THEN 50
                WHEN jb.budget_type = 'fixed' THEN 50
                WHEN :rate7 BETWEEN COALESCE(jb.budget_min, 0) AND COALESCE(jb.budget_max, 999999) THEN 100
                WHEN :rate8 < COALESCE(jb.budget_min, 0) THEN GREATEST(0, 100 - (COALESCE(jb.budget_min, 0) - :rate9) * 2)
                ELSE GREATEST(0, 100 - (:rate10 - COALESCE(jb.budget_max, 999999)) * 2)
            END * 0.25 +
            CASE
                WHEN jb.location_type = 'worldwide' THEN 100
                WHEN jb.location_type = 'countries' AND :country3 != '' AND jb.location_countries @> (:country_json2)::jsonb THEN 100
                WHEN jb.location_type = 'regions' AND :region3 != '' AND jb.location_regions @> (:region_json2)::jsonb THEN 100
                WHEN jb.location_type = 'countries' AND :country4 = '' THEN 50
                WHEN jb.location_type = 'regions' AND :region4 = '' THEN 50
                ELSE 0
            END * 0.20 +
            50 * 0.15
        ) DESC,
        jb.published_at DESC NULLS LAST
        LIMIT :lim OFFSET :off
        ";

        $skillIdsParam = '{' . implode(',', $freelancerSkillIds) . '}';
        $countryJson = json_encode([$country]);
        $regionJson = json_encode([$region]);

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('uid2', $userId);
        $stmt->bindValue('skill_ids', $skillIdsParam);
        // Rate params (duplicated for SELECT + ORDER BY)
        foreach (['rate', 'rate2', 'rate3', 'rate4', 'rate5', 'rate6', 'rate7', 'rate8', 'rate9', 'rate10'] as $rp) {
            $stmt->bindValue($rp, $hourlyRate);
        }
        // Location params
        foreach (['country', 'country2', 'country3', 'country4'] as $cp) {
            $stmt->bindValue($cp, $country);
        }
        $stmt->bindValue('country_json', $countryJson);
        $stmt->bindValue('country_json2', $countryJson);
        foreach (['region', 'region2', 'region3', 'region4'] as $rg) {
            $stmt->bindValue($rg, $region);
        }
        $stmt->bindValue('region_json', $regionJson);
        $stmt->bindValue('region_json2', $regionJson);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (\Throwable $e) {
            error_log("[JobController::recommended] SQL error: " . $e->getMessage());
            return $this->error('Failed to fetch recommendations: ' . $e->getMessage(), 500);
        }

        $jobs = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // ── 4. Enrich with match_score + match_reasons ──────────
        foreach ($jobs as &$job) {
            $skillScore = (int) $job['skill_score'];
            $rateScore = (int) $job['rate_score'];
            $locationScore = (int) $job['location_score'];
            $expScore = (int) $job['experience_score'];

            $job['match_score'] = (int) round(
                $skillScore * 0.40 + $rateScore * 0.25 + $locationScore * 0.20 + $expScore * 0.15
            );

            $reasons = [];
            $matched = (int) ($job['matched_skills'] ?? 0);
            $total = (int) ($job['total_job_skills'] ?? 0);
            if ($matched > 0) {
                $reasons[] = "🎯 {$matched}/{$total} skills match";
            }
            if ($rateScore >= 80 && $hourlyRate > 0) {
                $reasons[] = '💰 Rate fits budget';
            }
            if ($locationScore >= 100) {
                $reasons[] = '🌍 Your region';
            }
            if ($total === 0 && !empty($freelancerSkillIds)) {
                $reasons[] = '📋 No skills specified';
            }
            $job['match_reasons'] = $reasons;

            // Fetch skills for this job
            $jsStmt = $pdo->prepare('SELECT s.name FROM job_skills js JOIN skill s ON s.id = js.skill_id WHERE js.job_id = :jid');
            $jsStmt->execute(['jid' => $job['id']]);
            $job['skills'] = $jsStmt->fetchAll(\PDO::FETCH_COLUMN);

            // Clean up internal scoring columns
            unset($job['skill_score'], $job['rate_score'], $job['location_score'], $job['experience_score']);
        }

        // ── 5. Count total (for pagination) ─────────────────────
        $cntSql = "
            SELECT COUNT(*)
            FROM \"job\" j
            WHERE j.status = 'open'
              AND j.client_id != :uid
              AND NOT EXISTS (SELECT 1 FROM proposal pr WHERE pr.job_id = j.id AND pr.freelancer_id = :uid2)
        ";
        $cntStmt = $pdo->prepare($cntSql);
        $cntStmt->execute(['uid' => $userId, 'uid2' => $userId]);
        $total = (int) $cntStmt->fetchColumn();

        return $this->json([
            'data' => $jobs,
            'meta' => [
                'current_page' => $p['page'],
                'per_page' => $p['perPage'],
                'total' => $total,
            ],
            'profile' => [
                'hourly_rate' => $hourlyRate,
                'primary_skill' => $primarySkill,
                'country' => $country,
                'region' => $region,
                'skill_count' => count($freelancerSkillIds),
            ],
        ]);
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