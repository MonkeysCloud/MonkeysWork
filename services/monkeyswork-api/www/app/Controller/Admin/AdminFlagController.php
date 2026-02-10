<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/feature-flags')]
#[Middleware(['auth', 'role:admin'])]
final class AdminFlagController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'admin.flags', summary: 'All feature flags', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM "featureflag" ORDER BY key ASC'
        );

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('PATCH', '/{key}', name: 'admin.flags.update', summary: 'Update flag', tags: ['Admin'])]
    public function update(ServerRequestInterface $request, string $key): JsonResponse
    {
        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sets   = [];
        $params = ['key' => $key, 'now' => $now];

        if (isset($data['is_enabled'])) {
            $sets[]               = '"is_enabled" = :enabled';
            $params['enabled']    = $data['is_enabled'] ? 'true' : 'false';
        }
        if (isset($data['rollout_percentage'])) {
            $sets[]               = '"rollout_percentage" = :rollout';
            $params['rollout']    = $data['rollout_percentage'];
        }
        if (isset($data['description'])) {
            $sets[]               = '"description" = :desc';
            $params['desc']       = $data['description'];
        }
        if (isset($data['metadata'])) {
            $sets[]               = '"metadata" = :meta';
            $params['meta']       = json_encode($data['metadata']);
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "featureflag" SET ' . implode(', ', $sets) . ' WHERE key = :key'
        );
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Feature flag');
        }

        return $this->json(['message' => 'Flag updated']);
    }
}
