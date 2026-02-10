<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/payment-methods')]
#[Middleware('auth')]
final class PaymentMethodController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'pm.index', summary: 'List payment methods', tags: ['Payment Methods'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, type, provider, last_four, brand, expiry_month, expiry_year,
                    is_default, created_at
             FROM "paymentmethod" WHERE user_id = :uid AND deleted_at IS NULL
             ORDER BY is_default DESC, created_at DESC'
        );
        $stmt->execute(['uid' => $userId]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('POST', '', name: 'pm.create', summary: 'Add payment method', tags: ['Payment Methods'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "paymentmethod" (id, user_id, type, provider, provider_payment_method_id,
                                          last_four, brand, expiry_month, expiry_year,
                                          billing_address, is_default, is_verified, created_at)
             VALUES (:id, :uid, :type, :prov, :ppid, :last4, :brand, :em, :ey, :ba, :def, false, :now)'
        )->execute([
            'id'    => $id,
            'uid'   => $userId,
            'type'  => $data['type'] ?? 'card',
            'prov'  => $data['provider'] ?? 'stripe',
            'ppid'  => $data['provider_payment_method_id'] ?? null,
            'last4' => $data['last_four'] ?? null,
            'brand' => $data['brand'] ?? null,
            'em'    => $data['expiry_month'] ?? null,
            'ey'    => $data['expiry_year'] ?? null,
            'ba'    => json_encode($data['billing_address'] ?? []),
            'def'   => empty($data['is_default']) ? 'false' : 'true',
            'now'   => $now,
        ]);

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('DELETE', '/{id}', name: 'pm.delete', summary: 'Remove payment method', tags: ['Payment Methods'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "paymentmethod" SET deleted_at = :now WHERE id = :id AND user_id = :uid AND deleted_at IS NULL'
        );
        $stmt->execute([
            'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'id'  => $id,
            'uid' => $userId,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Payment method');
        }

        return $this->noContent();
    }

    #[Route('POST', '/{id}/default', name: 'pm.default', summary: 'Set default', tags: ['Payment Methods'])]
    public function setDefault(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $pdo    = $this->db->pdo();

        $pdo->beginTransaction();
        try {
            // Clear current default
            $pdo->prepare('UPDATE "paymentmethod" SET is_default = false WHERE user_id = :uid')
                ->execute(['uid' => $userId]);

            // Set new default
            $stmt = $pdo->prepare(
                'UPDATE "paymentmethod" SET is_default = true WHERE id = :id AND user_id = :uid AND deleted_at IS NULL'
            );
            $stmt->execute(['id' => $id, 'uid' => $userId]);

            if ($stmt->rowCount() === 0) {
                $pdo->rollBack();
                return $this->notFound('Payment method');
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error('Failed to set default', 500);
        }

        return $this->json(['message' => 'Default payment method updated']);
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
