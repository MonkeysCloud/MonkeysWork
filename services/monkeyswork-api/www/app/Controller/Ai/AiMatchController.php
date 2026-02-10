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

        $limit = (int) ($data['limit'] ?? 20);

        // TODO: call AI match engine microservice
        $result = [
            'job_id'        => $data['job_id'],
            'results'       => [],
            'model_version' => 'pending',
            'ab_group'      => 'control',
            'status'        => 'ai_service_pending',
        ];

        return $this->json(['data' => $result]);
    }
}
