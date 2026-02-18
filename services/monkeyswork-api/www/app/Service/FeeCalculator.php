<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Fee calculator with dual-fee model:
 *   Client fee:       5% added on top of the project amount
 *   Freelancer commission: 10% on the first $10,000 billed per client relationship
 *                          5% after $10,000 with that same client
 */
final class FeeCalculator
{
    private const CLIENT_FEE_RATE            = 0.05;
    private const FREELANCER_TIER_THRESHOLD  = 10000.00;
    private const FREELANCER_RATE_LOW        = 0.10;
    private const FREELANCER_RATE_HIGH       = 0.05;

    /* ─── Client Fee ─── */

    /**
     * @param  string $amount  Decimal string e.g. "1000.00"
     * @return string Client fee as decimal string e.g. "50.00"
     */
    public function calculateClientFee(string $amount): string
    {
        return number_format((float) $amount * self::CLIENT_FEE_RATE, 2, '.', '');
    }

    /**
     * Total amount the client is charged: project amount + client fee.
     */
    public function totalClientCharge(string $amount): string
    {
        $base = (float) $amount;
        return number_format($base + ($base * self::CLIENT_FEE_RATE), 2, '.', '');
    }

    /**
     * Convert a dollar amount to Stripe cents.
     */
    public function toCents(string $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    /* ─── Freelancer Commission ─── */

    /**
     * Calculate the freelancer commission for a given payment amount,
     * considering the cumulative billing in this client↔freelancer relationship.
     *
     * If cumulative + amount straddles the $10k threshold, the commission
     * is split: 10% on the portion under $10k, 5% on the portion above.
     *
     * @param  string $amount        Decimal string
     * @param  string $clientId      Client user ID
     * @param  string $freelancerId  Freelancer user ID
     * @param  \PDO   $pdo           Database connection
     * @return array{commission: string, rate_used: string, cumulative_before: string, cumulative_after: string}
     */
    public function calculateFreelancerCommission(
        string $amount,
        string $clientId,
        string $freelancerId,
        \PDO   $pdo,
    ): array {
        $amt = (float) $amount;

        // Get or create billing relationship
        $stmt = $pdo->prepare(
            'SELECT cumulative_billed FROM billing_relationship
             WHERE client_id = :cid AND freelancer_id = :fid'
        );
        $stmt->execute(['cid' => $clientId, 'fid' => $freelancerId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $cumBefore = $row ? (float) $row['cumulative_billed'] : 0.0;
        $cumAfter  = $cumBefore + $amt;

        // Calculate commission with possible tier split
        if ($cumBefore >= self::FREELANCER_TIER_THRESHOLD) {
            // All above threshold
            $commission = $amt * self::FREELANCER_RATE_HIGH;
            $rateUsed   = '5%';
        } elseif ($cumAfter <= self::FREELANCER_TIER_THRESHOLD) {
            // All below threshold
            $commission = $amt * self::FREELANCER_RATE_LOW;
            $rateUsed   = '10%';
        } else {
            // Straddles the threshold – split
            $belowPortion = self::FREELANCER_TIER_THRESHOLD - $cumBefore;
            $abovePortion = $amt - $belowPortion;
            $commission   = ($belowPortion * self::FREELANCER_RATE_LOW)
                          + ($abovePortion * self::FREELANCER_RATE_HIGH);
            $rateUsed     = '10%→5% (split)';
        }

        return [
            'commission'        => number_format($commission, 2, '.', ''),
            'rate_used'         => $rateUsed,
            'cumulative_before' => number_format($cumBefore, 2, '.', ''),
            'cumulative_after'  => number_format($cumAfter, 2, '.', ''),
        ];
    }

    /**
     * Persist the updated cumulative billing after a successful charge.
     */
    public function updateCumulativeBilling(
        string $amount,
        string $clientId,
        string $freelancerId,
        \PDO   $pdo,
    ): void {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Upsert (INSERT ON CONFLICT UPDATE)
        $pdo->prepare(
            'INSERT INTO billing_relationship (id, client_id, freelancer_id, cumulative_billed, updated_at)
             VALUES (:id, :cid, :fid, :amt, :now)
             ON CONFLICT (client_id, freelancer_id)
             DO UPDATE SET cumulative_billed = billing_relationship.cumulative_billed + :amt2,
                           updated_at = :now2'
        )->execute([
            'id'   => sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            ),
            'cid'  => $clientId,
            'fid'  => $freelancerId,
            'amt'  => $amount,
            'now'  => $now,
            'amt2' => $amount,
            'now2' => $now,
        ]);
    }

    /**
     * Get the current effective commission rate for a relationship.
     */
    public function getEffectiveRate(string $clientId, string $freelancerId, \PDO $pdo): array
    {
        $stmt = $pdo->prepare(
            'SELECT cumulative_billed FROM billing_relationship
             WHERE client_id = :cid AND freelancer_id = :fid'
        );
        $stmt->execute(['cid' => $clientId, 'fid' => $freelancerId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $cumulative = $row ? (float) $row['cumulative_billed'] : 0.0;
        $rate = $cumulative >= self::FREELANCER_TIER_THRESHOLD
            ? self::FREELANCER_RATE_HIGH
            : self::FREELANCER_RATE_LOW;

        return [
            'rate'              => number_format($rate * 100, 0) . '%',
            'cumulative_billed' => number_format($cumulative, 2, '.', ''),
            'threshold'         => number_format(self::FREELANCER_TIER_THRESHOLD, 2, '.', ''),
            'remaining_at_high_rate' => $cumulative < self::FREELANCER_TIER_THRESHOLD
                ? number_format(self::FREELANCER_TIER_THRESHOLD - $cumulative, 2, '.', '')
                : '0.00',
        ];
    }
}
