<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\UserRegistered;
use App\Service\MonkeysMailService;
use App\Service\PubSubPublisher;
use App\Validator\RegistrationValidator;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/auth')]
final class AuthController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private RegistrationValidator $registrationValidator = new RegistrationValidator(),
        private ?EventDispatcherInterface $events = null,
        private ?PubSubPublisher $pubsub = null,
        private ?MonkeysMailService $mail = null,
    ) {
        $this->mail ??= new MonkeysMailService();
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/register                                                */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/register', name: 'auth.register', summary: 'Create account', tags: ['Auth'])]
    public function register(ServerRequestInterface $request): JsonResponse
    {
        try {
            error_log('[Auth][register] ── START ──');
            $data = $this->body($request);
            error_log('[Auth][register] body parsed: ' . json_encode(array_diff_key($data, ['password' => 1])));

            // Validate input
            $validationError = $this->registrationValidator->validateOrFail($data);
            if ($validationError) {
                error_log('[Auth][register] validation failed');
                return $validationError;
            }
            error_log('[Auth][register] validation OK');

            // ── Require legal acceptance ──
            if (empty($data['accepted_terms']) || empty($data['accepted_fees']) || empty($data['accepted_contractor'])) {
                error_log('[Auth][register] legal agreements missing');
                return $this->error('You must accept all legal agreements to register', 422);
            }
            error_log('[Auth][register] legal agreements OK');

            $email = strtolower(trim($data['email']));

            // Check duplicate
            error_log('[Auth][register] checking duplicate email: ' . $email);
            $stmt = $this->db->pdo()->prepare('SELECT id FROM "user" WHERE email = :email');
            $stmt->execute(['email' => $email]);
            if ($stmt->fetch()) {
                error_log('[Auth][register] duplicate email');
                return $this->error('Email already registered', 409);
            }
            error_log('[Auth][register] email unique OK');

            $id = $this->uuid();
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            error_log('[Auth][register] inserting user id=' . $id);
            $this->db->pdo()->prepare(
                'INSERT INTO "user" (id, email, password_hash, role, status, display_name,
                                     first_name, last_name, timezone, locale, token_version,
                                     metadata, created_at, updated_at)
                 VALUES (:id, :email, :password_hash, :role, :status, :display_name,
                         :first_name, :last_name, :timezone, :locale, 1,
                         :metadata, :created_at, :updated_at)'
            )->execute([
                        'id' => $id,
                        'email' => $email,
                        'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                        'role' => $data['role'],
                        'status' => 'pending_verification',
                        'display_name' => $data['display_name'],
                        'first_name' => $data['first_name'] ?? null,
                        'last_name' => $data['last_name'] ?? null,
                        'timezone' => $data['timezone'] ?? 'UTC',
                        'locale' => $data['locale'] ?? 'en',
                        'metadata' => json_encode(array_merge(
                            is_array($data['metadata'] ?? null) ? $data['metadata'] : (is_string($data['metadata'] ?? null) ? (json_decode($data['metadata'], true) ?: []) : []),
                            [
                                'legal_accepted_at' => $now,
                                'terms_version' => '2026-02-23',
                                'accepted_terms' => true,
                                'accepted_fees' => true,
                                'accepted_contractor' => true,
                            ]
                        )),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
            error_log('[Auth][register] user INSERT OK');

            // Create empty profile row based on role
            $role = $data['role'];
            error_log('[Auth][register] creating profile for role=' . $role);
            if ($role === 'client') {
                $this->db->pdo()->prepare(
                    'INSERT INTO "clientprofile" (user_id, created_at, updated_at)
                     VALUES (:uid, :now, :now)'
                )->execute(['uid' => $id, 'now' => $now]);
                error_log('[Auth][register] clientprofile INSERT OK');
            } elseif ($role === 'freelancer') {
                $this->db->pdo()->prepare(
                    'INSERT INTO "freelancerprofile" (user_id, created_at, updated_at)
                     VALUES (:uid, :now, :now)'
                )->execute(['uid' => $id, 'now' => $now]);
                error_log('[Auth][register] freelancerprofile INSERT OK');
            }

            // ── Generate email-verification token ──
            error_log('[Auth][register] generating verify token');
            $verifyToken = bin2hex(random_bytes(32));
            $this->db->pdo()->prepare(
                'UPDATE "user" SET metadata = jsonb_set(COALESCE(metadata, \'{}\'::jsonb), \'{email_verify_token}\', to_jsonb(:token::text)),
                                   updated_at = :now WHERE id = :id'
            )->execute(['token' => $verifyToken, 'now' => $now, 'id' => $id]);
            error_log('[Auth][register] verify token saved');

            // Send verification email
            $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
            $verifyUrl = "{$frontendUrl}/auth/verify-email?token={$verifyToken}";
            error_log('[Auth][register] sending verify email to ' . $email);
            try {
                $this->mail ??= new MonkeysMailService();
                $this->mail->sendTemplate(
                    $email,
                    'Verify your email — MonkeysWork',
                    'verify-email',
                    ['userName' => $data['display_name'], 'verifyUrl' => $verifyUrl],
                    ['auth', 'verify-email'],
                );
                error_log('[Auth][register] verify email sent OK');
            } catch (\Throwable $e) {
                error_log('[Auth][register] verify email FAILED: ' . $e->getMessage());
            }

            // Dispatch domain event
            error_log('[Auth][register] dispatching event');
            $this->events?->dispatch(new UserRegistered($id, $email, $data['role']));

            // Publish to Pub/Sub (triggers fraud baseline + verification automation)
            error_log('[Auth][register] publishing to PubSub');
            $pubsub = $this->pubsub ?? new PubSubPublisher();
            try {
                $pubsub->userRegistered($id, $data['role'], $email);
                error_log('[Auth][register] PubSub OK');
            } catch (\Throwable $e) {
                error_log('[Auth][register] PubSub FAILED (non-critical): ' . $e->getMessage());
            }

            error_log('[Auth][register] ── SUCCESS ── id=' . $id);
            return $this->created(['data' => ['id' => $id, 'email' => $email, 'verification_sent' => true]]);
        } catch (\Throwable $e) {
            error_log('[Auth][register] ── FATAL ERROR ── ' . $e->getMessage());
            error_log('[Auth][register] file: ' . $e->getFile() . ':' . $e->getLine());
            error_log('[Auth][register] trace: ' . $e->getTraceAsString());
            return $this->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/login                                                   */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/login', name: 'auth.login', summary: 'Get JWT pair', tags: ['Auth'])]
    public function login(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->error('Email and password are required');
        }

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, password_hash, role, status, display_name, token_version, profile_completed, avatar_url
             FROM "user" WHERE email = :email AND deleted_at IS NULL'
        );
        $stmt->execute(['email' => strtolower(trim($data['email']))]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            return $this->error('Invalid credentials', 401);
        }

        if ($user['status'] === 'suspended') {
            return $this->error('Account suspended', 403);
        }

        if ($user['status'] === 'pending_verification') {
            return $this->json([
                'error' => 'Email not verified',
                'code' => 'email_not_verified',
                'email' => $user['email'] ?? strtolower(trim($data['email'])),
            ], 403);
        }

        // Generate JWT
        $jwtSecret = getenv('JWT_SECRET') ?: 'changeme-use-at-least-32-characters-of-randomness';
        $now = time();

        $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

        $accessPayload = self::base64UrlEncode(json_encode([
            'sub' => $user['id'],
            'role' => $user['role'],
            'email' => strtolower(trim($data['email'])),
            'iat' => $now,
            'exp' => $now + 1800, // 30 minutes
        ]));
        $accessSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$accessPayload}", $jwtSecret, true)
        );
        $accessToken = "{$header}.{$accessPayload}.{$accessSig}";

        $refreshPayload = self::base64UrlEncode(json_encode([
            'sub' => $user['id'],
            'type' => 'refresh',
            'iat' => $now,
            'exp' => $now + 604800, // 7 days
        ]));
        $refreshSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$refreshPayload}", $jwtSecret, true)
        );
        $refreshToken = "{$header}.{$refreshPayload}.{$refreshSig}";

        return $this->json([
            'data' => [
                'user_id' => $user['id'],
                'role' => $user['role'],
                'display_name' => $user['display_name'] ?? null,
                'profile_completed' => (bool) $user['profile_completed'],
                'avatar_url' => $user['avatar_url'] ?? null,
                'token' => $accessToken,
                'refresh' => $refreshToken,
            ],
        ]);
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/refresh                                                 */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/refresh', name: 'auth.refresh', summary: 'Refresh JWT', tags: ['Auth'])]
    public function refresh(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['refresh_token'])) {
            return $this->error('Refresh token is required');
        }

        // TODO: validate refresh token, issue new pair
        return $this->json(['data' => ['token' => 'NEW_JWT', 'refresh' => 'NEW_REFRESH']]);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/logout                                                  */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/logout', name: 'auth.logout', summary: 'Revoke session', tags: ['Auth'], middleware: ['auth'])]
    public function logout(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        // TODO: revoke session / blacklist JWT
        return $this->json(['message' => 'Logged out']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/resend-verification                                     */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/resend-verification', name: 'auth.resendVerification', summary: 'Resend verification email', tags: ['Auth'])]
    public function resendVerification(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);
        $email = strtolower(trim($data['email'] ?? ''));

        if (!$email) {
            return $this->error('Email is required');
        }

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, display_name, status FROM "user" WHERE email = :email AND deleted_at IS NULL'
        );
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Always return success to prevent email enumeration
        if (!$user || $user['status'] !== 'pending_verification') {
            return $this->json(['message' => 'If the email exists and is unverified, a new verification link has been sent']);
        }

        // Generate new verification token
        $verifyToken = bin2hex(random_bytes(32));
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "user" SET metadata = jsonb_set(COALESCE(metadata, \'{}\'::jsonb), \'{email_verify_token}\', to_jsonb(:token::text)),
                               updated_at = :now WHERE id = :id'
        )->execute(['token' => $verifyToken, 'now' => $now, 'id' => $user['id']]);

        // Send verification email
        $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
        $verifyUrl = "{$frontendUrl}/auth/verify-email?token={$verifyToken}";
        try {
            $this->mail ??= new MonkeysMailService();
            $this->mail->sendTemplate(
                $email,
                'Verify your email — MonkeysWorks',
                'verify-email',
                ['userName' => $user['display_name'], 'verifyUrl' => $verifyUrl],
                ['auth', 'verify-email'],
            );
        } catch (\Throwable $e) {
            error_log('[Auth] Failed to resend verify email: ' . $e->getMessage());
        }

        return $this->json(['message' => 'If the email exists and is unverified, a new verification link has been sent']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/forgot-password                                         */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/forgot-password', name: 'auth.forgot', summary: 'Send reset email', tags: ['Auth'])]
    public function forgotPassword(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['email'])) {
            return $this->error('Email is required');
        }

        $email = strtolower(trim($data['email']));

        // Look up user (always return success to prevent email enumeration)
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, display_name FROM "user" WHERE email = :email AND deleted_at IS NULL'
        );
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($user) {
            // Generate reset token with 1-hour expiry
            $resetToken = bin2hex(random_bytes(32));
            $expiresAt = (new \DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            $this->db->pdo()->prepare(
                'UPDATE "user" SET
                    metadata = jsonb_set(
                        jsonb_set(COALESCE(metadata, \'{}\'::jsonb), \'{reset_token}\', to_jsonb(:token::text)),
                        \'{reset_token_expires}\', to_jsonb(:expires::text)
                    ),
                    updated_at = :now
                 WHERE id = :id'
            )->execute(['token' => $resetToken, 'expires' => $expiresAt, 'now' => $now, 'id' => $user['id']]);

            // Send reset email
            $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
            $resetUrl = "{$frontendUrl}/auth/reset-password?token={$resetToken}";
            try {
                $this->mail ??= new MonkeysMailService();
                $this->mail->sendTemplate(
                    $email,
                    'Reset your password — MonkeysWork',
                    'forgot-password',
                    ['userName' => $user['display_name'], 'resetUrl' => $resetUrl],
                    ['auth', 'forgot-password'],
                );
            } catch (\Throwable $e) {
                error_log('[Auth] Failed to send reset email: ' . $e->getMessage());
            }
        }

        return $this->json(['message' => 'If the email exists, a reset link has been sent']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/reset-password                                          */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/reset-password', name: 'auth.reset', summary: 'Reset with token', tags: ['Auth'])]
    public function resetPassword(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['token']) || empty($data['password'])) {
            return $this->error('Token and new password are required');
        }

        if (strlen($data['password']) < 8) {
            return $this->error('Password must be at least 8 characters');
        }

        // Find user by reset token
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, metadata FROM "user" WHERE metadata->>>\'reset_token\' = :token AND deleted_at IS NULL'
        );
        $stmt->execute(['token' => $data['token']]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->error('Invalid or expired reset token', 400);
        }

        // Check expiry
        $meta = json_decode($user['metadata'] ?? '{}', true);
        $expires = $meta['reset_token_expires'] ?? null;
        if ($expires && new \DateTimeImmutable($expires) < new \DateTimeImmutable()) {
            return $this->error('Reset token has expired. Please request a new one.', 400);
        }

        // Update password, clear token, bump token_version to invalidate sessions
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "user" SET
                password_hash = :hash,
                token_version = token_version + 1,
                metadata = metadata - \'reset_token\' - \'reset_token_expires\',
                updated_at = :now
             WHERE id = :id'
        )->execute([
                    'hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                    'now' => $now,
                    'id' => $user['id'],
                ]);

        return $this->json(['message' => 'Password has been reset successfully']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/change-password  (authenticated)                        */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/change-password', name: 'auth.changePassword', summary: 'Change password (logged in)', tags: ['Auth'], middleware: ['auth'])]
    public function changePassword(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['current_password']) || empty($data['new_password'])) {
            return $this->error('current_password and new_password are required');
        }

        if (strlen($data['new_password']) < 8) {
            return $this->error('New password must be at least 8 characters');
        }

        // Fetch current hash
        $stmt = $this->db->pdo()->prepare('SELECT password_hash FROM "user" WHERE id = :id');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user || !password_verify($data['current_password'], $user['password_hash'])) {
            return $this->error('Current password is incorrect', 403);
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "user" SET password_hash = :hash,
                token_version = token_version + 1,
                updated_at = :now WHERE id = :id'
        )->execute([
                    'hash' => password_hash($data['new_password'], PASSWORD_BCRYPT),
                    'now' => $now,
                    'id' => $userId,
                ]);

        return $this->json(['message' => 'Password changed successfully']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/verify-email                                            */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/verify-email', name: 'auth.verify', summary: 'Verify email token', tags: ['Auth'])]
    public function verifyEmail(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['token'])) {
            return $this->error('Verification token is required');
        }

        // Find user by verification token
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, email, display_name, role FROM "user" WHERE metadata->>>\'email_verify_token\' = :token AND deleted_at IS NULL'
        );
        $stmt->execute(['token' => $data['token']]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->error('Invalid verification token', 400);
        }

        // Activate account
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "user" SET
                status = \'active\',
                email_verified_at = :now,
                metadata = metadata - \'email_verify_token\',
                updated_at = :now
             WHERE id = :id'
        )->execute(['now' => $now, 'id' => $user['id']]);

        // Send welcome email
        try {
            $this->mail->sendTemplate(
                $user['email'],
                'Welcome to MonkeysWork!',
                'welcome',
                ['userName' => $user['display_name'], 'role' => $user['role']],
                ['auth', 'welcome'],
            );
        } catch (\Throwable $e) {
            error_log('[Auth] Failed to send welcome email: ' . $e->getMessage());
        }

        return $this->json(['message' => 'Email verified successfully']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/oauth/{provider}                                        */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/oauth/{provider}', name: 'auth.oauth', summary: 'OAuth login', tags: ['Auth'])]
    public function oauthCallback(ServerRequestInterface $request, string $provider): JsonResponse
    {
        $allowed = ['google', 'github'];
        if (!in_array($provider, $allowed, true)) {
            return $this->error("Unsupported provider: {$provider}");
        }

        $data = $this->body($request);

        if (empty($data['code'])) {
            return $this->error('Authorization code is required');
        }

        try {
            // ── 1. Exchange code & fetch user info per provider ──
            if ($provider === 'github') {
                $svc = new \App\Service\GitHubOAuthService();
                $tokens = $svc->exchangeCode($data['code']);
                $ghUser = $svc->fetchUser($tokens['access_token']);
                $email = $svc->fetchPrimaryEmail($tokens['access_token']);
                $provId = (string) $ghUser['id'];
                $name = $ghUser['name'] ?? $ghUser['login'] ?? '';
                $avatar = $ghUser['avatar_url'] ?? null;
                $firstName = explode(' ', $name)[0] ?? null;
                $lastName = count(explode(' ', $name)) > 1 ? explode(' ', $name, 2)[1] : null;
                $accessTk = $tokens['access_token'];
                $refreshTk = null;
                $expiresAt = null;
            } else { // google
                $svc = new \App\Service\GoogleOAuthService();
                $tokens = $svc->exchangeCode($data['code']);
                $gUser = $svc->fetchUser($tokens['access_token']);
                $email = $gUser['email'] ?? '';
                $provId = (string) $gUser['id'];
                $name = $gUser['name'] ?? '';
                $avatar = $gUser['picture'] ?? null;
                $firstName = $gUser['given_name'] ?? null;
                $lastName = $gUser['family_name'] ?? null;
                $accessTk = $tokens['access_token'];
                $refreshTk = $tokens['refresh_token'] ?? null;
                $expiresAt = isset($tokens['expires_in'])
                    ? (new \DateTimeImmutable("+{$tokens['expires_in']} seconds"))->format('Y-m-d H:i:s')
                    : null;
            }

            if (!$email) {
                return $this->error('Could not retrieve email from provider', 400);
            }

            $email = strtolower(trim($email));
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
            $pdo = $this->db->pdo();
            $role = 'pending'; // role selected after OAuth registration

            // ── 2. Check if OAuth link already exists ──
            $stmt = $pdo->prepare(
                'SELECT user_id FROM "user_oauth" WHERE provider = :provider AND provider_user_id = :pid'
            );
            $stmt->execute(['provider' => $provider, 'pid' => $provId]);
            $oauthRow = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($oauthRow) {
                // Existing OAuth link — fetch user
                $userId = $oauthRow['user_id'];
                // Auto-verify if still pending (OAuth provider confirms email)
                $pdo->prepare(
                    'UPDATE "user" SET status = \'active\', email_verified_at = COALESCE(email_verified_at, :now)
                     WHERE id = :id AND status = \'pending_verification\''
                )->execute(['id' => $userId, 'now' => $now]);
            } else {
                // Check if user with this email exists
                $stmt = $pdo->prepare('SELECT id FROM "user" WHERE email = :email AND deleted_at IS NULL');
                $stmt->execute(['email' => $email]);
                $existingUser = $stmt->fetch(\PDO::FETCH_ASSOC);

                if ($existingUser) {
                    $userId = $existingUser['id'];
                    // Auto-verify email for OAuth users — the provider already confirmed it
                    $pdo->prepare(
                        'UPDATE "user" SET status = \'active\', email_verified_at = COALESCE(email_verified_at, :now)
                         WHERE id = :id AND status = \'pending_verification\''
                    )->execute(['id' => $userId, 'now' => $now]);
                } else {
                    // ── 3. Create new user ──
                    $userId = $this->uuid();
                    $pdo->prepare(
                        'INSERT INTO "user" (id, email, password_hash, role, status, display_name,
                                             first_name, last_name, avatar_url, timezone, locale,
                                             token_version, email_verified_at, metadata, created_at, updated_at)
                         VALUES (:id, :email, :password_hash, :role, :status, :display_name,
                                 :first_name, :last_name, :avatar_url, :timezone, :locale, 1,
                                 :verified_at, :metadata, :created_at, :updated_at)'
                    )->execute([
                                'id' => $userId,
                                'email' => $email,
                                'password_hash' => '', // OAuth users have no password
                                'role' => $role,
                                'status' => 'active',
                                'display_name' => $name ?: explode('@', $email)[0],
                                'first_name' => $firstName,
                                'last_name' => $lastName,
                                'avatar_url' => $avatar,
                                'timezone' => 'UTC',
                                'locale' => 'en',
                                'verified_at' => $now,
                                'metadata' => json_encode(['oauth_provider' => $provider]),
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);

                    // Profile creation deferred until user selects role
                }

                // ── 4. Create OAuth link ──
                $oauthId = $this->uuid();
                $pdo->prepare(
                    'INSERT INTO "user_oauth" (id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at, created_at)
                     VALUES (:id, :user_id, :provider, :pid, :at, :rt, :ea, :now)'
                )->execute([
                            'id' => $oauthId,
                            'user_id' => $userId,
                            'provider' => $provider,
                            'pid' => $provId,
                            'at' => $accessTk,
                            'rt' => $refreshTk,
                            'ea' => $expiresAt,
                            'now' => $now,
                        ]);
            }

            // ── 5. Update OAuth tokens (always keep fresh) ──
            $pdo->prepare(
                'UPDATE "user_oauth" SET access_token = :at, refresh_token = :rt, expires_at = :ea
                 WHERE provider = :provider AND provider_user_id = :pid'
            )->execute([
                        'at' => $accessTk,
                        'rt' => $refreshTk,
                        'ea' => $expiresAt,
                        'provider' => $provider,
                        'pid' => $provId,
                    ]);

            // ── 6. Fetch user for JWT ──
            $stmt = $pdo->prepare(
                'SELECT id, email, role, status, display_name, token_version, profile_completed, avatar_url
                 FROM "user" WHERE id = :id AND deleted_at IS NULL'
            );
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->error('User account not found', 404);
            }

            if ($user['status'] === 'suspended') {
                return $this->error('Account suspended', 403);
            }

            // ── 7. Generate JWT ──
            $jwtSecret = getenv('JWT_SECRET') ?: 'changeme-use-at-least-32-characters-of-randomness';
            $nowTs = time();
            $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

            $accessPayload = self::base64UrlEncode(json_encode([
                'sub' => $user['id'],
                'role' => $user['role'],
                'email' => $user['email'],
                'iat' => $nowTs,
                'exp' => $nowTs + 1800,
            ]));
            $accessSig = self::base64UrlEncode(hash_hmac('sha256', "{$header}.{$accessPayload}", $jwtSecret, true));
            $accessToken = "{$header}.{$accessPayload}.{$accessSig}";

            $refreshPayload = self::base64UrlEncode(json_encode([
                'sub' => $user['id'],
                'type' => 'refresh',
                'iat' => $nowTs,
                'exp' => $nowTs + 604800,
            ]));
            $refreshSig = self::base64UrlEncode(hash_hmac('sha256', "{$header}.{$refreshPayload}", $jwtSecret, true));
            $refreshToken = "{$header}.{$refreshPayload}.{$refreshSig}";

            return $this->json([
                'data' => [
                    'user_id' => $user['id'],
                    'role' => $user['role'],
                    'display_name' => $user['display_name'] ?? null,
                    'profile_completed' => (bool) $user['profile_completed'],
                    'avatar_url' => $user['avatar_url'] ?? null,
                    'token' => $accessToken,
                    'refresh' => $refreshToken,
                ],
            ]);
        } catch (\Throwable $e) {
            error_log("[OAuth] {$provider} error: " . $e->getMessage());
            return $this->error('OAuth authentication failed: ' . $e->getMessage(), 400);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/set-role                                                */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/set-role', name: 'auth.setRole', summary: 'Set role for pending user', tags: ['Auth'], middleware: ['auth'])]
    public function setRole(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $role = $data['role'] ?? null;

        if (!in_array($role, ['client', 'freelancer'], true)) {
            return $this->error('Role must be "client" or "freelancer"');
        }

        // Verify user is actually pending
        $stmt = $this->db->pdo()->prepare('SELECT role FROM "user" WHERE id = :id');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return $this->notFound('User');
        }

        if ($user['role'] !== 'pending') {
            return $this->error('Role has already been set', 409);
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();

        // Update user role
        $pdo->prepare(
            'UPDATE "user" SET role = :role, updated_at = :now WHERE id = :id'
        )->execute(['role' => $role, 'now' => $now, 'id' => $userId]);

        // Create empty profile
        if ($role === 'client') {
            $pdo->prepare(
                'INSERT INTO "clientprofile" (user_id, created_at, updated_at) VALUES (:uid, :now, :now)'
            )->execute(['uid' => $userId, 'now' => $now]);
        } else {
            $pdo->prepare(
                'INSERT INTO "freelancerprofile" (user_id, created_at, updated_at) VALUES (:uid, :now, :now)'
            )->execute(['uid' => $userId, 'now' => $now]);
        }

        return $this->json([
            'message' => 'Role set successfully',
            'data' => ['role' => $role],
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/2fa/enable                                              */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/2fa/enable', name: 'auth.2fa.enable', summary: 'Enable TOTP', tags: ['Auth'], middleware: ['auth'])]
    public function enable2fa(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        // TODO: generate TOTP secret, return QR code URI
        return $this->json(['data' => ['secret' => 'TOTP_SECRET', 'qr_uri' => 'otpauth://...']]);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/2fa/verify                                              */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/2fa/verify', name: 'auth.2fa.verify', summary: 'Verify TOTP', tags: ['Auth'], middleware: ['auth'])]
    public function verify2fa(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['code'])) {
            return $this->error('TOTP code is required');
        }

        // TODO: validate TOTP code, enable 2FA on account
        return $this->json(['message' => '2FA enabled']);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */
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