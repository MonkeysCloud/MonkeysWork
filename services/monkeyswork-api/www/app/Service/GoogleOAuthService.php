<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Google OAuth2 service – exchanges authorization codes and fetches user info.
 */
final class GoogleOAuthService
{
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    public function __construct()
    {
        $this->clientId = getenv('GOOGLE_CLIENT_ID') ?: '';
        $this->clientSecret = getenv('GOOGLE_CLIENT_SECRET') ?: '';

        $frontendUrl = getenv('FRONTEND_URL') ?: 'https://monkeysworks.com';
        $this->redirectUri = rtrim($frontendUrl, '/') . '/auth/google/callback';
    }

    /* ── Exchange authorization code for tokens ────────────────────── */
    public function exchangeCode(string $code): array
    {
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_POSTFIELDS => http_build_query([
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $this->redirectUri,
            ]),
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            throw new \RuntimeException('Google token exchange failed');
        }

        $data = json_decode($response, true);

        if (!empty($data['error'])) {
            throw new \RuntimeException("Google OAuth error: {$data['error_description']}");
        }

        return $data; // { access_token, id_token, expires_in, token_type, refresh_token? }
    }

    /* ── Fetch Google user profile ─────────────────────────────────── */
    public function fetchUser(string $accessToken): array
    {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            throw new \RuntimeException('Failed to fetch Google user');
        }

        return json_decode($response, true);
        // { id, email, verified_email, name, given_name, family_name, picture }
    }
}
