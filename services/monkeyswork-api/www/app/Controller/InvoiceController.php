<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/invoices')]
#[Middleware('auth')]
final class InvoiceController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'invoices.index', summary: 'My invoices', tags: ['Invoices'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "invoice" i
             JOIN "contract" c ON c.id = i.contract_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid'
        );
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT i.*, j.title AS job_title
             FROM "invoice" i
             JOIN "contract" c ON c.id = i.contract_id
             JOIN "job" j ON j.id = c.job_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid
             ORDER BY i.created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('POST', '', name: 'invoices.create', summary: 'Create invoice', tags: ['Invoices'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['contract_id'])) {
            return $this->error('contract_id is required');
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "invoice" (id, contract_id, invoice_number, amount, tax_amount,
                                    total_amount, currency, status, due_date, notes,
                                    created_at, updated_at)
             VALUES (:id, :cid, :num, :amt, :tax, :total, :cur, \'draft\', :due, :notes, :now, :now)'
        )->execute([
            'id'    => $id,
            'cid'   => $data['contract_id'],
            'num'   => $data['invoice_number'] ?? 'INV-' . strtoupper(substr($id, 0, 8)),
            'amt'   => $data['amount'] ?? 0,
            'tax'   => $data['tax_amount'] ?? 0,
            'total' => $data['total_amount'] ?? $data['amount'] ?? 0,
            'cur'   => $data['currency'] ?? 'USD',
            'due'   => $data['due_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'now'   => $now,
        ]);

        // Add line items
        if (!empty($data['lines'])) {
            $ins = $this->db->pdo()->prepare(
                'INSERT INTO "invoiceline" (id, invoice_id, description, quantity, unit_price, amount, sort_order)
                 VALUES (:id, :iid, :desc, :qty, :up, :amt, :so)'
            );
            foreach ($data['lines'] as $i => $line) {
                $ins->execute([
                    'id'   => $this->uuid(),
                    'iid'  => $id,
                    'desc' => $line['description'] ?? '',
                    'qty'  => $line['quantity'] ?? 1,
                    'up'   => $line['unit_price'] ?? 0,
                    'amt'  => $line['amount'] ?? 0,
                    'so'   => $i,
                ]);
            }
        }

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/{id}', name: 'invoices.show', summary: 'Invoice detail', tags: ['Invoices'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM "invoice" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $invoice = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$invoice) {
            return $this->notFound('Invoice');
        }

        $lines = $this->db->pdo()->prepare(
            'SELECT * FROM "invoiceline" WHERE invoice_id = :iid ORDER BY sort_order ASC'
        );
        $lines->execute(['iid' => $id]);
        $invoice['lines'] = $lines->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $invoice]);
    }

    #[Route('POST', '/{id}/send', name: 'invoices.send', summary: 'Send to client', tags: ['Invoices'])]
    public function send(ServerRequestInterface $request, string $id): JsonResponse
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "invoice" SET status = \'sent\', sent_at = :now, updated_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        // TODO: send email notification
        return $this->json(['message' => 'Invoice sent']);
    }

    #[Route('GET', '/{id}/pdf', name: 'invoices.pdf', summary: 'Download PDF', tags: ['Invoices'])]
    public function pdf(ServerRequestInterface $request, string $id): JsonResponse
    {
        // TODO: generate PDF
        return $this->json(['message' => 'PDF generation pending implementation']);
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
