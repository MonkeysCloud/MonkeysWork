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

#[RoutePrefix('/api/v1/ai/job')]
#[Middleware('auth')]
final class AiJobAssistantController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    #[Route('POST', '/enhance', name: 'ai.job.enhance', summary: 'AI-enhance a job posting', tags: ['AI'])]
    public function enhance(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['title']) && empty($data['description'])) {
            return $this->error('title or description is required');
        }

        $enhanceUrl = getenv('AI_JOB_ENHANCE_URL') ?: 'http://ai-scope-assistant:8080/api/v1/job/enhance';

        $payload = [
            'title' => $data['title'] ?? '',
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? '',
            'skills' => $data['skills'] ?? [],
            'budget_min' => isset($data['budget_min']) ? (float) $data['budget_min'] : null,
            'budget_max' => isset($data['budget_max']) ? (float) $data['budget_max'] : null,
        ];

        $ch = curl_init($enhanceUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 15000,
            CURLOPT_CONNECTTIMEOUT_MS => 2000,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json([
                'data' => [
                    'improved_title' => $data['title'] ?? '',
                    'improved_description' => $data['description'] ?? '',
                    'suggested_skills' => [],
                    'suggested_milestones' => [],
                    'tips' => ['AI service is temporarily unavailable. Try again in a moment.'],
                    'status' => 'ai_service_unavailable',
                ]
            ]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
