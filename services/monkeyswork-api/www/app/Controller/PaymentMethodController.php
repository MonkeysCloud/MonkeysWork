<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\StripeService;
use App\Service\EmailNotificationService;
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
    private EmailNotificationService $emailNotifier;

    public function __construct(private ConnectionInterface $db)
    {
        $this->stripe = new StripeService();
        $this->emailNotifier = new EmailNotificationService($db);
    }

    /* ─── List saved payment methods ─── */

    #[Route('GET', '', name: 'pm.index', summary: 'List payment methods', tags: ['Payment Methods'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);

            $stmt = $this->db->pdo()->prepare(
                'SELECT id, type, provider, last_four, expiry, is_default, is_active,
                        stripe_payment_method_id, metadata, verified, setup_intent_id, created_at
                 FROM "paymentmethod" WHERE user_id = :uid AND is_active = true
                 ORDER BY is_default DESC, created_at DESC'
            );
            $stmt->execute(['uid' => $userId]);

            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            foreach ($rows as &$row) {
                $row['metadata'] = $row['metadata'] ? json_decode($row['metadata'], true) : null;
                $row['verified'] = (bool) ($row['verified'] ?? true);
            }

            return $this->json(['data' => $rows]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] index ERROR: ' . $e->getMessage());
            return $this->error('Failed to load payment methods: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Create Stripe SetupIntent (for card or bank account) ─── */

    #[Route('POST', '/setup-intent', name: 'pm.setup', summary: 'Create SetupIntent', tags: ['Payment Methods'])]
    public function setupIntent(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo = $this->db->pdo();
            $body = $this->body($request);

            error_log('[PaymentMethodController] setupIntent: userId=' . $userId);

            // Get user info for Stripe customer
            $userStmt = $pdo->prepare('SELECT email, first_name, last_name, stripe_customer_id FROM "user" WHERE id = :uid');
            $userStmt->execute(['uid' => $userId]);
            $user = $userStmt->fetch(\PDO::FETCH_ASSOC);

            error_log('[PaymentMethodController] setupIntent: user=' . json_encode($user));

            if (!$user) {
                return $this->error('User not found', 404);
            }

            error_log('[PaymentMethodController] setupIntent: calling getOrCreateCustomer...');

            $customerId = $this->stripe->getOrCreateCustomer(
                $userId,
                $user['email'],
                trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')),
                $pdo
            );

            error_log('[PaymentMethodController] setupIntent: customerId=' . $customerId);

            $pmTypes = ['card'];
            if (($body['type'] ?? '') === 'us_bank_account') {
                $pmTypes = ['us_bank_account'];
            }

            error_log('[PaymentMethodController] setupIntent: creating SetupIntent with types=' . json_encode($pmTypes));

            $si = $this->stripe->createSetupIntent($customerId, $pmTypes);

            error_log('[PaymentMethodController] setupIntent: SUCCESS client_secret=' . substr($si->client_secret, 0, 20) . '...');

            return $this->json([
                'data' => [
                    'client_secret' => $si->client_secret,
                    'customer_id' => $customerId,
                ],
            ]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] setupIntent ERROR: ' . $e->getMessage());
            error_log('[PaymentMethodController] setupIntent TRACE: ' . $e->getTraceAsString());
            return $this->error('Failed to create setup intent: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Save payment method (card, bank account, or PayPal) ─── */

    #[Route('POST', '', name: 'pm.create', summary: 'Add payment method', tags: ['Payment Methods'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $data = $this->body($request);
            $pdo = $this->db->pdo();
            $type = $data['type'] ?? 'card';

            $id = $this->uuid();
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            // Auto-set as default if first payment method
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

            // ── PayPal: just save email, no Stripe involved ──
            if ($type === 'paypal') {
                $paypalEmail = $data['paypal_email'] ?? null;
                if (empty($paypalEmail)) {
                    return $this->error('paypal_email is required for PayPal');
                }

                $pdo->prepare(
                    'INSERT INTO "paymentmethod" (id, user_id, type, provider, last_four,
                                                  token, stripe_payment_method_id, metadata,
                                                  is_default, is_active, expiry,
                                                  created_at, updated_at)
                     VALUES (:id, :uid, :type, :prov, :last4, :tok, :spm, :meta, :def, true, null, :now, :now)'
                )->execute([
                            'id' => $id,
                            'uid' => $userId,
                            'type' => 'paypal',
                            'prov' => 'paypal',
                            'last4' => substr($paypalEmail, 0, 4),
                            'tok' => null,
                            'spm' => null,
                            'meta' => json_encode(['paypal_email' => $paypalEmail]),
                            'def' => $setDefault ? 'true' : 'false',
                            'now' => $now,
                        ]);

                return $this->created([
                    'data' => [
                        'id' => $id,
                        'type' => 'paypal',
                        'provider' => 'paypal',
                        'last_four' => substr($paypalEmail, 0, 4),
                        'is_default' => $setDefault,
                    ]
                ]);
            }

            // ── Bank Transfer (ACH via Stripe Connect): save record without Stripe PM ID ──
            if ($type === 'bank_transfer') {
                $last4 = substr($data['account_number'] ?? $data['last_four'] ?? '••••', -4);
                $bankName = $data['bank_name'] ?? 'Bank';
                $holder = $data['account_holder'] ?? '';

                $pdo->prepare(
                    'INSERT INTO "paymentmethod" (id, user_id, type, provider, last_four,
                                                  token, stripe_payment_method_id, metadata,
                                                  is_default, is_active, expiry,
                                                  created_at, updated_at)
                     VALUES (:id, :uid, :type, :prov, :last4, :tok, :spm, :meta, :def, true, null, :now, :now)'
                )->execute([
                            'id' => $id,
                            'uid' => $userId,
                            'type' => 'bank_transfer',
                            'prov' => $bankName,
                            'last4' => $last4,
                            'tok' => null,
                            'spm' => null,
                            'meta' => json_encode([
                                'bank_name' => $bankName,
                                'account_holder' => $holder,
                                'routing_number' => substr($data['routing_number'] ?? '', -4),
                                'method' => 'stripe_connect',
                            ]),
                            'def' => $setDefault ? 'true' : 'false',
                            'now' => $now,
                        ]);

                return $this->created([
                    'data' => [
                        'id' => $id,
                        'type' => 'bank_transfer',
                        'provider' => $bankName,
                        'last_four' => $last4,
                        'is_default' => $setDefault,
                    ]
                ]);
            }

            // ── Stripe card or bank account ──
            $stripePmId = $data['payment_method_id'] ?? null;
            if (empty($stripePmId)) {
                return $this->error('payment_method_id is required');
            }

            $pm = $this->stripe->retrievePaymentMethod($stripePmId);

            // Determine type-specific fields
            if ($type === 'us_bank_account' || ($pm->type ?? '') === 'us_bank_account') {
                $bank = $pm->us_bank_account ?? null;
                $pmType = 'us_bank_account';
                $provider = $bank->bank_name ?? 'Bank';
                $last4 = $bank->last4 ?? '••••';
                $expiry = null;
                $meta = json_encode([
                    'bank_name' => $bank->bank_name ?? null,
                    'account_type' => $bank->account_type ?? null,
                    'routing_number' => $bank->routing_number ?? null,
                ]);
            } else {
                $pmType = $pm->type ?? 'card';
                $provider = $pm->card->brand ?? 'unknown';
                $last4 = $pm->card->last4 ?? '••••';
                $expiry = $pm->card ? sprintf('%02d/%04d', $pm->card->exp_month, $pm->card->exp_year) : null;
                $meta = json_encode([
                    'funding' => $pm->card->funding ?? null,
                    'exp_month' => $pm->card->exp_month ?? null,
                    'exp_year' => $pm->card->exp_year ?? null,
                ]);
            }

            // Bank accounts require microdeposit verification
            // Cards require a $1.00 charge + immediate refund to verify the card is real
            if ($pmType === 'us_bank_account') {
                $verified = false;
            } else {
                // ── $1.00 verification charge + immediate refund for cards ──
                $verified = false;
                try {
                    // Get or create Stripe customer
                    $userStmt = $pdo->prepare(
                        'SELECT email, first_name, last_name, stripe_customer_id FROM "user" WHERE id = :uid'
                    );
                    $userStmt->execute(['uid' => $userId]);
                    $userRow = $userStmt->fetch(\PDO::FETCH_ASSOC);

                    $customerId = $this->stripe->getOrCreateCustomer(
                        $userId,
                        $userRow['email'],
                        trim(($userRow['first_name'] ?? '') . ' ' . ($userRow['last_name'] ?? '')),
                        $pdo
                    );

                    // Ensure PM is attached to customer
                    if (!$pm->customer) {
                        $this->stripe->attachPaymentMethod($stripePmId, $customerId);
                    }

                    // Charge $1.00 (100 cents)
                    $verifyPi = $this->stripe->getClient()->paymentIntents->create([
                        'amount' => 100,
                        'currency' => 'usd',
                        'customer' => $customerId,
                        'payment_method' => $stripePmId,
                        'payment_method_types' => [$pmType],
                        'off_session' => true,
                        'confirm' => true,
                        'description' => 'MonkeysWorks — Card verification ($1.00 will be refunded)',
                        'metadata' => [
                            'mw_type' => 'card_verification',
                            'mw_user_id' => $userId,
                        ],
                    ]);

                    // Immediately refund the $1.00
                    if ($verifyPi->status === 'succeeded') {
                        $this->stripe->getClient()->refunds->create([
                            'payment_intent' => $verifyPi->id,
                            'reason' => 'requested_by_customer',
                            'metadata' => [
                                'mw_type' => 'card_verification_refund',
                            ],
                        ]);
                        $verified = true;
                        error_log("[PaymentMethodController] Card verification SUCCESS for user {$userId}, PI: {$verifyPi->id}");
                    } else {
                        error_log("[PaymentMethodController] Card verification charge status: {$verifyPi->status} for user {$userId}");
                    }
                } catch (\Throwable $verifyErr) {
                    // Card declined / invalid — save it but mark as unverified
                    error_log("[PaymentMethodController] Card verification FAILED for user {$userId}: " . $verifyErr->getMessage());
                    $verified = false;
                }
            }

            // Get setup_intent_id from the SetupIntent confirmation if available
            $setupIntentId = $data['setup_intent_id'] ?? null;

            $pdo->prepare(
                'INSERT INTO "paymentmethod" (id, user_id, type, provider, last_four,
                                              token, stripe_payment_method_id, metadata,
                                              is_default, is_active, expiry, verified, setup_intent_id,
                                              created_at, updated_at)
                 VALUES (:id, :uid, :type, :prov, :last4, :tok, :spm, :meta, :def, true, :exp, :ver, :si, :now, :now)'
            )->execute([
                        'id' => $id,
                        'uid' => $userId,
                        'type' => $pmType,
                        'prov' => $provider,
                        'last4' => $last4,
                        'tok' => null,
                        'spm' => $stripePmId,
                        'meta' => $meta,
                        'def' => $setDefault ? 'true' : 'false',
                        'exp' => $expiry,
                        'ver' => $verified ? 'true' : 'false',
                        'si' => $setupIntentId,
                        'now' => $now,
                    ]);

            // Send email notification
            try {
                $this->emailNotifier->notify(
                    $userId,
                    'payment_emails',
                    'Payment Method Added',
                    'payment-method-added',
                    [
                        'methodType' => $pmType === 'us_bank_account' ? 'Bank Account' : ucfirst($pmType),
                        'provider' => $provider,
                        'lastFour' => $last4,
                        'verified' => $verified,
                    ],
                    ['payment-methods']
                );
            } catch (\Throwable) { /* email failure should not block */
            }

            return $this->created([
                'data' => [
                    'id' => $id,
                    'type' => $pmType,
                    'provider' => $provider,
                    'last_four' => $last4,
                    'is_default' => $setDefault,
                    'verified' => $verified,
                ]
            ]);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] create ERROR: ' . $e->getMessage());
            return $this->error('Failed to add payment method: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Verify bank account with microdeposits ─── */

    #[Route('POST', '/{id}/verify', name: 'pm.verify', summary: 'Verify bank account', tags: ['Payment Methods'])]
    public function verify(ServerRequestInterface $request, string $id): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo = $this->db->pdo();
            $body = $this->body($request);

            $stmt = $pdo->prepare(
                'SELECT stripe_payment_method_id, setup_intent_id, type FROM "paymentmethod"
                 WHERE id = :id AND user_id = :uid AND is_active = true'
            );
            $stmt->execute(['id' => $id, 'uid' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$row) {
                return $this->notFound('Payment method');
            }

            if ($row['type'] !== 'us_bank_account') {
                return $this->error('Only bank accounts require verification', 400);
            }

            $amounts = $body['amounts'] ?? [];
            if (count($amounts) !== 2) {
                return $this->error('Two microdeposit amounts are required (in cents)', 400);
            }

            // Find or create setup intent for this PM
            $siId = $row['setup_intent_id'];

            if (!$siId) {
                // Get customer ID
                $userStmt = $pdo->prepare('SELECT stripe_customer_id FROM "user" WHERE id = :uid');
                $userStmt->execute(['uid' => $userId]);
                $customerId = $userStmt->fetchColumn();

                if (!$customerId) {
                    return $this->error('No Stripe customer found', 400);
                }

                // Attach PM to customer first (required by Stripe before confirm)
                $stripePmId = $row['stripe_payment_method_id'];
                try {
                    $pmObj = $this->stripe->retrievePaymentMethod($stripePmId);
                    if (!$pmObj->customer) {
                        $this->stripe->attachPaymentMethod($stripePmId, $customerId);
                    }
                } catch (\Throwable $attachErr) {
                    error_log('[PaymentMethodController] attach for verify: ' . $attachErr->getMessage());
                    return $this->error('Failed to prepare payment method: ' . $attachErr->getMessage(), 400);
                }

                // Create a SetupIntent for verification
                $si = $this->stripe->getClient()->setupIntents->create([
                    'customer' => $customerId,
                    'payment_method' => $stripePmId,
                    'payment_method_types' => ['us_bank_account'],
                    'confirm' => true,
                    'payment_method_options' => [
                        'us_bank_account' => ['verification_method' => 'microdeposits'],
                    ],
                ]);
                $siId = $si->id;

                // Save setup_intent_id
                $pdo->prepare('UPDATE "paymentmethod" SET setup_intent_id = :si WHERE id = :id')
                    ->execute(['si' => $siId, 'id' => $id]);
            }

            // Verify microdeposits
            try {
                $this->stripe->getClient()->setupIntents->verifyMicrodeposits($siId, [
                    'amounts' => array_map('intval', $amounts),
                ]);
            } catch (\Throwable $e) {
                error_log('[PaymentMethodController] verify ERROR: ' . $e->getMessage());
                return $this->error('Verification failed: Incorrect amounts. Please check your bank statement and try again.', 400);
            }

            // Mark as verified
            $pdo->prepare('UPDATE "paymentmethod" SET verified = true, updated_at = :now WHERE id = :id')
                ->execute(['now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'), 'id' => $id]);

            return $this->json(['message' => 'Bank account verified successfully']);
        } catch (\Throwable $e) {
            error_log('[PaymentMethodController] verify ERROR: ' . $e->getMessage());
            return $this->error('Verification failed: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Delete (detach from Stripe + soft-delete + auto-default) ─── */

    #[Route('DELETE', '/{id}', name: 'pm.delete', summary: 'Remove payment method', tags: ['Payment Methods'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo = $this->db->pdo();

            // Get the PM details
            $stmt = $pdo->prepare(
                'SELECT stripe_payment_method_id, is_default, type, provider, last_four
                 FROM "paymentmethod" WHERE id = :id AND user_id = :uid AND is_active = true'
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

            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            // Soft-delete in DB
            $pdo->prepare(
                'UPDATE "paymentmethod" SET is_active = false, updated_at = :now WHERE id = :id AND user_id = :uid'
            )->execute(['now' => $now, 'id' => $id, 'uid' => $userId]);

            // Auto-promote next PM as default if the deleted one was default
            if ($row['is_default']) {
                $nextStmt = $pdo->prepare(
                    'SELECT id FROM "paymentmethod" WHERE user_id = :uid AND is_active = true
                     ORDER BY created_at DESC LIMIT 1'
                );
                $nextStmt->execute(['uid' => $userId]);
                $nextId = $nextStmt->fetchColumn();

                if ($nextId) {
                    $pdo->prepare('UPDATE "paymentmethod" SET is_default = true, updated_at = :now WHERE id = :id')
                        ->execute(['now' => $now, 'id' => $nextId]);
                }
            }

            // Send email notification
            try {
                $this->emailNotifier->notify(
                    $userId,
                    'payment_emails',
                    'Payment Method Removed',
                    'payment-method-removed',
                    [
                        'methodType' => $row['type'] === 'us_bank_account' ? 'Bank Account' : ucfirst($row['type']),
                        'provider' => $row['provider'],
                        'lastFour' => $row['last_four'],
                    ],
                    ['payment-methods']
                );
            } catch (\Throwable) { /* email failure should not block */
            }

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
        $pdo = $this->db->pdo();

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE "paymentmethod" SET is_default = false WHERE user_id = :uid')
                ->execute(['uid' => $userId]);

            $stmt = $pdo->prepare(
                'UPDATE "paymentmethod" SET is_default = true, updated_at = :now
                 WHERE id = :id AND user_id = :uid AND is_active = true'
            );
            $stmt->execute([
                'id' => $id,
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
