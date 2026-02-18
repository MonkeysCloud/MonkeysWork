<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Wraps Stripe SDK – reads STRIPE_SECRET_KEY from env.
 */
final class StripeService
{
    private ?\Stripe\StripeClient $stripe = null;

    private function client(): \Stripe\StripeClient
    {
        if ($this->stripe === null) {
            $key = $_ENV['STRIPE_SECRET_KEY']
                ?? getenv('STRIPE_SECRET_KEY')
                ?: throw new \RuntimeException('STRIPE_SECRET_KEY not configured');
            $this->stripe = new \Stripe\StripeClient($key);
        }
        return $this->stripe;
    }

    /* ─── Customers ─── */

    public function getOrCreateCustomer(string $userId, string $email, string $name, \PDO $pdo): string
    {
        // Check if user already has a stripe customer id
        $stmt = $pdo->prepare('SELECT stripe_customer_id FROM "user" WHERE id = :uid');
        $stmt->execute(['uid' => $userId]);
        $existing = $stmt->fetchColumn();

        if ($existing) {
            return $existing;
        }

        $customer = $this->client()->customers->create([
            'email'    => $email,
            'name'     => $name,
            'metadata' => ['mw_user_id' => $userId],
        ]);

        $pdo->prepare('UPDATE "user" SET stripe_customer_id = :cid WHERE id = :uid')
            ->execute(['cid' => $customer->id, 'uid' => $userId]);

        return $customer->id;
    }

    /* ─── Setup Intents (for saving cards) ─── */

    public function createSetupIntent(string $customerId): \Stripe\SetupIntent
    {
        return $this->client()->setupIntents->create([
            'customer'               => $customerId,
            'payment_method_types'   => ['card'],
            'usage'                  => 'off_session',
        ]);
    }

    /* ─── Payment Methods ─── */

    public function attachPaymentMethod(string $paymentMethodId, string $customerId): \Stripe\PaymentMethod
    {
        return $this->client()->paymentMethods->attach($paymentMethodId, [
            'customer' => $customerId,
        ]);
    }

    public function detachPaymentMethod(string $paymentMethodId): \Stripe\PaymentMethod
    {
        return $this->client()->paymentMethods->detach($paymentMethodId);
    }

    public function retrievePaymentMethod(string $paymentMethodId): \Stripe\PaymentMethod
    {
        return $this->client()->paymentMethods->retrieve($paymentMethodId);
    }

    /* ─── Payment Intents (charges) ─── */

    /**
     * @param int    $amountCents  Amount in cents
     * @param string $currency     e.g. "usd"
     * @param string $customerId   Stripe customer ID
     * @param string $paymentMethodId Stripe payment method ID
     * @param array  $metadata     Optional metadata
     */
    public function createPaymentIntent(
        int    $amountCents,
        string $currency,
        string $customerId,
        string $paymentMethodId,
        array  $metadata = [],
    ): \Stripe\PaymentIntent {
        return $this->client()->paymentIntents->create([
            'amount'               => $amountCents,
            'currency'             => strtolower($currency),
            'customer'             => $customerId,
            'payment_method'       => $paymentMethodId,
            'off_session'          => true,
            'confirm'              => true,
            'metadata'             => $metadata,
        ]);
    }

    /* ─── Stripe Connect (Custom – own onboarding) ─── */

    /**
     * Create a Stripe Connect Custom account for a freelancer.
     */
    public function createConnectAccount(string $email, string $name, string $country = 'US', string $ip = ''): \Stripe\Account
    {
        $firstName = explode(' ', $name)[0];
        $lastName  = explode(' ', $name, 2)[1] ?? '';

        return $this->client()->accounts->create([
            'type'         => 'custom',
            'email'        => $email,
            'country'      => strtoupper($country),
            'capabilities' => [
                'transfers' => ['requested' => true],
            ],
            'business_type'  => 'individual',
            'individual'     => [
                'first_name' => $firstName,
                'last_name'  => $lastName,
            ],
            'tos_acceptance' => [
                'date' => time(),
                'ip'   => $ip ?: '127.0.0.1',
            ],
            'metadata' => ['platform' => 'monkeyswork'],
        ]);
    }

    /**
     * Update a Custom Connect account with personal info (identity verification).
     */
    public function updateAccount(string $accountId, array $individual): \Stripe\Account
    {
        return $this->client()->accounts->update($accountId, [
            'individual' => $individual,
        ]);
    }

    /**
     * Add an external bank account to a Custom Connect account.
     */
    public function createExternalBankAccount(
        string $accountId,
        string $routingNumber,
        string $accountNumber,
        string $accountHolderName,
        string $country = 'US',
        string $currency = 'usd',
    ): \Stripe\BankAccount {
        return $this->client()->accounts->createExternalAccount($accountId, [
            'external_account' => [
                'object'              => 'bank_account',
                'country'             => strtoupper($country),
                'currency'            => strtolower($currency),
                'routing_number'      => $routingNumber,
                'account_number'      => $accountNumber,
                'account_holder_name' => $accountHolderName,
                'account_holder_type' => 'individual',
            ],
        ]);
    }

    /**
     * Retrieve a Connect account to check onboarding status.
     */
    public function retrieveAccount(string $accountId): \Stripe\Account
    {
        return $this->client()->accounts->retrieve($accountId);
    }

    /**
     * Create a Transfer to a connected account (freelancer payout).
     */
    public function createTransfer(
        int    $amountCents,
        string $currency,
        string $connectedAccountId,
        array  $metadata = [],
    ): \Stripe\Transfer {
        return $this->client()->transfers->create([
            'amount'      => $amountCents,
            'currency'    => strtolower($currency),
            'destination' => $connectedAccountId,
            'metadata'    => $metadata,
        ]);
    }

    /* ─── Refunds ─── */

    public function createRefund(string $paymentIntentId, ?int $amountCents = null): \Stripe\Refund
    {
        $params = ['payment_intent' => $paymentIntentId];
        if ($amountCents !== null) {
            $params['amount'] = $amountCents;
        }
        return $this->client()->refunds->create($params);
    }

    /* ─── Webhook signature verification ─── */

    public function verifyWebhookSignature(string $payload, string $sigHeader): \Stripe\Event
    {
        $secret = $_ENV['STRIPE_WEBHOOK_SECRET']
            ?? getenv('STRIPE_WEBHOOK_SECRET')
            ?: '';

        if (empty($secret)) {
            // In dev without webhook secret, parse event directly
            return \Stripe\Event::constructFrom(json_decode($payload, true));
        }

        return \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
    }

    public function getClient(): \Stripe\StripeClient
    {
        return $this->client();
    }
}
