<?php
declare(strict_types=1);

namespace App\Middleware;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use MonkeysLegion\Router\Middleware\MiddlewareInterface;

/**
 * FraudCheckMiddleware — async fraud scoring via AI microservice.
 *
 * Applied to: proposal creation, account activity.
 * Non-blocking: logs failures but does NOT block the request.
 * Attaches fraud_score + risk_tier to request attributes for downstream use.
 */
final class FraudCheckMiddleware implements MiddlewareInterface
{
    private string $aiServiceUrl;

    public function __construct(
        ?string $aiServiceUrl = null,
    ) {
        $this->aiServiceUrl = $aiServiceUrl
            ?? ($_ENV['AI_FRAUD_SERVICE_URL'] ?? 'http://ai-fraud-v1:8080');
    }

    public function process(ServerRequestInterface $request, callable $next): ResponseInterface
    {
        $user = $request->getAttribute('user');
        if (!$user) {
            return $next($request);
        }

        $userId = (string) ($request->getAttribute('user_id') ?? $user->id ?? '');

        try {
            $fraudResult = $this->checkFraud($userId, $request);

            $request = $request
                ->withAttribute('fraud_score', $fraudResult['fraud_score'] ?? null)
                ->withAttribute('risk_tier', $fraudResult['risk_tier'] ?? null)
                ->withAttribute('fraud_action', $fraudResult['recommended_action'] ?? null);

            // Block if high-risk
            $riskTier = $fraudResult['risk_tier'] ?? 'low';
            if ($riskTier === 'critical') {
                return new JsonResponse([
                    'error'   => 'Request blocked',
                    'message' => 'This action has been flagged for review.',
                ], 403);
            }
        } catch (\Throwable $e) {
            // Non-blocking: log the failure but continue
            error_log("[FraudCheckMiddleware] AI service error: {$e->getMessage()}");
        }

        return $next($request);
    }

    /**
     * Call the AI fraud microservice.
     *
     * @return array{fraud_score: float, risk_tier: string, recommended_action: string}
     */
    private function checkFraud(string $userId, ServerRequestInterface $request): array
    {
        $payload = json_encode([
            'account_id'  => $userId,
            'entity_type' => 'request',
            'entity_id'   => uniqid('req_', true),
            'ip_address'  => $request->getServerParams()['REMOTE_ADDR'] ?? '',
            'user_agent'  => $request->getHeaderLine('User-Agent'),
            'method'      => $request->getMethod(),
            'path'        => $request->getUri()->getPath(),
        ], JSON_THROW_ON_ERROR);

        $ch = curl_init("{$this->aiServiceUrl}/api/v1/ai/fraud/check");
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 2,          // 2-second hard timeout
            CURLOPT_CONNECTTIMEOUT => 1,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            throw new \RuntimeException("Fraud API error ({$httpCode}): {$error}");
        }

        return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
    }
}
