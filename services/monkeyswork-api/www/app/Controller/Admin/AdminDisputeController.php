<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\ApiController;
use App\Event\DisputeResolved;
use App\Service\DisputePaymentService;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/admin/disputes')]
#[Middleware(['auth', 'role:admin,ops'])]
final class AdminDisputeController
{
    use ApiController;

    private ?DisputePaymentService $disputePayments = null;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {
    }

    private function disputePayments(): DisputePaymentService
    {
        return $this->disputePayments ??= new DisputePaymentService($this->db->pdo());
    }

    /* ── List all disputes ────────────────────────────── */

    #[Route('GET', '', name: 'admin.disputes', summary: 'All disputes', tags: ['Admin'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where = ['1=1'];
        $params = [];

        if (!empty($q['status'])) {
            $where[] = 'd.status = :status';
            $params['status'] = $q['status'];
        }

        if (!empty($q['reason'])) {
            $where[] = 'd.reason = :reason';
            $params['reason'] = $q['reason'];
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"dispute\" d WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT d.*, j.title AS job_title, uc.display_name AS client_name,
                    uf.display_name AS freelancer_name, c.total_amount, c.currency,
                    (SELECT COUNT(*) FROM \"disputemessage\" dm WHERE dm.dispute_id = d.id) AS message_count
             FROM \"dispute\" d
             JOIN \"contract\" c ON c.id = d.contract_id
             JOIN \"job\" j ON j.id = c.job_id
             JOIN \"user\" uc ON uc.id = c.client_id
             JOIN \"user\" uf ON uf.id = c.freelancer_id
             WHERE {$w} ORDER BY d.created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    /* ── Show dispute detail ──────────────────────────── */

    #[Route('GET', '/{id}', name: 'admin.disputes.show', summary: 'Dispute detail', tags: ['Admin'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT d.*, j.title AS job_title,
                    c.client_id, c.freelancer_id, c.total_amount, c.currency, c.contract_type,
                    uc.display_name AS client_name, uc.email AS client_email,
                    uf.display_name AS freelancer_name, uf.email AS freelancer_email,
                    ub.display_name AS filed_by_name,
                    (SELECT COUNT(*) FROM "disputemessage" dm WHERE dm.dispute_id = d.id) AS message_count
             FROM "dispute" d
             JOIN "contract" c ON c.id = d.contract_id
             JOIN "job" j ON j.id = c.job_id
             JOIN "user" uc ON uc.id = c.client_id
             JOIN "user" uf ON uf.id = c.freelancer_id
             JOIN "user" ub ON ub.id = d.raised_by_id
             WHERE d.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $dispute = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        // Parse evidence_urls JSON
        if (is_string($dispute['evidence_urls'] ?? null)) {
            $dispute['evidence_urls'] = json_decode($dispute['evidence_urls'], true) ?: [];
        }

        // Fetch all messages (including internal admin notes)
        $mStmt = $this->db->pdo()->prepare(
            'SELECT dm.*, u.display_name AS sender_name
             FROM "disputemessage" dm JOIN "user" u ON u.id = dm.sender_id
             WHERE dm.dispute_id = :did ORDER BY dm.created_at ASC'
        );
        $mStmt->execute(['did' => $id]);
        $messages = $mStmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($messages as &$m) {
            if (is_string($m['attachments'] ?? null)) {
                $m['attachments'] = json_decode($m['attachments'], true) ?: [];
            }
        }

        $dispute['messages'] = $messages;

        return $this->json(['data' => $dispute]);
    }

    /* ── Get messages for a dispute ───────────────────── */

    #[Route('GET', '/{id}/messages', name: 'admin.disputes.messages', summary: 'Dispute messages', tags: ['Admin'])]
    public function messages(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT dm.*, u.display_name AS sender_name
             FROM "disputemessage" dm JOIN "user" u ON u.id = dm.sender_id
             WHERE dm.dispute_id = :did ORDER BY dm.created_at ASC'
        );
        $stmt->execute(['did' => $id]);
        $msgs = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($msgs as &$m) {
            if (is_string($m['attachments'] ?? null)) {
                $m['attachments'] = json_decode($m['attachments'], true) ?: [];
            }
        }

        return $this->json(['data' => $msgs]);
    }

    /* ── Add internal admin note ──────────────────────── */

    #[Route('POST', '/{id}/messages', name: 'admin.disputes.addNote', summary: 'Admin note', tags: ['Admin'])]
    public function addNote(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $msgId = $this->uuid();

        $this->db->pdo()->prepare(
            'INSERT INTO "disputemessage" (id, dispute_id, sender_id, body, attachments, is_internal, created_at)
             VALUES (:id, :did, :uid, :body, :atts, :internal, :now)'
        )->execute([
                    'id' => $msgId,
                    'did' => $id,
                    'uid' => $userId,
                    'body' => $data['body'] ?? '',
                    'atts' => json_encode($data['attachments'] ?? []),
                    'internal' => $data['is_internal'] ?? true ? 'true' : 'false',
                    'now' => $now,
                ]);

        return $this->created(['data' => ['id' => $msgId]]);
    }

