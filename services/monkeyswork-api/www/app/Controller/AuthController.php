<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\UserRegistered;
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
    ) {}

    /* ------------------------------------------------------------------ */
    /*  POST /auth/register                                                */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/register', name: 'auth.register', summary: 'Create account', tags: ['Auth'])]
    public function register(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        // Validate input
        $validationError = $this->registrationValidator->validateOrFail($data);
        if ($validationError) {
            return $validationError;
        }

        $email = strtolower(trim($data['email']));

        // Check duplicate
        $stmt = $this->db->pdo()->prepare('SELECT id FROM "user" WHERE email = :email');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            return $this->error('Email already registered', 409);
        }

        $id = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "user" (id, email, password_hash, role, status, display_name,
                                 first_name, last_name, timezone, locale, token_version,
                                 metadata, created_at, updated_at)
             VALUES (:id, :email, :password_hash, :role, :status, :display_name,
                     :first_name, :last_name, :timezone, :locale, 1,
                     :metadata, :created_at, :updated_at)'
        )->execute([
            'id'            => $id,
            'email'         => $email,
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role'          => $data['role'],
            'status'        => 'pending_verification',
            'display_name'  => $data['display_name'],
            'first_name'    => $data['first_name'] ?? null,
            'last_name'     => $data['last_name'] ?? null,
            'timezone'      => $data['timezone'] ?? 'UTC',
            'locale'        => $data['locale'] ?? 'en',
            'metadata'      => json_encode($data['metadata'] ?? []),
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        // Create empty profile row based on role
        $role = $data['role'];
        if ($role === 'client') {
            $this->db->pdo()->prepare(
                'INSERT INTO "clientprofile" (user_id, created_at, updated_at)
                 VALUES (:uid, :now, :now)'
            )->execute(['uid' => $id, 'now' => $now]);
        } elseif ($role === 'freelancer') {
            $this->db->pdo()->prepare(
                'INSERT INTO "freelancerprofile" (user_id, created_at, updated_at)
                 VALUES (:uid, :now, :now)'
            )->execute(['uid' => $id, 'now' => $now]);
        }

        // Dispatch domain event
        $this->events?->dispatch(new UserRegistered($id, $email, $data['role']));

        // Publish to Pub/Sub (triggers fraud baseline + verification automation)
        $pubsub = $this->pubsub ?? new PubSubPublisher();
        try {
            $pubsub->userRegistered($id, $data['role'], $email);
        } catch (\Throwable) {
            // Non-critical: don't fail registration if Pub/Sub is down
        }

        return $this->created(['data' => ['id' => $id, 'email' => $email]]);
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

        // Generate JWT
        $jwtSecret = getenv('JWT_SECRET') ?: 'changeme-use-at-least-32-characters-of-randomness';
        $now = time();

        $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

        $accessPayload = self::base64UrlEncode(json_encode([
            'sub'   => $user['id'],
            'role'  => $user['role'],
            'email' => strtolower(trim($data['email'])),
            'iat'   => $now,
            'exp'   => $now + 1800, // 30 minutes
        ]));
        $accessSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$accessPayload}", $jwtSecret, true)
        );
        $accessToken = "{$header}.{$accessPayload}.{$accessSig}";

        $refreshPayload = self::base64UrlEncode(json_encode([
            'sub'  => $user['id'],
            'type' => 'refresh',
            'iat'  => $now,
            'exp'  => $now + 604800, // 7 days
        ]));
        $refreshSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$refreshPayload}", $jwtSecret, true)
        );
        $refreshToken = "{$header}.{$refreshPayload}.{$refreshSig}";

        return $this->json([
            'data' => [
                'user_id'            => $user['id'],
                'role'               => $user['role'],
                'display_name'       => $user['display_name'] ?? null,
                'profile_completed'  => (bool) $user['profile_completed'],
                'avatar_url'         => $user['avatar_url'] ?? null,
                'token'              => $accessToken,
                'refresh'            => $refreshToken,
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
    /*  POST /auth/forgot-password                                         */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/forgot-password', name: 'auth.forgot', summary: 'Send reset email', tags: ['Auth'])]
    public function forgotPassword(ServerRequestInterface $request): JsonResponse
    {
        $data = $this->body($request);

        if (empty($data['email'])) {
            return $this->error('Email is required');
        }

        // Always return success to prevent email enumeration
        // TODO: queue reset email
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

        // TODO: validate token, update password, invalidate sessions
        return $this->json(['message' => 'Password has been reset']);
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

        // TODO: validate token, set email_verified_at, update status to active
        return $this->json(['message' => 'Email verified']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /auth/oauth/{provider}                                        */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/oauth/{provider}', name: 'auth.oauth', summary: 'OAuth login', tags: ['Auth'])]
    public function oauthCallback(ServerRequestInterface $request, string $provider): JsonResponse
    {
        $allowed = ['google', 'github', 'linkedin'];
        if (!in_array($provider, $allowed, true)) {
            return $this->error("Unsupported provider: {$provider}");
        }

        $data = $this->body($request);

        // TODO: exchange code for token, upsert user, issue JWT
        return $this->json(['data' => ['provider' => $provider, 'token' => 'JWT_PLACEHOLDER']]);
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
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
