<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\PubSubPublisher;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/verifications')]
#[Middleware('auth')]
final class VerificationController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private ?PubSubPublisher $pubsub = null,
    ) {}

    #[Route('POST', '', name: 'verif.create', summary: 'Submit verification', tags: ['Verification'])]
    public function submit(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        if (empty($data['type'])) {
            return $this->error('Verification type is required');
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "verification" (id, user_id, type, status, document_urls, metadata,
                                         submitted_at, created_at, updated_at)
             VALUES (:id, :uid, :type, \'pending\', :docs, :meta, :now, :now, :now)'
        )->execute([
            'id'   => $id,
            'uid'  => $userId,
            'type' => $data['type'],
            'docs' => json_encode($data['document_urls'] ?? []),
            'meta' => json_encode($data['metadata'] ?? []),
            'now'  => $now,
        ]);

        // Publish to Pub/Sub (triggers verification-automation service)
        $pubsub = $this->pubsub ?? new PubSubPublisher();
        try {
            $pubsub->verificationSubmitted($id, $userId, $data['type']);
        } catch (\Throwable) {
            // Non-critical: don't fail submission if Pub/Sub is down
        }

        return $this->created(['data' => ['id' => $id]]);
    }

    #[Route('GET', '', name: 'verif.index', summary: 'My verifications', tags: ['Verification'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, type, status, submitted_at, reviewed_at, expires_at, created_at
             FROM "verification" WHERE user_id = :uid ORDER BY created_at DESC'
        );
        $stmt->execute(['uid' => $userId]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('GET', '/{id}', name: 'verif.show', summary: 'Verification detail', tags: ['Verification'])]
    public function show(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "verification" WHERE id = :id AND user_id = :uid'
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        $v = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$v) {
            return $this->notFound('Verification');
        }

        return $this->json(['data' => $v]);
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
