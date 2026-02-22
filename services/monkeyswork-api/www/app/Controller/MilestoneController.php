<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\EscrowFunded;
use App\Event\EscrowReleased;
use App\Event\MilestoneAccepted;
use App\Event\MilestoneSubmitted;
use App\Service\FeeCalculator;
use App\Service\StripeService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/milestones')]
#[Middleware('auth')]
final class MilestoneController
{
    use ApiController;

    private ?StripeService $stripe = null;
    private ?FeeCalculator $fees = null;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {
    }

    private function stripe(): StripeService
    {
        return $this->stripe ??= new StripeService();
    }

    private function fees(): FeeCalculator
    {
        return $this->fees ??= new FeeCalculator();
    }

    #[Route('GET', '/me', name: 'milestones.mine', summary: 'All my milestones across contracts', tags: ['Milestones'])]
    public function mine(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p = $this->pagination($request);
        $qs = $request->getQueryParams();
        $status = $qs['status'] ?? null;

        $where = '(c.client_id = :uid OR c.freelancer_id = :uid)';
        $params = ['uid' => $userId];

        if ($status) {
            $where .= ' AND m.status = :status';
            $params['status'] = $status;
        }

        // Count
        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"milestone\" m JOIN \"contract\" c ON c.id = m.contract_id WHERE {$where}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        // List
        $stmt = $this->db->pdo()->prepare(
            "SELECT m.*,
                    c.title AS contract_title,
                    c.status AS contract_status,
                    c.client_id,
                    c.freelancer_id,
                    u_client.display_name AS client_name,
                    u_free.display_name   AS freelancer_name
             FROM \"milestone\" m
             JOIN \"contract\" c ON c.id = m.contract_id
             JOIN \"user\" u_client ON u_client.id = c.client_id
             JOIN \"user\" u_free   ON u_free.id   = c.freelancer_id
             WHERE {$where}
             ORDER BY
                CASE m.status
                    WHEN 'submitted' THEN 0
                    WHEN 'revision_requested' THEN 1
                    WHEN 'in_progress' THEN 2
                    WHEN 'pending' THEN 3
                    WHEN 'accepted' THEN 4
                END,
                m.sort_order ASC, m.created_at DESC
             LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue('uid', $userId);
        if ($status)
            $stmt->bindValue('status', $status);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        $milestones = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Summary stats
        $statsStmt = $this->db->pdo()->prepare(
            "SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE m.status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE m.status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE m.status = 'submitted') AS submitted,
                COUNT(*) FILTER (WHERE m.status = 'accepted') AS accepted,
                COUNT(*) FILTER (WHERE m.status = 'revision_requested') AS revision_requested,
                COALESCE(SUM(m.amount), 0) AS total_amount,
                COALESCE(SUM(m.amount) FILTER (WHERE m.escrow_funded = true), 0) AS funded_amount,
                COALESCE(SUM(m.amount) FILTER (WHERE m.escrow_released = true), 0) AS released_amount
             FROM \"milestone\" m
             JOIN \"contract\" c ON c.id = m.contract_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid"
        );
        $statsStmt->execute(['uid' => $userId]);
        $stats = $statsStmt->fetch(\PDO::FETCH_ASSOC);

        return $this->json([
            'data' => $milestones,
            'meta' => [
                'current_page' => $p['page'],
                'per_page' => $p['perPage'],
                'total' => $total,
                'last_page' => (int) ceil($total / max($p['perPage'], 1)),
            ],
            'summary' => $stats,
        ]);
    }

    #[Route('GET', '/{id}', name: 'milestones.show', summary: 'Milestone detail', tags: ['Milestones'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        return $this->json(['data' => $ms]);
    }

    #[Route('PATCH', '/{id}', name: 'milestones.update', summary: 'Edit milestone', tags: ['Milestones'])]
    public function update(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        $allowed = ['title', 'description', 'amount', 'due_date', 'sort_order'];
        $sets = [];
        $params = ['id' => $id];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $sets[] = "\"{$f}\" = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        $sets[] = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare('UPDATE "milestone" SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);

        return $this->json(['message' => 'Milestone updated']);
    }

