<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/users')]
#[Middleware('auth')]
final class UserController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    /* ------------------------------------------------------------------ */
    /*  GET /users/me                                                      */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/me', name: 'users.me', summary: 'Current user profile', tags: ['Users'])]
    public function me(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, email, role, status, display_name, first_name, last_name,
                    avatar_url, phone, country, timezone, locale,
                    email_verified_at, two_factor_enabled, last_login_at,
                    metadata, created_at, updated_at
             FROM "user" WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->notFound('User');
        }

        return $this->json(['data' => $user]);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /users/me                                                    */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/me', name: 'users.update', summary: 'Update profile', tags: ['Users'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $allowed = ['display_name', 'first_name', 'last_name', 'avatar_url',
                     'phone', 'country', 'timezone', 'locale', 'metadata'];

        $sets   = [];
        $params = ['id' => $userId];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $value = $field === 'metadata' ? json_encode($data[$field]) : $data[$field];
                $sets[]         = "\"{$field}\" = :{$field}";
                $params[$field] = $value;
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[]           = '"updated_at" = :updated_at';
        $params['updated_at'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sql = 'UPDATE "user" SET ' . implode(', ', $sets) . ' WHERE id = :id AND deleted_at IS NULL';
        $this->db->pdo()->prepare($sql)->execute($params);

        return $this->json(['message' => 'Profile updated']);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /users/me/password                                           */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/me/password', name: 'users.password', summary: 'Change password', tags: ['Users'])]
    public function changePassword(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['current_password']) || empty($data['new_password'])) {
            return $this->error('Current and new password are required');
        }

        $stmt = $this->db->pdo()->prepare('SELECT password_hash FROM "user" WHERE id = :id');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user || !password_verify($data['current_password'], $user['password_hash'])) {
            return $this->error('Current password is incorrect', 401);
        }

        $this->db->pdo()->prepare(
            'UPDATE "user" SET password_hash = :hash, token_version = token_version + 1,
                               updated_at = :now WHERE id = :id'
        )->execute([
            'hash' => password_hash($data['new_password'], PASSWORD_BCRYPT),
            'now'  => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'id'   => $userId,
        ]);

        return $this->json(['message' => 'Password changed']);
    }

    /* ------------------------------------------------------------------ */
    /*  DELETE /users/me                                                   */
    /* ------------------------------------------------------------------ */
    #[Route('DELETE', '/me', name: 'users.delete', summary: 'Soft delete account', tags: ['Users'])]
    public function deactivate(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $this->db->pdo()->prepare(
            'UPDATE "user" SET status = :status, deleted_at = :now, updated_at = :now WHERE id = :id'
        )->execute([
            'status' => 'deactivated',
            'now'    => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'id'     => $userId,
        ]);

        return $this->json(['message' => 'Account deactivated']);
    }

    /* ------------------------------------------------------------------ */
    /*  GET /users/{id}                                                    */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{id}', name: 'users.show', summary: 'Public profile', tags: ['Users'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, display_name, first_name, last_name, avatar_url, country,
                    role, created_at
             FROM "user" WHERE id = :id AND deleted_at IS NULL AND status = \'active\''
        );
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->notFound('User');
        }

        return $this->json(['data' => $user]);
    }

    /* ------------------------------------------------------------------ */
    /*  GET /users/me/sessions                                             */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/me/sessions', name: 'users.sessions', summary: 'Active sessions', tags: ['Users'])]
    public function sessions(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, ip_address, user_agent, created_at, expires_at
             FROM "usersession" WHERE user_id = :uid AND revoked_at IS NULL
             ORDER BY created_at DESC'
        );
        $stmt->execute(['uid' => $userId]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    /* ------------------------------------------------------------------ */
    /*  DELETE /users/me/sessions/{id}                                     */
    /* ------------------------------------------------------------------ */
    #[Route('DELETE', '/me/sessions/{id}', name: 'users.sessions.revoke', summary: 'Revoke session', tags: ['Users'])]
    public function revokeSession(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "usersession" SET revoked_at = :now
             WHERE id = :id AND user_id = :uid AND revoked_at IS NULL'
        );
        $stmt->execute([
            'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'id'  => $id,
            'uid' => $userId,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Session');
        }

        return $this->json(['message' => 'Session revoked']);
    }
}
