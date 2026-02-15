<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/clients')]
#[Middleware('auth')]
final class ClientController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '/{id}', name: 'clients.show', summary: 'Client profile', tags: ['Clients'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT cp.*, u.display_name, u.avatar_url, u.country, u.created_at AS member_since
             FROM "clientprofile" cp
             JOIN "user" u ON u.id = cp.user_id
             WHERE cp.user_id = :id'
        );
        $stmt->execute(['id' => $id]);
        $profile = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$profile) {
            return $this->notFound('Client');
        }

        return $this->json(['data' => $profile]);
    }

    #[Route('PUT', '/me', name: 'clients.update', summary: 'Update own profile', tags: ['Clients'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // --- Update user-level fields ---
        $userFields = ['first_name', 'last_name', 'phone', 'country', 'state', 'display_name', 'avatar_url', 'languages'];
        $userSets   = [];
        $userParams = ['id' => $userId];

        foreach ($userFields as $field) {
            if (array_key_exists($field, $data)) {
                $userSets[]         = "\"{$field}\" = :{$field}";
                $userParams[$field] = $field === 'languages' ? json_encode($data[$field]) : $data[$field];
            }
        }

        if (!empty($userSets)) {
            $userSets[]        = '"updated_at" = :now';
            $userParams['now'] = $now;
            $sql = 'UPDATE "user" SET ' . implode(', ', $userSets) . ' WHERE id = :id';
            $this->db->pdo()->prepare($sql)->execute($userParams);
        }

        // --- Update profile fields ---
        $profileFields = ['company_name', 'company_website', 'company_size', 'industry',
                          'company_description', 'company_logo_url'];
        $sets   = [];
        $params = ['id' => $userId];

        foreach ($profileFields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[]         = "\"{$field}\" = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (!empty($sets)) {
            $sets[]        = '"updated_at" = :now';
            $params['now'] = $now;
            $sql = 'UPDATE "clientprofile" SET ' . implode(', ', $sets) . ' WHERE user_id = :id';
            $this->db->pdo()->prepare($sql)->execute($params);
        }

        // --- Mark profile as completed ---
        $this->db->pdo()->prepare(
            'UPDATE "user" SET profile_completed = TRUE, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $userId]);

        return $this->json(['message' => 'Profile updated', 'profile_completed' => true]);
    }

    #[Route('GET', '/me/stats', name: 'clients.stats', summary: 'Spending/stats', tags: ['Clients'])]
    public function stats(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT total_jobs_posted, total_spent, avg_rating_given, total_hires, payment_verified
             FROM "clientprofile" WHERE user_id = :id'
        );
        $stmt->execute(['id' => $userId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$stats) {
            return $this->notFound('Client profile');
        }

        return $this->json(['data' => $stats]);
    }
}
