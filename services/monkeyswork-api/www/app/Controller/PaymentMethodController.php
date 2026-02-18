<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\StripeService;
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

    private StripeService $stripe;

    public function __construct(private ConnectionInterface $db)
    {
        $this->stripe = new StripeService();
    }

    /* ─── List saved payment methods ─── */

    #[Route('GET', '', name: 'pm.index', summary: 'List payment methods', tags: ['Payment Methods'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);

            $stmt = $this->db->pdo()->prepare(
                'SELECT id, type, provider, last_four, expiry, is_default, is_active,
                        stripe_payment_method_id, metadata, created_at
                 FROM "paymentmethod" WHERE user_id = :uid AND is_active = true
                 ORDER BY is_default DESC, created_at DESC'
            );
            $stmt->execute(['uid' => $userId]);

            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            foreach ($rows as &$row) {
                $row['metadata'] = $row['metadata'] ? json_decode($row['metadata'], true) : null;
            }

            return $this->json(['data' => $rows]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] index ERROR: ' . $e->getMessage());
            return $this->error('Failed to load payment methods: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Create Stripe SetupIntent (for secure card collection) ─── */

    #[Route('POST', '/setup-intent', name: 'pm.setup', summary: 'Create SetupIntent', tags: ['Payment Methods'])]
    public function setupIntent(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();

            // Get user info for Stripe customer
            $userStmt = $pdo->prepare('SELECT email, first_name, last_name, stripe_customer_id FROM "user" WHERE id = :uid');
            $userStmt->execute(['uid' => $userId]);
            $user = $userStmt->fetch(\PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->error('User not found', 404);
            }

            $customerId = $this->stripe->getOrCreateCustomer(
                $userId,
                $user['email'],
                trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')),
                $pdo
            );

            $si = $this->stripe->createSetupIntent($customerId);

            return $this->json([
                'data' => [
                    'client_secret' => $si->client_secret,
                    'customer_id'   => $customerId,
                ],
            ]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] setupIntent ERROR: ' . $e->getMessage());
            return $this->error('Failed to create setup intent: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Save card after successful SetupIntent confirmation ─── */

    #[Route('POST', '', name: 'pm.create', summary: 'Add payment method', tags: ['Payment Methods'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $data   = $this->body($request);
            $pdo    = $this->db->pdo();

            $stripePmId = $data['payment_method_id'] ?? null;
            if (empty($stripePmId)) {
                return $this->error('payment_method_id is required');
            }

            // Retrieve PM details from Stripe
            $pm = $this->stripe->retrievePaymentMethod($stripePmId);

            $id  = $this->uuid();
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            // If setting as default, clear other defaults first
            if (!empty($data['is_default'])) {
                $pdo->prepare(
                    'UPDATE "paymentmethod" SET is_default = false WHERE user_id = :uid'
                )->execute(['uid' => $userId]);
            }

            // Check if this is the user's first card — auto-set as default
            $countStmt = $pdo->prepare(
                'SELECT COUNT(*) FROM "paymentmethod" WHERE user_id = :uid AND is_active = true'
            );
            $countStmt->execute(['uid' => $userId]);
            $isFirst = (int) $countStmt->fetchColumn() === 0;
            $setDefault = $isFirst || !empty($data['is_default']);

            if ($setDefault && !$isFirst) {
                $pdo->prepare('UPDATE "paymentmethod" SET is_default = false WHERE user_id = :uid')
                    ->execute(['uid' => $userId]);
            }

            $pdo->prepare(
                'INSERT INTO "paymentmethod" (id, user_id, type, provider, last_four,
                                              token, stripe_payment_method_id, metadata,
                                              is_default, is_active, expiry,
                                              created_at, updated_at)
                 VALUES (:id, :uid, :type, :prov, :last4, :tok, :spm, :meta, :def, true, :exp, :now, :now)'
            )->execute([
                'id'    => $id,
                'uid'   => $userId,
                'type'  => $pm->type ?? 'card',
                'prov'  => $pm->card->brand ?? 'unknown',
                'last4' => $pm->card->last4 ?? '••••',
                'tok'   => null,
                'spm'   => $stripePmId,
                'meta'  => json_encode([
                    'funding'   => $pm->card->funding ?? null,
                    'exp_month' => $pm->card->exp_month ?? null,
                    'exp_year'  => $pm->card->exp_year ?? null,
                ]),
                'def'   => $setDefault ? 'true' : 'false',
                'exp'   => $pm->card ? sprintf('%02d/%04d', $pm->card->exp_month, $pm->card->exp_year) : null,
                'now'   => $now,
            ]);

            return $this->created(['data' => [
                'id'        => $id,
                'type'      => $pm->type ?? 'card',
                'brand'     => $pm->card->brand ?? 'unknown',
                'last_four' => $pm->card->last4 ?? '••••',
                'is_default' => $setDefault,
            ]]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] create ERROR: ' . $e->getMessage());
            return $this->error('Failed to add payment method: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Delete (detach from Stripe + soft-delete) ─── */

    #[Route('DELETE', '/{id}', name: 'pm.delete', summary: 'Remove payment method', tags: ['Payment Methods'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();

            // Get the Stripe PM id
            $stmt = $pdo->prepare(
                'SELECT stripe_payment_method_id FROM "paymentmethod" WHERE id = :id AND user_id = :uid AND is_active = true'
            );
            $stmt->execute(['id' => $id, 'uid' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$row) {
                return $this->notFound('Payment method');
            }

            // Detach from Stripe
            if (!empty($row['stripe_payment_method_id'])) {
                try {
                    $this->stripe->detachPaymentMethod($row['stripe_payment_method_id']);
                } catch (\Throwable $e) {
                    error_log('[PaymentMethodController] Stripe detach warning: ' . $e->getMessage());
                }
            }

            // Soft-delete in DB
            $pdo->prepare(
                'UPDATE "paymentmethod" SET is_active = false, updated_at = :now WHERE id = :id AND user_id = :uid'
            )->execute([
                'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                'id'  => $id,
                'uid' => $userId,
            ]);

            return $this->noContent();
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] delete ERROR: ' . $e->getMessage());
            return $this->error('Failed to remove payment method: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Set default ─── */

    #[Route('POST', '/{id}/default', name: 'pm.default', summary: 'Set default', tags: ['Payment Methods'])]
    public function setDefault(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $pdo    = $this->db->pdo();

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE "paymentmethod" SET is_default = false WHERE user_id = :uid')
                ->execute(['uid' => $userId]);

            $stmt = $pdo->prepare(
                'UPDATE "paymentmethod" SET is_default = true, updated_at = :now
                 WHERE id = :id AND user_id = :uid AND is_active = true'
            );
            $stmt->execute([
                'id'  => $id,
                'uid' => $userId,
                'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ]);

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
