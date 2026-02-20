<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Handles the financial side-effects of disputes:
 *  - Hold freelancer payouts while a dispute is active
 *  - Process refunds / releases when a dispute is resolved
 *  - Send notifications to both parties
 */
final class DisputePaymentService
{
    public function __construct(
        private \PDO $pdo,
        private ?StripeService $stripe = null,
    ) {}

    private function stripe(): StripeService
    {
        return $this->stripe ??= new StripeService();
    }

    /* ──────────────────────────────────────────────────────────────
     *  Hold: called when a dispute is opened
     * ────────────────────────────────────────────────────────────── */

    /**
     * Creates a `dispute_hold` escrow transaction so the disputed amount
     * is flagged and won't be paid out to the freelancer.
     *
     * @param string      $contractId
     * @param string      $disputeId
     * @param string|null $amount      Specific amount to hold (null = total funded - already released)
     */
    public function holdPayoutForDispute(
        string  $contractId,
        string  $disputeId,
        ?string $amount = null,
    ): void {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // If no specific amount, hold the full unreleased balance for this contract
        if ($amount === null) {
            $amount = $this->getUnreleasedBalance($contractId);
        }

        if ((float) $amount <= 0) {
            return; // Nothing to hold
        }

        $this->insertEscrowTransaction(
            $contractId,
            'dispute_hold',
            $amount,
            'completed',
            null,
            $now,
            ['dispute_id' => $disputeId],
        );
    }

    /* ──────────────────────────────────────────────────────────────
     *  Resolve: called when a dispute resolution is finalized
     * ────────────────────────────────────────────────────────────── */

    /**
     * Execute the financial outcome of a dispute resolution.
     *
     * @param string      $disputeId
     * @param string      $contractId
     * @param string      $status           resolved_client | resolved_freelancer | resolved_split
     * @param string|null $resolutionAmount Amount to refund to client (null = full for client wins)
     */
    public function resolvePayment(
        string  $disputeId,
        string  $contractId,
        string  $status,
        ?string $resolutionAmount = null,
    ): void {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Get the contract parties
        $cStmt = $this->pdo->prepare(
            'SELECT client_id, freelancer_id, title FROM "contract" WHERE id = :cid'
        );
        $cStmt->execute(['cid' => $contractId]);
        $contract = $cStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$contract) {
            return;
        }

        // Calculate the held amount (from dispute_hold transactions)
        $heldAmount = $this->getDisputeHeldAmount($contractId);

        match ($status) {
            'resolved_client'     => $this->resolveForClient(
                $contractId, $disputeId, $contract, $resolutionAmount, $heldAmount, $now
            ),
            'resolved_freelancer' => $this->resolveForFreelancer(
                $contractId, $disputeId, $contract, $heldAmount, $now
            ),
            'resolved_split'     => $this->resolveForSplit(
                $contractId, $disputeId, $contract, $resolutionAmount, $heldAmount, $now
            ),
            default => null,
        };

