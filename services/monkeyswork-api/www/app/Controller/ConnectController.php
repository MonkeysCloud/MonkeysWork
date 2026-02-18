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

/**
 * Stripe Connect Custom onboarding — built-in (like Upwork/Uber).
 *
 * Flow:
 *  1. GET  /connect/status         → Current onboarding status
 *  2. POST /connect/create-account → Create Custom account
 *  3. POST /connect/update-identity→ Submit personal info (name, DOB, address, SSN)
 *  4. POST /connect/add-bank       → Add external bank account
 */
#[RoutePrefix('/api/v1/connect')]
#[Middleware('auth')]
final class ConnectController
{
    use ApiController;

    private ?StripeService $stripe = null;

    public function __construct(private ConnectionInterface $db) {}

    private function stripe(): StripeService
    {
        return $this->stripe ??= new StripeService();
    }

    /* ─── Status ─── */

    #[Route('GET', '/status', name: 'connect.status', summary: 'Stripe Connect status', tags: ['Connect'])]
    public function status(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();

            $stmt = $pdo->prepare(
                'SELECT stripe_connect_account_id, stripe_connect_onboarded FROM "user" WHERE id = :uid'
            );
            $stmt->execute(['uid' => $userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->notFound('User');
            }

            $accountId  = $user['stripe_connect_account_id'] ?? null;
            $onboarded  = (bool) ($user['stripe_connect_onboarded'] ?? false);
            $requirements = [];

            // If account exists, check with Stripe what's still needed
            if ($accountId) {
                try {
                    $acct = $this->stripe()->retrieveAccount($accountId);

                    // Check if fully onboarded
                    if ($acct->charges_enabled && $acct->payouts_enabled) {
                        if (!$onboarded) {
                            $pdo->prepare('UPDATE "user" SET stripe_connect_onboarded = true WHERE id = :uid')
                                ->execute(['uid' => $userId]);
                            $onboarded = true;
                        }
                    }

                    $requirements = [
                        'currently_due'   => $acct->requirements->currently_due ?? [],
                        'past_due'        => $acct->requirements->past_due ?? [],
                        'pending'         => $acct->requirements->pending_verification ?? [],
                        'disabled_reason' => $acct->requirements->disabled_reason ?? null,
                    ];
                } catch (\Throwable $e) {
                    error_log('[ConnectController] Error checking account: ' . $e->getMessage());
                }
            }

            $status = 'not_started';
            if ($accountId && $onboarded)      $status = 'complete';
            elseif ($accountId)                 $status = 'pending';

            return $this->json(['data' => [
                'status'       => $status,
                'account_id'   => $accountId,
                'onboarded'    => $onboarded,
                'requirements' => $requirements,
            ]]);
        } catch (\Throwable $ex) {
            error_log('[ConnectController] status ERROR: ' . $ex->getMessage());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    /* ─── Step 1: Create Custom account ─── */

    #[Route('POST', '/create-account', name: 'connect.createAccount', summary: 'Create Custom Connect account', tags: ['Connect'])]
    public function createAccount(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();

            $stmt = $pdo->prepare(
                'SELECT email, display_name, country, stripe_connect_account_id FROM "user" WHERE id = :uid'
            );
            $stmt->execute(['uid' => $userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$user) return $this->notFound('User');

            // Already created
            if (!empty($user['stripe_connect_account_id'])) {
                return $this->json(['data' => [
                    'account_id' => $user['stripe_connect_account_id'],
                    'message'    => 'Account already exists',
                ]]);
            }

            $ip   = $request->getServerParams()['REMOTE_ADDR'] ?? '127.0.0.1';
            $acct = $this->stripe()->createConnectAccount(
                $user['email'],
                $user['display_name'] ?? 'Freelancer',
                $user['country'] ?? 'US',
                $ip
            );

            $pdo->prepare('UPDATE "user" SET stripe_connect_account_id = :acid WHERE id = :uid')
                ->execute(['acid' => $acct->id, 'uid' => $userId]);

            return $this->json(['data' => [
                'account_id' => $acct->id,
                'message'    => 'Account created',
            ]]);
        } catch (\Throwable $ex) {
            error_log('[ConnectController] createAccount ERROR: ' . $ex->getMessage());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    /* ─── Step 2: Update identity (personal info) ─── */

    #[Route('POST', '/update-identity', name: 'connect.updateIdentity', summary: 'Submit identity info', tags: ['Connect'])]
    public function updateIdentity(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();
            $data   = $this->body($request);

            $stmt = $pdo->prepare('SELECT stripe_connect_account_id FROM "user" WHERE id = :uid');
            $stmt->execute(['uid' => $userId]);
            $accountId = $stmt->fetchColumn();

            if (!$accountId) {
                return $this->error('No Connect account. Create one first.', 400);
            }

            // Build individual data
            $individual = [];
            if (!empty($data['first_name']))  $individual['first_name']  = $data['first_name'];
            if (!empty($data['last_name']))   $individual['last_name']   = $data['last_name'];
            if (!empty($data['dob_day']))      $individual['dob'] = [
                'day'   => (int) $data['dob_day'],
                'month' => (int) ($data['dob_month'] ?? 1),
                'year'  => (int) ($data['dob_year'] ?? 1990),
            ];
            if (!empty($data['ssn_last_4']))   $individual['ssn_last_4'] = $data['ssn_last_4'];
            if (!empty($data['address_line1'])) {
                $individual['address'] = [
                    'line1'       => $data['address_line1'],
                    'city'        => $data['address_city'] ?? '',
                    'state'       => $data['address_state'] ?? '',
                    'postal_code' => $data['address_postal_code'] ?? '',
                    'country'     => $data['address_country'] ?? 'US',
                ];
            }
            if (!empty($data['phone'])) $individual['phone'] = $data['phone'];
            if (!empty($data['email'])) $individual['email'] = $data['email'];

            $acct = $this->stripe()->updateAccount($accountId, $individual);

            return $this->json(['data' => [
                'message'      => 'Identity updated',
                'requirements' => $acct->requirements->currently_due ?? [],
            ]]);
        } catch (\Throwable $ex) {
            error_log('[ConnectController] updateIdentity ERROR: ' . $ex->getMessage());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    /* ─── Step 3: Add bank account ─── */

    #[Route('POST', '/add-bank', name: 'connect.addBank', summary: 'Add bank account', tags: ['Connect'])]
    public function addBank(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo    = $this->db->pdo();
            $data   = $this->body($request);

            $stmt = $pdo->prepare('SELECT stripe_connect_account_id FROM "user" WHERE id = :uid');
            $stmt->execute(['uid' => $userId]);
            $accountId = $stmt->fetchColumn();

            if (!$accountId) {
                return $this->error('No Connect account. Create one first.', 400);
            }

            if (empty($data['routing_number']) || empty($data['account_number'])) {
                return $this->error('Routing number and account number are required', 422);
            }

            $bank = $this->stripe()->createExternalBankAccount(
                $accountId,
                $data['routing_number'],
                $data['account_number'],
                $data['account_holder_name'] ?? 'Freelancer',
                $data['country'] ?? 'US',
                $data['currency'] ?? 'usd'
            );

            // Check if now fully onboarded
            $acct = $this->stripe()->retrieveAccount($accountId);
            if ($acct->charges_enabled && $acct->payouts_enabled) {
                $pdo->prepare('UPDATE "user" SET stripe_connect_onboarded = true WHERE id = :uid')
                    ->execute(['uid' => $userId]);
            }

            return $this->json(['data' => [
                'bank_last4'    => $bank->last4,
                'bank_name'     => $bank->bank_name ?? 'Bank',
                'message'       => 'Bank account added',
                'fully_onboarded' => $acct->charges_enabled && $acct->payouts_enabled,
            ]]);
        } catch (\Throwable $ex) {
            error_log('[ConnectController] addBank ERROR: ' . $ex->getMessage());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }
}
