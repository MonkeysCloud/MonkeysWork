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

        $fraudUrl = getenv('AI_FRAUD_URL') ?: 'http://ai-fraud-v1:8080/api/v1/fraud/check';

        $ch = curl_init($fraudUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($data),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS     => 2000,
            CURLOPT_CONNECTTIMEOUT_MS => 500,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json(['data' => [
                'account_id'    => $data['account_id'],
                'fraud_score'   => 0.0,
                'risk_tier'     => 'unknown',
                'recommended_action' => 'allow',
                'status'        => 'ai_service_unavailable',
            ]]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
