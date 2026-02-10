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

#[RoutePrefix('/api/v1/ai/fraud')]
#[Middleware('auth')]
final class AiFraudController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('POST', '/check', name: 'ai.fraud', summary: 'Score account for fraud', tags: ['AI'])]
    public function check(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['account_id'])) {
            return $this->error('account_id is required');
        }

        // TODO: call AI fraud detection microservice
        $result = [
            'account_id'         => $data['account_id'],
            'entity_type'        => $data['entity_type'] ?? 'user',
            'entity_id'          => $data['entity_id'] ?? $data['account_id'],
            'fraud_score'        => 0.0,
            'risk_tier'          => 'low',
            'recommended_action' => 'allow',
            'risk_factors'       => [],
            'model_version'      => 'pending',
            'status'             => 'ai_service_pending',
        ];

        return $this->json(['data' => $result]);
    }
}
