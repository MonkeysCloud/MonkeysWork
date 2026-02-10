<?php
declare(strict_types=1);

namespace App\Controller\Ai;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/ai/scope')]
#[Middleware('auth')]
final class AiScopeController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('POST', '/analyze', name: 'ai.scope', summary: 'Scope a job', tags: ['AI'])]
    public function analyze(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['job_id'])) {
            return $this->error('job_id is required');
        }

        // Fetch job details
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, title, description, category_id, budget_type, budget_min, budget_max
             FROM "job" WHERE id = :id'
        );
        $stmt->execute(['id' => $data['job_id']]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }

        // TODO: call AI scope assistant microservice
        // POST to ai-scope-assistant with job data
        $result = [
            'job_id'          => $job['id'],
            'milestones'      => [],
            'total_hours'     => 0,
            'confidence'      => 0.0,
            'complexity_tier' => 'medium',
            'model_version'   => 'pending',
            'status'          => 'ai_service_pending',
        ];

        return $this->json(['data' => $result]);
    }
}
