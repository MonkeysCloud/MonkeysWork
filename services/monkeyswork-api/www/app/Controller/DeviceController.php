<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/devices')]
#[Middleware('auth')]
final class DeviceController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    #[Route('POST', '/register', name: 'devices.register', summary: 'Register FCM device token', tags: ['Devices'])]
    public function register(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $token = $data['token'] ?? '';
        $platform = $data['platform'] ?? 'ios';

        if (empty($token)) {
            return $this->error('Device token is required');
        }

        $pdo = $this->db->pdo();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Upsert: if token already exists for this user, update timestamp
        $existing = $pdo->prepare(
            'SELECT id FROM "device_token" WHERE user_id = :uid AND token = :token'
        );
        $existing->execute(['uid' => $userId, 'token' => $token]);

        if ($existing->fetch()) {
            $pdo->prepare(
                'UPDATE "device_token" SET platform = :platform, updated_at = :now WHERE user_id = :uid AND token = :token'
            )->execute(['platform' => $platform, 'now' => $now, 'uid' => $userId, 'token' => $token]);
        } else {
            $id = $this->uuid();
            $pdo->prepare(
                'INSERT INTO "device_token" (id, user_id, token, platform, created_at, updated_at)
                 VALUES (:id, :uid, :token, :platform, :now, :now)'
            )->execute([
                        'id' => $id,
                        'uid' => $userId,
                        'token' => $token,
                        'platform' => $platform,
                        'now' => $now,
                    ]);
        }

        return $this->json(['message' => 'Device registered']);
    }

    #[Route('POST', '/unregister', name: 'devices.unregister', summary: 'Remove FCM device token', tags: ['Devices'])]
    public function unregister(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $token = $data['token'] ?? '';

        if (empty($token)) {
            return $this->error('Device token is required');
        }

        $this->db->pdo()->prepare(
            'DELETE FROM "device_token" WHERE user_id = :uid AND token = :token'
        )->execute(['uid' => $userId, 'token' => $token]);

        return $this->json(['message' => 'Device unregistered']);
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
