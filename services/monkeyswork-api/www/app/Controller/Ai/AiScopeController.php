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

        // Fetch job details to enrich the request
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, title, description, category_id, budget_type, budget_min, budget_max
             FROM "job" WHERE id = :id'
        );
        $stmt->execute(['id' => $data['job_id']]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }

        $scopeUrl = getenv('AI_SCOPE_URL') ?: 'http://ai-scope-assistant:8080/api/v1/scope/analyze';

        $payload = [
            'job_id'      => $job['id'],
            'title'       => $job['title'] ?? '',
            'description' => $job['description'] ?? '',
            'category'    => $job['category_id'] ?? '',
            'budget_type' => $job['budget_type'] ?? 'fixed',
            'budget_min'  => isset($job['budget_min']) ? (float) $job['budget_min'] : null,
            'budget_max'  => isset($job['budget_max']) ? (float) $job['budget_max'] : null,
            'skills_required' => $data['skills_required'] ?? [],
        ];

        $ch = curl_init($scopeUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS     => 5000,
            CURLOPT_CONNECTTIMEOUT_MS => 1000,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json(['data' => [
                'job_id'          => $job['id'],
                'milestones'      => [],
                'complexity_tier' => 'unknown',
                'status'          => 'ai_service_unavailable',
            ]]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
