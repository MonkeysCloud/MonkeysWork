<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/companies')]
#[Middleware('auth')]
final class CompanyController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    // ── List companies for the authenticated user ──────────────────────

    #[Route('GET', '', name: 'companies.index', summary: 'List user companies', tags: ['Companies'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT c.* FROM company c
             WHERE c.owner_id = :uid
                OR c.id = (SELECT company_id FROM "user" WHERE id = :uid2)
             ORDER BY c.created_at DESC'
        );
        $stmt->execute(['uid' => $userId, 'uid2' => $userId]);
        $companies = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $companies]);
    }

    // ── Get single company ─────────────────────────────────────────────

    #[Route('GET', '/{id}', name: 'companies.show', summary: 'Get company', tags: ['Companies'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $company = $this->findCompany($id);

        if (!$company) {
            return $this->notFound('Company');
        }

        // Must be owner or member
        if ($company['owner_id'] !== $userId) {
            $memberCheck = $this->db->pdo()->prepare(
                'SELECT company_id FROM "user" WHERE id = :uid'
            );
            $memberCheck->execute(['uid' => $userId]);
            $row = $memberCheck->fetch(\PDO::FETCH_ASSOC);
            if (!$row || $row['company_id'] !== $id) {
                return $this->forbidden('You do not belong to this company');
            }
        }

        // Fetch members
        $membersStmt = $this->db->pdo()->prepare(
            'SELECT id, display_name, email, avatar_url, role
             FROM "user" WHERE company_id = :cid ORDER BY display_name'
        );
        $membersStmt->execute(['cid' => $id]);
        $company['members'] = $membersStmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $company]);
    }

    // ── Get the authenticated user's company (shortcut) ────────────────

    #[Route('GET', '/me', name: 'companies.me', summary: 'Get my company', tags: ['Companies'])]
    public function me(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        // Check if user is an owner
        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM company WHERE owner_id = :uid LIMIT 1'
        );
        $stmt->execute(['uid' => $userId]);
        $company = $stmt->fetch(\PDO::FETCH_ASSOC);

        // If not owner, check membership
        if (!$company) {
            $userStmt = $this->db->pdo()->prepare(
                'SELECT company_id FROM "user" WHERE id = :uid'
            );
            $userStmt->execute(['uid' => $userId]);
            $row = $userStmt->fetch(\PDO::FETCH_ASSOC);
            if ($row && $row['company_id']) {
                $company = $this->findCompany($row['company_id']);
            }
        }

        if (!$company) {
            return $this->json(['data' => null]);
        }

        // Fetch members
        $membersStmt = $this->db->pdo()->prepare(
            'SELECT id, display_name, email, avatar_url, role
             FROM "user" WHERE company_id = :cid ORDER BY display_name'
        );
        $membersStmt->execute(['cid' => $company['id']]);
        $company['members'] = $membersStmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $company]);
    }

    // ── Create a new company ───────────────────────────────────────────

    #[Route('POST', '', name: 'companies.create', summary: 'Create company', tags: ['Companies'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['name'])) {
            return $this->error('Company name is required');
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO company (id, owner_id, name, website, industry, size, description, logo_url, address, city, state, country, zip_code, tax_id, phone, email, metadata, created_at, updated_at)
             VALUES (:id, :owner_id, :name, :website, :industry, :size, :description, :logo_url, :address, :city, :state, :country, :zip_code, :tax_id, :phone, :email, :metadata, :now, :now2)'
        )->execute([
                    'id' => $id,
                    'owner_id' => $userId,
                    'name' => $data['name'],
                    'website' => $data['website'] ?? null,
                    'industry' => $data['industry'] ?? null,
                    'size' => $data['size'] ?? null,
                    'description' => $data['description'] ?? null,
                    'logo_url' => $data['logo_url'] ?? null,
                    'address' => $data['address'] ?? null,
                    'city' => $data['city'] ?? null,
                    'state' => $data['state'] ?? null,
                    'country' => $data['country'] ?? null,
                    'zip_code' => $data['zip_code'] ?? null,
                    'tax_id' => $data['tax_id'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'email' => $data['email'] ?? null,
                    'metadata' => json_encode($data['metadata'] ?? []),
                    'now' => $now,
                    'now2' => $now,
                ]);

        // Assign creator to the company
        $this->db->pdo()->prepare(
            'UPDATE "user" SET company_id = :cid, updated_at = :now WHERE id = :uid'
        )->execute(['cid' => $id, 'now' => $now, 'uid' => $userId]);

        return $this->created([
            'data' => ['id' => $id, 'name' => $data['name']],
            'message' => 'Company created',
        ]);
    }

    // ── Update company ─────────────────────────────────────────────────

    #[Route('PUT', '/{id}', name: 'companies.update', summary: 'Update company', tags: ['Companies'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $company = $this->findCompany($id);

        if (!$company) {
            return $this->notFound('Company');
        }

        if ($company['owner_id'] !== $userId) {
            return $this->forbidden('Only the owner can update the company');
        }

        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $fields = [
            'name',
            'website',
            'industry',
            'size',
            'description',
            'logo_url',
            'address',
            'city',
            'state',
            'country',
            'zip_code',
            'tax_id',
            'phone',
            'email'
        ];
        $sets = [];
        $params = ['id' => $id];

        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $sets[] = "\"{$f}\" = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        // Handle metadata merge
        if (array_key_exists('metadata', $data)) {
            $existing = json_decode($company['metadata'] ?? '{}', true) ?: [];
            $merged = array_merge($existing, $data['metadata']);
            $sets[] = '"metadata" = :metadata';
            $params['metadata'] = json_encode($merged);
        }

        if (!empty($sets)) {
            $sets[] = '"updated_at" = :now';
            $params['now'] = $now;
            $sql = 'UPDATE company SET ' . implode(', ', $sets) . ' WHERE id = :id';
            $this->db->pdo()->prepare($sql)->execute($params);
        }

        return $this->json(['message' => 'Company updated']);
    }

    // ── Delete company ─────────────────────────────────────────────────

    #[Route('DELETE', '/{id}', name: 'companies.delete', summary: 'Delete company', tags: ['Companies'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $company = $this->findCompany($id);

        if (!$company) {
            return $this->notFound('Company');
        }

        if ($company['owner_id'] !== $userId) {
            return $this->forbidden('Only the owner can delete the company');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Remove company association from all members
        $this->db->pdo()->prepare(
            'UPDATE "user" SET company_id = NULL, updated_at = :now WHERE company_id = :cid'
        )->execute(['now' => $now, 'cid' => $id]);

        // Delete company
        $this->db->pdo()->prepare('DELETE FROM company WHERE id = :id')->execute(['id' => $id]);

        return $this->noContent();
    }

    // ── Add member to company ──────────────────────────────────────────

    #[Route('POST', '/{id}/members', name: 'companies.addMember', summary: 'Add member', tags: ['Companies'])]
    public function addMember(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $company = $this->findCompany($id);

        if (!$company) {
            return $this->notFound('Company');
        }

        if ($company['owner_id'] !== $userId) {
            return $this->forbidden('Only the owner can add members');
        }

        $data = $this->body($request);
        $memberId = $data['user_id'] ?? null;

        if (!$memberId) {
            return $this->error('user_id is required');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "user" SET company_id = :cid, updated_at = :now WHERE id = :uid'
        )->execute(['cid' => $id, 'now' => $now, 'uid' => $memberId]);

        return $this->json(['message' => 'Member added']);
    }

    // ── Remove member from company ─────────────────────────────────────

    #[Route('DELETE', '/{id}/members/{memberId}', name: 'companies.removeMember', summary: 'Remove member', tags: ['Companies'])]
    public function removeMember(ServerRequestInterface $request, string $id, string $memberId): JsonResponse
    {
        $userId = $this->userId($request);
        $company = $this->findCompany($id);

        if (!$company) {
            return $this->notFound('Company');
        }

        if ($company['owner_id'] !== $userId) {
            return $this->forbidden('Only the owner can remove members');
        }

        if ($memberId === $company['owner_id']) {
            return $this->error('Cannot remove the company owner');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "user" SET company_id = NULL, updated_at = :now WHERE id = :uid AND company_id = :cid'
        )->execute(['now' => $now, 'uid' => $memberId, 'cid' => $id]);

        return $this->json(['message' => 'Member removed']);
    }

    // ── Internal helpers ───────────────────────────────────────────────

    private function findCompany(string $id): ?array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM company WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
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
