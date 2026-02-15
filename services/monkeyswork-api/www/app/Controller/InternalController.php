<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Internal callback endpoints for AI microservices.
 * These are NOT exposed publicly — in production they live behind
 * an internal-only Ingress / service mesh policy.
 *
 * No JWT middleware — AI services authenticate via a shared internal token
 * passed in the X-Internal-Token header.
 */
#[RoutePrefix('/api/v1/internal')]
final class InternalController
{
    use ApiController;

    private const INTERNAL_TOKEN_ENV = 'INTERNAL_API_TOKEN';

    public function __construct(private ConnectionInterface $db) {}

    /* ------------------------------------------------------------------ */
    /*  Auth helper — validates X-Internal-Token header                     */
    /* ------------------------------------------------------------------ */
    private function authorizeInternal(ServerRequestInterface $request): ?JsonResponse
    {
        $expected = getenv(self::INTERNAL_TOKEN_ENV) ?: 'dev-internal-token';
        $provided = $request->getHeaderLine('X-Internal-Token');

        if ($provided !== $expected) {
            return $this->error('Unauthorized', 401);
        }
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  POST /internal/verifications — AI creates a verification           */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/verifications', name: 'internal.verif.create', summary: 'AI creates verification', tags: ['Internal'])]
    public function createVerification(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $id   = $this->uuid();
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "verification" (id, user_id, type, status, data, ai_model_version,
                                         ai_confidence, created_at, updated_at)
             VALUES (:id, :uid, :type, :status, :data, :model, :conf, :now, :now)'
        )->execute([
            'id'     => $id,
            'uid'    => $data['user_id'],
            'type'   => $data['type'] ?? 'identity',
            'status' => $data['status'] ?? 'pending',
            'data'   => json_encode($data['data'] ?? []),
            'model'  => $data['model_version'] ?? null,
            'conf'   => $data['confidence_score'] ?? null,
            'now'    => $now,
        ]);

        return $this->created(['data' => ['id' => $id]]);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /internal/verifications/{id} — AI updates verification       */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/verifications/{id}', name: 'internal.verif.update', summary: 'AI updates verification', tags: ['Internal'])]
    public function updateVerification(ServerRequestInterface $request, string $id): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $sets   = ['"updated_at" = :now'];
        $params = ['id' => $id, 'now' => $now];

        $map = [
            'status'           => 'status',
            'ai_confidence'    => 'confidence_score',
            'ai_model_version' => 'model_version',
            'ai_result'        => 'ai_result',
            'reviewed_at'      => 'reviewed_at',
        ];

        foreach ($map as $col => $key) {
            if (array_key_exists($key, $data)) {
                $val = is_array($data[$key]) ? json_encode($data[$key]) : $data[$key];
                $sets[]       = "\"{$col}\" = :{$col}";
                $params[$col] = $val;
            }
        }

        $sql = 'UPDATE "verification" SET ' . implode(', ', $sets) . ' WHERE id = :id';
        $stmt = $this->db->pdo()->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Verification');
        }

        // If approved, recompute freelancer verification_level based on total approved verifications
        if (in_array($data['status'] ?? '', ['approved', 'auto_approved'])) {
            $this->recomputeVerificationLevel($id, $now);
        }