        // Restore contract status to active (if it was disputed)
        $this->pdo->prepare(
            'UPDATE "contract" SET status = \'active\', updated_at = :now WHERE id = :cid AND status = \'disputed\''
        )->execute(['now' => $now, 'cid' => $contractId]);
    }

    /* ──────────────────────────────────────────────────────────────
     *  Check: is a freelancer's payout blocked by active disputes?
     * ────────────────────────────────────────────────────────────── */

    /**
     * Returns dispute info if the freelancer has active disputes, or null if clear.
     *
     * @return array|null  [{id, contract_id, contract_title}, ...]
     */
    public function getActiveDisputesForFreelancer(string $freelancerId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT d.id, d.contract_id, c.title AS contract_title
             FROM "dispute" d
             JOIN "contract" c ON c.id = d.contract_id
             WHERE c.freelancer_id = :uid
               AND d.status IN (\'open\', \'under_review\', \'escalated\')'
        );
        $stmt->execute(['uid' => $freelancerId]);
        $disputes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return !empty($disputes) ? $disputes : null;
    }

    /* ──────────────────────────────────────────────────────────────
     *  Notifications
     * ────────────────────────────────────────────────────────────── */

    public function notifyDisputeHold(
        string $freelancerId,
        string $contractTitle,
        string $now,
    ): void {
        $this->insertNotification(
            $freelancerId,
            'billing.dispute_hold',
            '⚠️ Payout Delayed — Dispute',
            "Your payout for \"{$contractTitle}\" has been placed on hold due to an active dispute. It will be released once the dispute is resolved.",
            ['link' => '/dashboard/disputes'],
            'warning',
            $now,
        );
    }

    public function notifyDisputeResolved(
        string $clientId,
        string $freelancerId,
        string $status,
        string $contractTitle,
        string $refundAmount,
        string $freelancerAmount,
        string $now,
    ): void {
        $fmtRefund     = '$' . number_format((float) $refundAmount, 2);
        $fmtFreelancer = '$' . number_format((float) $freelancerAmount, 2);

        match ($status) {
            'resolved_client' => $this->notifyBothParties(
                $clientId,
                $freelancerId,
                "✅ Dispute resolved in your favor — {$fmtRefund} will be refunded.",
                "❌ Dispute resolved against you — {$fmtRefund} refunded to client for \"{$contractTitle}\".",
                $now,
            ),
            'resolved_freelancer' => $this->notifyBothParties(
                $clientId,
                $freelancerId,
                "Dispute for \"{$contractTitle}\" resolved in freelancer's favor. No refund issued.",
                "✅ Dispute resolved in your favor — your payout of {$fmtFreelancer} has been released.",
                $now,
            ),
            'resolved_split' => $this->notifyBothParties(
                $clientId,
                $freelancerId,
                "⚖️ Dispute resolved — {$fmtRefund} refunded to you. Freelancer receives {$fmtFreelancer}.",
                "⚖️ Dispute resolved — {$fmtRefund} refunded to client. You receive {$fmtFreelancer} for \"{$contractTitle}\".",
                $now,
            ),
            default => null,
        };
    }

    /* ══════════════════════════════════════════════════════════════
     *  Private helpers
     * ══════════════════════════════════════════════════════════════ */

    /**
     * Client wins: full (or specified) refund to client, freelancer gets nothing.
     */
    private function resolveForClient(
        string $contractId,
        string $disputeId,
        array  $contract,
        ?string $resolutionAmount,
        string $heldAmount,
        string $now,
    ): void {
        // Refund amount: explicit value, or the full held amount
        $refundAmount = $resolutionAmount ?? $heldAmount;
        $refundFloat  = (float) $refundAmount;

        if ($refundFloat <= 0) {
            return;
        }

        // 1) Record dispute_refund escrow transaction
        $this->insertEscrowTransaction(
            $contractId, 'dispute_refund', $refundAmount, 'completed', null, $now,
            ['dispute_id' => $disputeId, 'refund_to' => 'client'],
        );

        // 2) Reverse the dispute_hold
        $this->reverseDisputeHold($contractId, $now);

        // 3) Attempt Stripe refund on original payment intents
        $this->processStripeRefund($contractId, $refundFloat, $now);

        // 4) Mark related invoices as refunded
        $this->markInvoicesRefunded($contractId, $now);

        // 5) Notify both parties
        $this->notifyDisputeResolved(
            $contract['client_id'],
            $contract['freelancer_id'],
            'resolved_client',
            $contract['title'],
            $refundAmount,
            '0.00',
            $now,
        );
    }

    /**
     * Freelancer wins: release held funds, freelancer gets full amount.
     */
    private function resolveForFreelancer(
        string $contractId,
        string $disputeId,
        array  $contract,
        string $heldAmount,
        string $now,
    ): void {
        // Reverse the hold — funds become available for payout again
        $this->reverseDisputeHold($contractId, $now);

        // Notify both parties
        $this->notifyDisputeResolved(
            $contract['client_id'],
            $contract['freelancer_id'],
            'resolved_freelancer',
            $contract['title'],
            '0.00',
            $heldAmount,
            $now,
        );
    }

    /**
     * Split: partial refund to client, partial release to freelancer.
     */
    private function resolveForSplit(
        string $contractId,
        string $disputeId,
        array  $contract,
        ?string $resolutionAmount,
        string $heldAmount,
        string $now,
    ): void {
        $refundAmount    = $resolutionAmount ?? '0.00';
        $refundFloat     = (float) $refundAmount;
        $heldFloat       = (float) $heldAmount;
        $freelancerFloat = max(0, $heldFloat - $refundFloat);
        $freelancerAmt   = number_format($freelancerFloat, 2, '.', '');

        // 1) Record dispute_refund for the client's portion
        if ($refundFloat > 0) {
            $this->insertEscrowTransaction(
                $contractId, 'dispute_refund', $refundAmount, 'completed', null, $now,
                ['dispute_id' => $disputeId, 'refund_to' => 'client', 'type' => 'split'],
            );

            // Attempt partial Stripe refund
            $this->processStripeRefund($contractId, $refundFloat, $now);
        }

        // 2) Reverse the dispute_hold
        $this->reverseDisputeHold($contractId, $now);

        // 3) Notify both parties
        $this->notifyDisputeResolved(
            $contract['client_id'],
            $contract['freelancer_id'],
            'resolved_split',
            $contract['title'],
            $refundAmount,
            $freelancerAmt,
            $now,
        );
    }

    /* ── Escrow helpers ── */

    private function getUnreleasedBalance(string $contractId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT
                 COALESCE(SUM(CASE WHEN type = \'fund\' AND status = \'completed\' THEN amount ELSE 0 END), 0) AS funded,
                 COALESCE(SUM(CASE WHEN type = \'release\' AND status = \'completed\' THEN amount ELSE 0 END), 0) AS released,
                 COALESCE(SUM(CASE WHEN type = \'refund\' AND status = \'completed\' THEN amount ELSE 0 END), 0) AS refunded,
                 COALESCE(SUM(CASE WHEN type = \'dispute_refund\' AND status = \'completed\' THEN amount ELSE 0 END), 0) AS dispute_refunded
             FROM "escrowtransaction"
             WHERE contract_id = :cid'
        );
        $stmt->execute(['cid' => $contractId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $balance = (float) $row['funded']
                 - (float) $row['released']
                 - (float) $row['refunded']
                 - (float) $row['dispute_refunded'];

        return number_format(max(0, $balance), 2, '.', '');
    }

    private function getDisputeHeldAmount(string $contractId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT COALESCE(SUM(amount), 0) AS held
             FROM "escrowtransaction"
             WHERE contract_id = :cid AND type = \'dispute_hold\' AND status = \'completed\''
        );
        $stmt->execute(['cid' => $contractId]);

        return $stmt->fetchColumn() ?: '0.00';
    }

    private function reverseDisputeHold(string $contractId, string $now): void
    {
        $this->pdo->prepare(
            'UPDATE "escrowtransaction"
             SET status = \'reversed\', processed_at = :now
             WHERE contract_id = :cid AND type = \'dispute_hold\' AND status = \'completed\''
        )->execute(['now' => $now, 'cid' => $contractId]);
    }

    private function processStripeRefund(string $contractId, float $refundAmount, string $now): void
    {
        // Find the original fund transactions with Stripe payment intents
        $fStmt = $this->pdo->prepare(
            'SELECT gateway_reference, amount
             FROM "escrowtransaction"
             WHERE contract_id = :cid AND type = \'fund\' AND status = \'completed\'
               AND gateway_reference IS NOT NULL
             ORDER BY created_at DESC'
        );
        $fStmt->execute(['cid' => $contractId]);
        $fundTxs = $fStmt->fetchAll(\PDO::FETCH_ASSOC);

        $remaining = $refundAmount;

        foreach ($fundTxs as $tx) {
            if ($remaining <= 0) break;

            $txAmount      = (float) $tx['amount'];
            $refundPortion = min($remaining, $txAmount);
            $refundCents   = (int) round($refundPortion * 100);

            try {
                $this->stripe()->createRefund($tx['gateway_reference'], $refundCents);
                error_log("[DisputePaymentService] Stripe refund: PI={$tx['gateway_reference']} amount={$refundPortion}");
            } catch (\Throwable $e) {
                // Log but don't fail — the escrow record is the source of truth
                error_log("[DisputePaymentService] Stripe refund FAILED for PI={$tx['gateway_reference']}: " . $e->getMessage());
            }

            $remaining -= $refundPortion;
        }
    }

    private function markInvoicesRefunded(string $contractId, string $now): void
    {
        $this->pdo->prepare(
            'UPDATE "invoice" SET status = \'refunded\', updated_at = :now
             WHERE contract_id = :cid AND status IN (\'paid\', \'sent\')'
        )->execute(['now' => $now, 'cid' => $contractId]);
    }

    /* ── Transaction / notification insert helpers ── */

    private function insertEscrowTransaction(
        string  $contractId,
        string  $type,
        string  $amount,
        string  $status,
        ?string $gatewayRef,
        string  $now,
        ?array  $gatewayMetadata = null,
    ): string {
        $id = $this->uuid();
        $this->pdo->prepare(
            'INSERT INTO "escrowtransaction"
                (id, contract_id, type, amount, currency, status,
                 gateway_reference, gateway_metadata, created_at)
             VALUES (:id, :cid, :type, :amt, \'USD\', :status, :ref, :meta, :now)'
        )->execute([
            'id'     => $id,
            'cid'    => $contractId,
            'type'   => $type,
            'amt'    => $amount,
            'status' => $status,
            'ref'    => $gatewayRef,
            'meta'   => $gatewayMetadata ? json_encode($gatewayMetadata) : null,
            'now'    => $now,
        ]);
        return $id;
    }

    private function insertNotification(
        string $userId,
        string $type,
        string $title,
        string $body,
        array  $data,
        string $priority,
        string $now,
    ): void {
        $id = $this->uuid();
        try {
            $this->pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                'id'    => $id,
                'uid'   => $userId,
                'type'  => $type,
                'title' => $title,
                'body'  => $body,
                'data'  => json_encode($data),
                'prio'  => $priority,
                'chan'   => 'in_app',
                'now'   => $now,
            ]);
        } catch (\Throwable $e) {
            error_log("[DisputePaymentService] notification insert: " . $e->getMessage());
        }

        // Real-time push via Redis
        $this->pushSocketNotification($userId, $id, $type, $title, $body, $data, $priority, $now);
    }

    private function notifyBothParties(
        string $clientId,
        string $freelancerId,
        string $clientMsg,
        string $freelancerMsg,
        string $now,
    ): void {
        $this->insertNotification(
            $clientId, 'billing.dispute_resolved', '📋 Dispute Resolved', $clientMsg,
            ['link' => '/dashboard/disputes'], 'high', $now,
        );
        $this->insertNotification(
            $freelancerId, 'billing.dispute_resolved', '📋 Dispute Resolved', $freelancerMsg,
            ['link' => '/dashboard/disputes'], 'high', $now,
        );
    }

    private function pushSocketNotification(
        string $userId, string $notifId, string $type, string $title,
        string $body, array $data, string $priority, string $now,
    ): void {
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id'         => $notifId,
                'type'       => $type,
                'title'      => $title,
                'body'       => $body,
                'data'       => $data,
                'priority'   => $priority,
                'created_at' => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log("[DisputePaymentService] socket push: " . $e->getMessage());
        }
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
