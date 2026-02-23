<?php
declare(strict_types=1);

namespace App\Service;

/**
 * GitHub OAuth2 service – exchanges authorization codes and fetches user info.
 */
final class GitHubOAuthService
{
    private string $clientId;
    private string $clientSecret;

    public function __construct()
    {
        $this->clientId = getenv('GITHUB_CLIENT_ID') ?: '';
        $this->clientSecret = getenv('GITHUB_CLIENT_SECRET') ?: '';
    }

    /* ── Exchange authorization code for access token ───────────────── */
    public function exchangeCode(string $code): array
    {
        $ch = curl_init('https://github.com/login/oauth/access_token');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode([
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'code' => $code,
            ]),
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            throw new \RuntimeException('GitHub token exchange failed');
        }

        $data = json_decode($response, true);

        if (!empty($data['error'])) {
            throw new \RuntimeException("GitHub OAuth error: {$data['error_description']}");
        }

        return $data; // { access_token, token_type, scope }
    }

    /* ── Fetch GitHub user profile ─────────────────────────────────── */
    public function fetchUser(string $accessToken): array
    {
        $ch = curl_init('https://api.github.com/user');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
                'Accept: application/json',
                'User-Agent: MonkeysWork',
            ],
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            throw new \RuntimeException('Failed to fetch GitHub user');
        }

        return json_decode($response, true);
    }

    /* ── Fetch primary verified email ──────────────────────────────── */
    public function fetchPrimaryEmail(string $accessToken): string
    {
        $ch = curl_init('https://api.github.com/user/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$accessToken}",
                'Accept: application/json',
                'User-Agent: MonkeysWork',
            ],
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            throw new \RuntimeException('Failed to fetch GitHub emails');
        }

        $emails = json_decode($response, true);

        // Prefer primary + verified email
        foreach ($emails as $entry) {
            if (!empty($entry['primary']) && !empty($entry['verified'])) {
                return $entry['email'];
            }
        }

        // Fallback: first verified email
        foreach ($emails as $entry) {
            if (!empty($entry['verified'])) {
                return $entry['email'];
            }
        }

        throw new \RuntimeException('No verified email found on GitHub account');
    }
}