        return $this->json(['message' => 'Verification updated']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /internal/fraud/baseline — AI stores initial fraud profile     */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/fraud/baseline', name: 'internal.fraud.baseline', summary: 'Store fraud baseline', tags: ['Internal'])]
    public function fraudBaseline(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);

        // Log to aidecisionlog
        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "aidecisionlog" (id, decision_type, model_name, model_version,
                                          input_data, output_data, confidence, action_taken,
                                          latency_ms, entity_id, entity_type, created_at)
             VALUES (:id, :dtype, :mname, :mver, :input, :output, :conf, :action, :lat, :eid, :etype, :now)'
        )->execute([
            'id'     => $id,
            'dtype'  => 'fraud_baseline',
            'mname'  => $data['model_name'] ?? 'fraud-baseline',
            'mver'   => $data['model_version'] ?? 'v1.0.0',
            'input'  => json_encode($data['input_data'] ?? []),
            'output' => json_encode([
                'fraud_score'  => $data['fraud_score'] ?? 0.0,
                'risk_tier'    => $data['risk_tier'] ?? 'low',
                'risk_factors' => $data['risk_factors'] ?? [],
            ]),
            'conf'   => $data['fraud_score'] ?? 0.0,
            'action' => $data['risk_tier'] === 'high' ? 'flag_for_review' : 'allow',
            'lat'    => $data['latency_ms'] ?? 0,
            'eid'    => $data['user_id'],
            'etype'  => 'user',
            'now'    => $now,
        ]);

