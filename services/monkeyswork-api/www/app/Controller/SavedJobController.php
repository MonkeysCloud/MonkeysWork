<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/saved-jobs')]
#[Middleware('auth')]
final class SavedJobController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
    ) {}

    /** List all saved jobs for the current user */
    #[Route('GET', '', name: 'saved-jobs.index', summary: 'List saved jobs', tags: ['SavedJobs'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->pdo()->prepare(
                'SELECT sj.job_id, sj.created_at,
                        j.title, j.slug, j.status, j.budget_type, j.budget_min, j.budget_max,
                        j.currency, j.experience_level, j.created_at AS job_created_at,
                        j.published_at, j.location_type, j.location_regions, j.location_countries,
                        c.name AS category_name, u.display_name AS client_name
                 FROM saved_job sj
                 JOIN job j ON j.id = sj.job_id
                 LEFT JOIN category c ON c.id = j.category_id
                 LEFT JOIN "user" u ON u.id = j.client_id
                 WHERE sj.user_id = :uid
                 ORDER BY sj.created_at DESC'
            );
            $stmt->execute(['uid' => $userId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return $this->json(['data' => $rows]);
        } catch (\Throwable $e) {
            error_log("[SavedJobController::index] " . $e->getMessage());
            return $this->error($e->getMessage(), 500);
        }
    }

    /** Check if a job is saved by the current user */
    #[Route('GET', '/{jobId}', name: 'saved-jobs.check', summary: 'Check if job is saved', tags: ['SavedJobs'])]
    public function check(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $jobId  = $request->getAttribute('jobId');

        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->pdo()->prepare(
                'SELECT 1 FROM saved_job WHERE user_id = :uid AND job_id = :jid'
            );
            $stmt->execute(['uid' => $userId, 'jid' => $jobId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $this->json(['data' => ['saved' => $row !== false]]);
        } catch (\Throwable $e) {
            error_log("[SavedJobController::check] " . $e->getMessage());
            return $this->error($e->getMessage(), 500);
        }
    }

    /** Save a job */
    #[Route('POST', '/{jobId}', name: 'saved-jobs.save', summary: 'Save a job', tags: ['SavedJobs'])]
    public function save(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $jobId  = $request->getAttribute('jobId');

        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        try {
            // Check job exists
            $stmt = $this->db->pdo()->prepare('SELECT id FROM "job" WHERE id = :id');
            $stmt->execute(['id' => $jobId]);
            if (!$stmt->fetch()) {
                return $this->notFound('Job');
            }

            // Upsert (ignore conflict)
            $ins = $this->db->pdo()->prepare(
                'INSERT INTO saved_job (user_id, job_id) VALUES (:uid, :jid) ON CONFLICT (user_id, job_id) DO NOTHING'
            );
            $ins->execute(['uid' => $userId, 'jid' => $jobId]);

            return $this->json(['data' => ['saved' => true, 'message' => 'Job saved']]);
        } catch (\Throwable $e) {
            error_log("[SavedJobController::save] " . $e->getMessage());
            return $this->error($e->getMessage(), 500);
        }
    }

    /** Unsave a job */
    #[Route('DELETE', '/{jobId}', name: 'saved-jobs.unsave', summary: 'Unsave a job', tags: ['SavedJobs'])]
    public function unsave(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $jobId  = $request->getAttribute('jobId');

        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->pdo()->prepare(
                'DELETE FROM saved_job WHERE user_id = :uid AND job_id = :jid'
            );
            $stmt->execute(['uid' => $userId, 'jid' => $jobId]);
            return $this->json(['data' => ['saved' => false, 'message' => 'Job unsaved']]);
        } catch (\Throwable $e) {
            error_log("[SavedJobController::unsave] " . $e->getMessage());
            return $this->error($e->getMessage(), 500);
        }
    }
}