    /* ── Resolve dispute ──────────────────────────────── */

    #[Route('POST', '/{id}/resolve', name: 'admin.disputes.resolve', summary: 'Admin resolve', tags: ['Admin'])]
    public function resolve(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Fetch dispute
        $dStmt = $this->db->pdo()->prepare('SELECT contract_id, status FROM "dispute" WHERE id = :id');
        $dStmt->execute(['id' => $id]);
        $dispute = $dStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$dispute) {
            return $this->notFound('Dispute');
        }

        $status = $data['status'] ?? 'resolved_split';
        $validStatuses = ['resolved_client', 'resolved_freelancer', 'resolved_split'];
        if (!in_array($status, $validStatuses)) {
            return $this->error('Status must be one of: ' . implode(', ', $validStatuses), 422);
        }

        $this->db->pdo()->prepare(
            'UPDATE "dispute" SET status = :status, resolution_notes = :notes, resolution_amount = :amount,
                    resolved_by_id = :uid, resolved_at = :now, response_deadline = NULL,
                    awaiting_response_from_id = NULL, updated_at = :now2 WHERE id = :id'
        )->execute([
                    'status' => $status,
                    'notes' => $data['resolution_notes'] ?? null,
                    'amount' => $data['resolution_amount'] ?? null,
                    'uid' => $userId,
                    'now' => $now,
                    'now2' => $now,
                    'id' => $id,
                ]);

        // Process financial effects of the resolution
        $this->disputePayments()->resolvePayment(
            $id,
            $dispute['contract_id'],
            $status,
            $data['resolution_amount'] ?? null,
        );

        // Dispatch event
        $this->events?->dispatch(new DisputeResolved(
            $id,
            $dispute['contract_id'],
            $status,
            $userId
        ));

        return $this->json(['message' => 'Dispute resolved']);
    }

    /* ── Dispute report ───────────────────────────────── */

    #[Route('GET', '/report', name: 'admin.disputes.report', summary: 'Dispute stats over time', tags: ['Admin'])]
    public function report(ServerRequestInterface $request): JsonResponse
    {
        $pdo = $this->db->pdo();
        $q = $request->getQueryParams();
        $period = $q['period'] ?? 'month';
        $group = $q['group'] ?? 'day';

        $dateFilter = $this->dateFilter($period);

        $groupExpr = match ($group) {
            'week' => "to_char(date_trunc('week', d.created_at), 'YYYY-\"W\"IW')",
            'month' => "to_char(d.created_at, 'YYYY-MM')",
            default => "to_char(d.created_at, 'YYYY-MM-DD')",
        };

        $stmt = $pdo->prepare(
            "SELECT $groupExpr AS period_label,
                    COUNT(*) AS total_opened,
                    COUNT(*) FILTER (WHERE d.status IN ('resolved_client','resolved_freelancer','resolved_split')) AS total_resolved,
                    COUNT(*) FILTER (WHERE d.status = 'open') AS still_open,
                    COUNT(*) FILTER (WHERE d.status = 'escalated') AS escalated,
                    COALESCE(SUM(d.dispute_amount), 0) AS total_disputed_amount,
                    COALESCE(SUM(d.resolution_amount), 0) AS total_resolved_amount
             FROM \"dispute\" d
             WHERE 1=1 $dateFilter
             GROUP BY $groupExpr
             ORDER BY $groupExpr ASC"
        );
        $stmt->execute();

        $totals = $pdo->prepare(
            "SELECT
                COUNT(*) AS total_disputes,
                COUNT(*) FILTER (WHERE status = 'open') AS open,
                COUNT(*) FILTER (WHERE status = 'escalated') AS escalated,
                COUNT(*) FILTER (WHERE status IN ('resolved_client','resolved_freelancer','resolved_split')) AS resolved,
                COALESCE(SUM(dispute_amount), 0) AS total_disputed,
                COALESCE(SUM(resolution_amount), 0) AS total_resolved_amount,
                COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400), 0) AS avg_resolution_days
             FROM \"dispute\" WHERE 1=1 " . $this->dateFilter($period)
        );
        $totals->execute();

        return $this->json([
            'data' => [
                'period' => $period,
                'group' => $group,
                'summary' => $totals->fetch(\PDO::FETCH_ASSOC),
                'items' => $stmt->fetchAll(\PDO::FETCH_ASSOC),
            ]
        ]);
    }

    /* ── Helpers ──────────────────────────────────────── */

    private function dateFilter(string $period): string
    {
        return match ($period) {
            'week' => " AND d.created_at >= NOW() - INTERVAL '7 days'",
            'month' => " AND d.created_at >= NOW() - INTERVAL '1 month'",
            'quarter' => " AND d.created_at >= NOW() - INTERVAL '3 months'",
            'year' => " AND d.created_at >= NOW() - INTERVAL '1 year'",
            default => '',
        };
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