        return $this->created(['data' => ['decision_id' => $id]]);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /internal/freelancers/{id}/embedding — Store profile vector   */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/freelancers/{id}/embedding', name: 'internal.freelancer.embedding', summary: 'Store profile embedding', tags: ['Internal'])]
    public function storeFreelancerEmbedding(ServerRequestInterface $request, string $id): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $embedding = is_array($data['profile_embedding'])
            ? json_encode($data['profile_embedding'])
            : $data['profile_embedding'];

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "freelancerprofile" SET profile_embedding = :emb, updated_at = :now WHERE user_id = :id'
        );
        $stmt->execute(['emb' => $embedding, 'now' => $now, 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Freelancer');
        }

        return $this->json(['message' => 'Embedding stored']);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /internal/jobs/{id}/scope — Store AI scope analysis           */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/jobs/{id}/scope', name: 'internal.job.scope', summary: 'Store AI scope', tags: ['Internal'])]
    public function storeJobScope(ServerRequestInterface $request, string $id): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "job" SET ai_scope = :scope, ai_scope_model_version = :mv,
                    ai_scope_confidence = :conf, updated_at = :now WHERE id = :id'
        );
        $stmt->execute([
            'scope' => json_encode($data['ai_scope'] ?? []),
            'mv'    => $data['model_version'] ?? null,
            'conf'  => $data['confidence'] ?? null,
            'now'   => $now,
            'id'    => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Job');
        }

        return $this->json(['message' => 'Scope stored']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /internal/jobs/{id}/matches — Store ranked match results       */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/jobs/{id}/matches', name: 'internal.job.matches', summary: 'Store match results', tags: ['Internal'])]
    public function storeJobMatches(ServerRequestInterface $request, string $id): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data   = $this->body($request);
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $pdo    = $this->db->pdo();

        // Store job embedding if provided
        if (!empty($data['job_embedding'])) {
            $emb = is_array($data['job_embedding'])
                ? json_encode($data['job_embedding'])
                : $data['job_embedding'];
            $pdo->prepare('UPDATE "job" SET job_embedding = :emb, updated_at = :now WHERE id = :id')
                ->execute(['emb' => $emb, 'now' => $now, 'id' => $id]);
        }

        // Log each match result to aidecisionlog
        foreach (($data['results'] ?? []) as $match) {
            $decId = $this->uuid();
            $pdo->prepare(
                'INSERT INTO "aidecisionlog" (id, decision_type, model_name, model_version,
                                              output_data, confidence, action_taken, latency_ms,
                                              entity_id, entity_type, created_at)
                 VALUES (:id, :dtype, :mn, :mv, :out, :conf, :action, :lat, :eid, :et, :now)'
            )->execute([
                'id'     => $decId,
                'dtype'  => 'match_rank',
                'mn'     => 'match-engine',
                'mv'     => $data['model_version'] ?? 'v1.0.0',
                'out'    => json_encode($match),
                'conf'   => $match['score'] ?? 0.0,
                'action' => 'rank',
                'lat'    => $data['latency_ms'] ?? 0,
                'eid'    => $id,
                'et'     => 'job',
                'now'    => $now,
            ]);
        }

        return $this->created([
            'message' => 'Matches stored',
            'count'   => count($data['results'] ?? []),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /internal/proposals/{id}/match — Store proposal match score   */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '/proposals/{id}/match', name: 'internal.proposal.match', summary: 'Store proposal match', tags: ['Internal'])]
    public function storeProposalMatch(ServerRequestInterface $request, string $id): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $stmt = $this->db->pdo()->prepare(
            'UPDATE "proposal" SET ai_match_score = :score, ai_match_model_version = :mv,
                    ai_match_breakdown = :bd, updated_at = :now WHERE id = :id'
        );
        $stmt->execute([
            'score' => $data['ai_match_score'] ?? null,
            'mv'    => $data['model_version'] ?? null,
            'bd'    => json_encode($data['breakdown'] ?? []),
            'now'   => $now,
            'id'    => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            return $this->notFound('Proposal');
        }

        return $this->json(['message' => 'Proposal match score stored']);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /internal/decisions — Log AI decision to audit table           */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/decisions', name: 'internal.decision.log', summary: 'Log AI decision', tags: ['Internal'])]
    public function logDecision(ServerRequestInterface $request): JsonResponse
    {
        if ($err = $this->authorizeInternal($request)) return $err;

        $data = $this->body($request);
        $id   = $this->uuid();
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "aidecisionlog" (id, decision_type, model_name, model_version,
                                          prompt_version, input_hash, input_data, output_data,
                                          confidence, action_taken, latency_ms,
                                          entity_id, entity_type, created_at)
             VALUES (:id, :dtype, :mn, :mv, :pv, :ih, :ind, :outd, :conf, :action, :lat, :eid, :et, :now)'
        )->execute([
            'id'     => $id,
            'dtype'  => $data['decision_type'] ?? 'unknown',
            'mn'     => $data['model_name'] ?? null,
            'mv'     => $data['model_version'] ?? null,
            'pv'     => $data['prompt_version'] ?? null,
            'ih'     => $data['input_hash'] ?? null,
            'ind'    => json_encode($data['input_data'] ?? []),
            'outd'   => json_encode($data['output_data'] ?? []),
            'conf'   => $data['confidence'] ?? null,
            'action' => $data['action_taken'] ?? null,
            'lat'    => $data['latency_ms'] ?? 0,
            'eid'    => $data['entity_id'] ?? null,
            'et'     => $data['entity_type'] ?? null,
            'now'    => $now,
        ]);

        return $this->created(['data' => ['id' => $id]]);
    }

    /* ------------------------------------------------------------------ */
    /*  UUID helper                                                        */
    /* ------------------------------------------------------------------ */
    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Recompute verification_level from approved verification count       */
    /* ------------------------------------------------------------------ */
    private function recomputeVerificationLevel(string $verificationId, string $now): void
    {
        $pdo = $this->db->pdo();

        // Get user_id for this verification
        $stmt = $pdo->prepare('SELECT user_id FROM "verification" WHERE id = :id');
        $stmt->execute(['id' => $verificationId]);
        $userId = $stmt->fetchColumn();

        if (!$userId) return;

        // Count approved verifications for this user
        $countStmt = $pdo->prepare(
            'SELECT COUNT(DISTINCT type) FROM "verification"
             WHERE user_id = :uid AND status IN (\'approved\', \'auto_approved\')'
        );
        $countStmt->execute(['uid' => $userId]);
        $approvedCount = (int) $countStmt->fetchColumn();

        // Determine level: 0 = none, 1 = basic, 2-3 = verified, 4+ = premium
        $level = match (true) {
            $approvedCount >= 4 => 'premium',
            $approvedCount >= 2 => 'verified',
            $approvedCount >= 1 => 'basic',
            default             => 'none',
        };

        $pdo->prepare(
            'UPDATE "freelancerprofile" SET verification_level = :level, updated_at = :now
             WHERE user_id = :uid'
        )->execute(['level' => $level, 'now' => $now, 'uid' => $userId]);
    }
}
