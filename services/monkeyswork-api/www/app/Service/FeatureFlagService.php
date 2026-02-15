<?php
declare(strict_types=1);

namespace App\Service;

use MonkeysLegion\Database\Contracts\ConnectionInterface;

/**
 * Feature flag reader — reads from the `featureflag` table.
 *
 * Usage:
 *   $flags = new FeatureFlagService($db);
 *   if ($flags->isEnabled('fraud_detection_enabled')) { ... }
 *   $mode = $flags->getValue('fraud_enforcement_mode', 'shadow');
 */
final class FeatureFlagService
{
    /** @var array<string, array{enabled: bool, payload: mixed}>|null */
    private ?array $cache = null;

    public function __construct(private ConnectionInterface $db) {}

    /**
     * Is a flag enabled?
     */
    public function isEnabled(string $key): bool
    {
        $flag = $this->get($key);
        return $flag !== null && $flag['enabled'];
    }

    /**
     * Get a flag's payload value (from the `payload` JSONB column).
     * Falls back to $default if the flag doesn't exist or payload is null.
     */
    public function getValue(string $key, mixed $default = null): mixed
    {
        $flag = $this->get($key);
        if ($flag === null) {
            return $default;
        }
        $payload = $flag['payload'];
        if (is_string($payload)) {
            $decoded = json_decode($payload, true);
            return $decoded ?? $payload;
        }
        return $payload ?? $default;
    }

    /**
     * Get the enforcement mode for a flag (convenience for fraud, etc.).
     * Reads from payload.mode, falls back to $default.
     */
    public function getMode(string $key, string $default = 'shadow'): string
    {
        $val = $this->getValue($key);
        if (is_array($val) && isset($val['mode'])) {
            return (string) $val['mode'];
        }
        if (is_string($val)) {
            return $val;
        }
        return $default;
    }

    /**
     * Force reload from DB (useful after flag updates).
     */
    public function reload(): void
    {
        $this->cache = null;
    }

    /* ------------------------------------------------------------------ */

    /**
     * @return array{enabled: bool, payload: mixed}|null
     */
    private function get(string $key): ?array
    {
        $this->loadAll();
        return $this->cache[$key] ?? null;
    }

    private function loadAll(): void
    {
        if ($this->cache !== null) {
            return;
        }

        $this->cache = [];

        try {
            $rows = $this->db->pdo()->query(
                'SELECT key, enabled, payload FROM "featureflag"'
            )->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($rows as $row) {
                $this->cache[$row['key']] = [
                    'enabled' => (bool) $row['enabled'],
                    'payload' => $row['payload'],
                ];
            }
        } catch (\Throwable) {
            // Table might not exist yet in tests — fail gracefully
            $this->cache = [];
        }
    }
}