    #[Route('POST', '/{id}/fund', name: 'milestones.fund', summary: 'Fund escrow via Stripe', tags: ['Milestones'])]
    public function fund(ServerRequestInterface $request, string $id): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $ms = $this->findOrFail($id, $userId);

            if ($ms instanceof JsonResponse) {
                return $ms;
            }

            if ($ms['client_id'] !== $userId) {
                return $this->forbidden('Only the client can fund milestones');
            }

            if ($ms['escrow_funded']) {
                return $this->error('Milestone is already funded', 409);
            }

            $pdo = $this->db->pdo();
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            // Calculate fees
            $amount = (string) $ms['amount'];
            $clientFee = $this->fees()->calculateClientFee($amount);
            $totalCharge = $this->fees()->totalClientCharge($amount);
            $amountCents = $this->fees()->toCents($totalCharge);

            // Get ALL verified payment methods (try default first, then fallback)
            $pmStmt = $pdo->prepare(
                'SELECT stripe_payment_method_id, type FROM "paymentmethod"
                 WHERE user_id = :uid AND is_active = true AND verified = true
                   AND stripe_payment_method_id IS NOT NULL
                 ORDER BY is_default DESC, created_at DESC'
            );
            $pmStmt->execute(['uid' => $userId]);
            $paymentMethods = $pmStmt->fetchAll(\PDO::FETCH_ASSOC);

            if (empty($paymentMethods)) {
                return $this->error('No verified payment method on file. Please add a card or verify your bank account.', 400);
            }

            // Get Stripe customer ID
            $custStmt = $pdo->prepare('SELECT stripe_customer_id, email, first_name, last_name FROM "user" WHERE id = :uid');
            $custStmt->execute(['uid' => $userId]);
            $user = $custStmt->fetch(\PDO::FETCH_ASSOC);

            $customerId = $this->stripe()->getOrCreateCustomer(
                $userId,
                $user['email'],
                trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')),
                $pdo
            );

            // Try each PM until one succeeds
            $pi = null;
            $lastError = '';

            foreach ($paymentMethods as $pmRow) {
                $stripePm = $pmRow['stripe_payment_method_id'];
                $pmType = $pmRow['type'] ?? 'card';

                // Ensure PM is attached to customer
                try {
                    $pmObj = $this->stripe()->retrievePaymentMethod($stripePm);
                    if (!$pmObj->customer) {
                        $this->stripe()->attachPaymentMethod($stripePm, $customerId);
                    }
                } catch (\Throwable $e) {
                    error_log("[MilestoneController] PM attach skip ({$stripePm}): " . $e->getMessage());
                    continue; // Try next PM
                }

                // Attempt charge
                try {
                    $pi = $this->stripe()->getClient()->paymentIntents->create([
                        'amount' => $amountCents,
                        'currency' => 'usd',
                        'customer' => $customerId,
                        'payment_method' => $stripePm,
                        'payment_method_types' => [$pmType],
                        'off_session' => true,
                        'confirm' => true,
                        'metadata' => [
                            'mw_type' => 'milestone_fund',
                            'mw_milestone' => $id,
                            'mw_contract' => $ms['contract_id'],
                        ],
                    ]);
                    break; // Payment succeeded
                } catch (\Throwable $e) {
                    $lastError = $e->getMessage();
                    error_log("[MilestoneController] Stripe charge failed with PM {$stripePm}: {$lastError}");
                    $pi = null;
                }
            }

            if (!$pi) {
                return $this->error('Payment failed with all methods: ' . $lastError, 402);
            }

