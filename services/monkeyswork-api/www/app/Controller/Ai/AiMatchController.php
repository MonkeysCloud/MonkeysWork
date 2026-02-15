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

#[RoutePrefix('/api/v1/ai/match')]
#[Middleware('auth')]
final class AiMatchController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('POST', '/rank', name: 'ai.match', summary: 'Rank freelancers for job', tags: ['AI'])]
    public function rank(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['job_id'])) {
            return $this->error('job_id is required');
        }

        $matchUrl = getenv('AI_MATCH_URL') ?: 'http://ai-match-v1:8080/api/v1/match/rank';

        $ch = curl_init($matchUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($data),
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
                'job_id'   => $data['job_id'],
                'results'  => [],
                'status'   => 'ai_service_unavailable',
            ]]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
