<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/payouts')]
#[Middleware('auth')]
final class PayoutController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'payouts.index', summary: 'My payouts', tags: ['Payouts'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $p      = $this->pagination($request);

        $cnt = $this->db->pdo()->prepare('SELECT COUNT(*) FROM "payout" WHERE freelancer_id = :uid');
        $cnt->execute(['uid' => $userId]);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "payout" WHERE freelancer_id = :uid ORDER BY created_at DESC LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('POST', '/request', name: 'payouts.request', summary: 'Request payout', tags: ['Payouts'])]
    public function request(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['amount'])) {
            return $this->error('Amount is required');
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "payout" (id, freelancer_id, amount, currency, payment_method_id,
                                   status, created_at, updated_at)
             VALUES (:id, :uid, :amt, :cur, :pmid, \'pending\', :now, :now)'
        )->execute([
            'id'   => $id,
            'uid'  => $userId,
            'amt'  => $data['amount'],
            'cur'  => $data['currency'] ?? 'USD',
            'pmid' => $data['payment_method_id'] ?? null,
            'now'  => $now,
        ]);

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '/{id}', name: 'payouts.show', summary: 'Payout detail', tags: ['Payouts'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "payout" WHERE id = :id AND freelancer_id = :uid'
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        $payout = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$payout) {
            return $this->notFound('Payout');
        }

        return $this->json(['data' => $payout]);
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