            $txId = $this->uuid();
            $pdo->beginTransaction();
            try {
                // Update milestone
                $pdo->prepare(
                    'UPDATE "milestone" SET escrow_funded = true, status = \'in_progress\', updated_at = :now WHERE id = :id'
                )->execute(['now' => $now, 'id' => $id]);

                // Escrow fund transaction
                $pdo->prepare(
                    'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, gateway_reference, processed_at, created_at)
                 VALUES (:id, :cid, :mid, \'fund\', :amt, \'USD\', \'completed\', :ref, :now, :now)'
                )->execute([
                            'id' => $txId,
                            'cid' => $ms['contract_id'],
                            'mid' => $id,
                            'amt' => $amount,
                            'ref' => $pi->id,
                            'now' => $now,
                        ]);

                // Client fee transaction
                $pdo->prepare(
                    'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, gateway_reference, processed_at, created_at)
                 VALUES (:id, :cid, :mid, \'client_fee\', :amt, \'USD\', \'completed\', :ref, :now, :now)'
                )->execute([
                            'id' => $this->uuid(),
                            'cid' => $ms['contract_id'],
                            'mid' => $id,
                            'amt' => $clientFee,
                            'ref' => $pi->id,
                            'now' => $now,
                        ]);

                // Auto-generate invoice
                $invId = $this->uuid();
                $invNum = 'INV-' . strtoupper(substr($invId, 0, 8));
                $total = $totalCharge;
                $pdo->prepare(
                    'INSERT INTO "invoice" (id, contract_id, invoice_number, subtotal, platform_fee, tax_amount, total, currency, status, issued_at, due_at, notes, created_at, updated_at)
                 VALUES (:id, :cid, :num, :sub, :fee, \'0.00\', :total, \'USD\', \'paid\', :now, :now, :notes, :now, :now)'
                )->execute([
                            'id' => $invId,
                            'cid' => $ms['contract_id'],
                            'num' => $invNum,
                            'sub' => $amount,
                            'fee' => $clientFee,
                            'total' => $total,
                            'now' => $now,
                            'notes' => 'Milestone escrow: ' . ($ms['title'] ?? $id),
                        ]);

                $pdo->commit();
            } catch (\Throwable $e) {
                $pdo->rollBack();
                error_log('[MilestoneController] fund DB error: ' . $e->getMessage());
                error_log('[MilestoneController] fund DB error file: ' . $e->getFile() . ':' . $e->getLine());
                error_log('[MilestoneController] fund DB error trace: ' . $e->getTraceAsString());
                error_log('[MilestoneController] fund DB error data: milestone_id=' . $id . ' contract_id=' . ($ms['contract_id'] ?? 'NULL') . ' amount=' . $amount . ' pi=' . ($pi->id ?? 'NULL'));
                return $this->error('Payment succeeded but recording failed: ' . $e->getMessage(), 500);
            }

            $this->events?->dispatch(new EscrowFunded($txId, $id, $ms['contract_id'], $amount));

            return $this->json([
                'message' => 'Milestone funded',
                'data' => [
                    'transaction_id' => $txId,
                    'charged' => $totalCharge,
                    'client_fee' => $clientFee,
                    'stripe_pi' => $pi->id,
                ],
            ]);
        } catch (\Throwable $ex) {
            error_log('[MilestoneController] fund ERROR: ' . $ex->getMessage() . ' in ' . $ex->getFile() . ':' . $ex->getLine());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    #[Route('POST', '/{id}/submit', name: 'milestones.submit', summary: 'Submit work', tags: ['Milestones'])]
    public function submit(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can submit work');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "milestone" SET status = \'submitted\', submitted_at = :now, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        // Dispatch event
        $this->events?->dispatch(new MilestoneSubmitted($id, $ms['contract_id'], $userId));

        return $this->json(['message' => 'Work submitted for review']);
    }

    #[Route('POST', '/{id}/accept', name: 'milestones.accept', summary: 'Accept + release with commission', tags: ['Milestones'])]
    public function accept(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['client_id'] !== $userId) {
            return $this->forbidden('Only the client can accept');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo = $this->db->pdo();
        $amount = (string) $ms['amount'];

        // Calculate tiered freelancer commission
        $feeInfo = $this->fees()->calculateFreelancerCommission(
            $amount,
            $ms['client_id'],
            $ms['freelancer_id'],
            $pdo
        );
        $commission = $feeInfo['commission'];
        $netRelease = number_format((float) $amount - (float) $commission, 2, '.', '');

        $pdo->beginTransaction();
        try {
            // Update milestone status
            $pdo->prepare(
                'UPDATE "milestone" SET status = \'accepted\', escrow_released = true, accepted_at = :now, updated_at = :now WHERE id = :id'
            )->execute(['now' => $now, 'id' => $id]);

            // Release to freelancer (net of commission)
            $txId = $this->uuid();
            $pdo->prepare(
                'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, processed_at, created_at)
                 VALUES (:id, :cid, :mid, \'release\', :amt, \'USD\', \'completed\', :now, :now)'
            )->execute([
                        'id' => $txId,
                        'cid' => $ms['contract_id'],
                        'mid' => $id,
                        'amt' => $netRelease,
                        'now' => $now,
                    ]);

            // Platform commission transaction
            $pdo->prepare(
                'INSERT INTO "escrowtransaction" (id, contract_id, milestone_id, type, amount, currency, status, processed_at, created_at)
                 VALUES (:id, :cid, :mid, \'platform_fee\', :amt, \'USD\', \'completed\', :now, :now)'
            )->execute([
                        'id' => $this->uuid(),
                        'cid' => $ms['contract_id'],
                        'mid' => $id,
                        'amt' => $commission,
                        'now' => $now,
                    ]);

            // Update cumulative billing for tiered commission
            $this->fees()->updateCumulativeBilling($amount, $ms['client_id'], $ms['freelancer_id'], $pdo);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[MilestoneController] accept error: ' . $e->getMessage());
            return $this->error('Failed to accept milestone', 500);
        }

        $this->events?->dispatch(new MilestoneAccepted($id, $ms['contract_id'], $userId, $amount));
        $this->events?->dispatch(new EscrowReleased($txId, $id, $ms['contract_id'], $netRelease));

        return $this->json([
            'message' => 'Milestone accepted, escrow released',
            'data' => [
                'released' => $netRelease,
                'commission' => $commission,
                'commission_rate' => $feeInfo['rate_used'],
            ],
        ]);
    }

    #[Route('POST', '/{id}/request-revision', name: 'milestones.revision', summary: 'Request revision', tags: ['Milestones'])]
    public function requestRevision(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        if ($ms['client_id'] !== $userId) {
            return $this->forbidden();
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "milestone" SET status = \'revision_requested\',
                    revision_count = revision_count + 1, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Revision requested']);
    }

    #[Route('POST', '/{id}/deliverables', name: 'milestones.deliverables.upload', summary: 'Upload file', tags: ['Milestones'])]
    public function uploadDeliverable(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $ms = $this->findOrFail($id, $userId);

        if ($ms instanceof JsonResponse) {
            return $ms;
        }

        $data = $this->body($request);
        $dId = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "deliverable" (id, milestone_id, uploaded_by, filename, url, file_size,
                                        mime_type, description, version, created_at)
             VALUES (:id, :mid, :uid, :fn, :url, :fs, :mt, :desc, :ver, :now)'
        )->execute([
                    'id' => $dId,
                    'mid' => $id,
                    'uid' => $userId,
                    'fn' => $data['filename'] ?? 'file',
                    'url' => $data['url'] ?? '',
                    'fs' => $data['file_size'] ?? 0,
                    'mt' => $data['mime_type'] ?? 'application/octet-stream',
                    'desc' => $data['description'] ?? null,
                    'ver' => $data['version'] ?? 1,
                    'now' => $now,
                ]);

        return $this->created(['data' => ['id' => $dId]]);
    }

    #[Route('GET', '/{id}/deliverables', name: 'milestones.deliverables', summary: 'List deliverables', tags: ['Milestones'])]
    public function deliverables(ServerRequestInterface $request, string $id): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $ms = $this->findOrFail($id, $userId);

            if ($ms instanceof JsonResponse) {
                return $ms;
            }

            $stmt = $this->db->pdo()->prepare(
                'SELECT d.*
                 FROM "deliverable" d
                 WHERE d.milestone_id = :mid ORDER BY d.version DESC, d.created_at DESC'
            );
            $stmt->execute(['mid' => $id]);

            return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
        } catch (\Throwable $ex) {
            error_log('[MilestoneController] deliverables ERROR: ' . $ex->getMessage() . ' in ' . $ex->getFile() . ':' . $ex->getLine());
            return $this->json(['error' => true, 'message' => $ex->getMessage()], 500);
        }
    }

    /* ---- helpers ---- */

    private function findOrFail(string $id, ?string $userId): array|JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT m.*, c.client_id, c.freelancer_id
             FROM "milestone" m JOIN "contract" c ON c.id = m.contract_id
             WHERE m.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $ms = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$ms) {
            return $this->notFound('Milestone');
        }
        if ($ms['client_id'] !== $userId && $ms['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $ms;
    }

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