<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/escrow')]
#[Middleware('auth')]
final class EscrowController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '/balance', name: 'escrow.balance', summary: 'My escrow balance', tags: ['Escrow'])]
    public function balance(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        // Total funded minus released/refunded for contracts involving this user
        $stmt = $this->db->pdo()->prepare(
            'SELECT
                 COALESCE(SUM(CASE WHEN et.type = \'fund\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_funded,
                 COALESCE(SUM(CASE WHEN et.type = \'release\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_released,
                 COALESCE(SUM(CASE WHEN et.type = \'refund\' AND et.status = \'completed\' THEN et.amount ELSE 0 END), 0) AS total_refunded
             FROM "escrowtransaction" et
             JOIN "contract" c ON c.id = et.contract_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid'
        );
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $balance = ($row['total_funded'] ?? 0) - ($row['total_released'] ?? 0) - ($row['total_refunded'] ?? 0);

        return $this->json(['data' => array_merge($row, ['balance' => $balance])]);
    }

    #[Route('GET', '/transactions', name: 'escrow.transactions', summary: 'My transactions', tags: ['Escrow'])]
    public function transactions(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "escrowtransaction" et
             JOIN "contract" c ON c.id = et.contract_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid'
        );
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT et.*, j.title AS job_title
             FROM "escrowtransaction" et
             JOIN "contract" c ON c.id = et.contract_id
             JOIN "job" j ON j.id = c.job_id
             WHERE c.client_id = :uid OR c.freelancer_id = :uid
             ORDER BY et.created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/transactions/{id}', name: 'escrow.show', summary: 'Transaction detail', tags: ['Escrow'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT et.*, c.client_id, c.freelancer_id, j.title AS job_title
             FROM "escrowtransaction" et
             JOIN "contract" c ON c.id = et.contract_id
             JOIN "job" j ON j.id = c.job_id
             WHERE et.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $tx = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$tx) {
            return $this->notFound('Transaction');
        }
        if ($tx['client_id'] !== $userId && $tx['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $this->json(['data' => $tx]);
    }
}
