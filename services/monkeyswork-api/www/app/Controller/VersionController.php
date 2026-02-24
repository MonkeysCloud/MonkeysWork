<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Http\Attribute\Route;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\ORM\DB;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Public endpoint for app version checking.
 * Allows desktop and mobile apps to verify they meet the minimum required version.
 */
final class VersionController
{
    use ApiController;

    /* ── GET /app/version-check ── */
    #[Route('GET', '/version-check', name: 'app.versionCheck', summary: 'Check if app version meets minimum requirement', tags: ['App'], prefix: '/app')]
    public function check(ServerRequestInterface $request): JsonResponse
    {
        $query = $request->getQueryParams();
        $platform = $query['platform'] ?? '';
        $version = $query['version'] ?? '';

        if (!in_array($platform, ['desktop', 'mobile'], true)) {
            return $this->error('Invalid platform. Must be "desktop" or "mobile".');
        }
        if (!$version || !preg_match('/^\d+\.\d+\.\d+/', $version)) {
            return $this->error('Invalid version format. Use semver (e.g. 1.0.0).');
        }

        // Read minimum and latest versions from environment
        if ($platform === 'desktop') {
            $minVersion = getenv('MIN_DESKTOP_VERSION') ?: '0.1.0';
            $latestVersion = getenv('LATEST_DESKTOP_VERSION') ?: '0.1.0';
            $downloadUrl = getenv('DESKTOP_DOWNLOAD_URL') ?: 'https://monkeysworks.com/download';
        } else {
            $minVersion = getenv('MIN_MOBILE_VERSION') ?: '1.0.0';
            $latestVersion = getenv('LATEST_MOBILE_VERSION') ?: '1.0.0';
            $downloadUrl = getenv('MOBILE_DOWNLOAD_URL') ?: 'https://monkeysworks.com/download';
        }

        $updateRequired = version_compare($version, $minVersion, '<');

        return $this->json([
            'data' => [
                'update_required' => $updateRequired,
                'min_version' => $minVersion,
                'latest_version' => $latestVersion,
                'current_version' => $version,
                'download_url' => $downloadUrl,
            ],
        ]);
    }
}
