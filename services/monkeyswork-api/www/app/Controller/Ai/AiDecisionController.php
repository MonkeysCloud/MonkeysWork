<?php
declare(strict_types=1);

namespace App\Controller\Ai;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/ai/decisions')]
#[Middleware('auth')]
final class AiDecisionController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db) {}

    #[Route('GET', '', name: 'ai.decisions', summary: 'Decision log', tags: ['AI'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $p = $this->pagination($request);
        $q = $request->getQueryParams();

        $where  = ['1=1'];
        $params = [];

        if (!empty($q['service'])) {
            $where[]           = 'ai_service = :svc';
            $params['svc']     = $q['service'];
        }
        if (!empty($q['entity_type'])) {
            $where[]           = 'entity_type = :et';
            $params['et']      = $q['entity_type'];
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->pdo()->prepare("SELECT COUNT(*) FROM \"aidecisionlog\" WHERE {$w}");
        $cnt->execute($params);
        $total = (int) $cnt->fetchColumn();

        $stmt = $this->db->pdo()->prepare(
            "SELECT * FROM \"aidecisionlog\" WHERE {$w} ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('lim', $p['perPage'], \PDO::PARAM_INT);
        $stmt->bindValue('off', $p['offset'], \PDO::PARAM_INT);
        $stmt->execute();

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/{id}', name: 'ai.decisions.show', summary: 'Decision detail', tags: ['AI'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM "aidecisionlog" WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) {
            return $this->notFound('AI Decision');
        }

        return $this->json(['data' => $row]);
    }

    #[Route('POST', '/{id}/override', name: 'ai.override', summary: 'Human override', tags: ['AI'])]
    public function override(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "aidecisionlog" SET human_override = true, override_by = :uid,
                    override_reason = :reason, override_at = :now, updated_at = :now
             WHERE id = :id'
        );
        $stmt->execute([
            'uid'    => $userId,
            'reason' => $data['reason'] ?? null,
            'now'    => $now,
            'id'     => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('AI Decision');
        }

        return $this->json(['message' => 'Decision overridden']);
    }
}
