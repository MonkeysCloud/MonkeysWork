<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Google Cloud Storage uploader.
 *
 * In production (GKE with Workload Identity), fetches an access-token from
 * the metadata server — no key-file or SDK needed.
 *
 * In dev/local, falls back to the local filesystem and returns a relative URL.
 */
final class GcsStorage
{
    private string $bucket;
    private string $publicBaseUrl;
    private bool $enabled;

    public function __construct()
    {
        $this->bucket = getenv('GCS_BUCKET') ?: ($_ENV['GCS_BUCKET'] ?? '');
        $this->publicBaseUrl = rtrim(getenv('GCS_PUBLIC_URL') ?: ($_ENV['GCS_PUBLIC_URL'] ?? ''), '/');
        $appEnv = getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? 'local');
        $this->enabled = $this->bucket !== '' && in_array($appEnv, ['production', 'prod'], true);
        error_log("[GcsStorage] bucket={$this->bucket} appEnv={$appEnv} enabled=" . ($this->enabled ? 'YES' : 'NO'));
    }

    /* ── public helpers ───────────────────────────────────────────────── */

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Upload a local file to GCS and return its public URL.
     * Falls back to a relative path in dev.
     */
    public function upload(string $localPath, string $gcsObjectPath, string $contentType = ''): string
    {
        if (!$this->enabled) {
            // Dev mode — just return relative URL from the public dir
            return $this->relativeUrl($localPath);
        }

        if (!$contentType) {
            $contentType = mime_content_type($localPath) ?: 'application/octet-stream';
        }

        $token = $this->getAccessToken();
        $url = sprintf(
            'https://storage.googleapis.com/upload/storage/v1/b/%s/o?uploadType=media&name=%s',
            urlencode($this->bucket),
            urlencode($gcsObjectPath)
        );

        $fileContents = file_get_contents($localPath);
        if ($fileContents === false) {
            throw new \RuntimeException("Cannot read file: {$localPath}");
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", [
                    "Authorization: Bearer {$token}",
                    "Content-Type: {$contentType}",
                    "Content-Length: " . strlen($fileContents),
                ]),
                'content' => $fileContents,
                'timeout' => 60,
                'ignore_errors' => true,
            ],
        ]);

        $response = file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? '';

        if (!str_contains($statusLine, '200')) {
            error_log("[GcsStorage] Upload failed: {$statusLine} — {$response}");
            throw new \RuntimeException("GCS upload failed: {$statusLine}");
        }

        error_log("[GcsStorage] Uploaded {$gcsObjectPath} to {$this->bucket}");

        return $this->getPublicUrl($gcsObjectPath);
    }

    /**
     * Delete an object from GCS.
     */
    public function delete(string $gcsObjectPath): void
    {
        if (!$this->enabled) {
            return;
        }

        $token = $this->getAccessToken();
        $url = sprintf(
            'https://storage.googleapis.com/storage/v1/b/%s/o/%s',
            urlencode($this->bucket),
            urlencode($gcsObjectPath)
        );

        $context = stream_context_create([
            'http' => [
                'method' => 'DELETE',
                'header' => "Authorization: Bearer {$token}",
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ]);

        file_get_contents($url, false, $context);
    }

    /**
     * Get the public URL for a GCS object.
     */
    public function getPublicUrl(string $gcsObjectPath): string
    {
        if ($this->publicBaseUrl) {
            return $this->publicBaseUrl . '/' . ltrim($gcsObjectPath, '/');
        }

        return sprintf(
            'https://storage.googleapis.com/%s/%s',
            $this->bucket,
            ltrim($gcsObjectPath, '/')
        );
    }

    /**
     * Convert a GCS public URL back to a GCS object path.
     * Returns null if the URL is not a GCS URL.
     */
    public function urlToObjectPath(string $url): ?string
    {
        $prefix = sprintf('https://storage.googleapis.com/%s/', $this->bucket);
        if (str_starts_with($url, $prefix)) {
            return substr($url, strlen($prefix));
        }

        if ($this->publicBaseUrl && str_starts_with($url, $this->publicBaseUrl . '/')) {
            return substr($url, strlen($this->publicBaseUrl) + 1);
        }

        return null;
    }

    /* ── private helpers ──────────────────────────────────────────────── */

    /**
     * Get an access token from the GKE metadata server (Workload Identity).
     */
    private function getAccessToken(): string
    {
        static $cachedToken = null;
        static $expiresAt = 0;

        if ($cachedToken && time() < $expiresAt - 60) {
            return $cachedToken;
        }

        $metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
        $context = stream_context_create([
            'http' => [
                'header' => 'Metadata-Flavor: Google',
                'timeout' => 5,
            ],
        ]);

        $response = @file_get_contents($metadataUrl, false, $context);
        if ($response === false) {
            throw new \RuntimeException('Failed to get access token from GKE metadata server');
        }

        $data = json_decode($response, true);
        if (!isset($data['access_token'])) {
            throw new \RuntimeException('Invalid metadata server response');
        }

        $cachedToken = $data['access_token'];
        $expiresAt = time() + ($data['expires_in'] ?? 3600);

        return $cachedToken;
    }

    /**
     * In dev mode, extract relative URL from local file path.
     */
    private function relativeUrl(string $localPath): string
    {
        // /app/www/public/files/avatars/xyz.jpg → /files/avatars/xyz.jpg
        $marker = '/public/files/';
        $pos = strpos($localPath, $marker);
        if ($pos !== false) {
            return '/files/' . substr($localPath, $pos + strlen($marker));
        }

        return $localPath;
    }
}
