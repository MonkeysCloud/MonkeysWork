<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\PubSubPublisher;
use App\Service\SocketEvent;
use App\Service\VertexAiScorer;
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
    ) {
    }

    #[Route('POST', '', name: 'verif.create', summary: 'Submit verification', tags: ['Verification'])]
    public function submit(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $data = $this->body($request);

            error_log("[VerificationController] submit called. userId={$userId}, type=" . ($data['type'] ?? 'null'));

            if (empty($data['type'])) {
                return $this->error('Verification type is required');
            }

            $id = $this->uuid();
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

            $params = [
                'id' => $id,
                'uid' => $userId,
                'type' => $data['type'],
                'data' => json_encode([
                    'document_urls' => $data['document_urls'] ?? [],
                    'metadata' => $data['metadata'] ?? [],
                ]),
                'now' => $now,
            ];

            error_log("[VerificationController] INSERT params: " . json_encode($params));

            $this->db->pdo()->prepare(
                'INSERT INTO "verification" (id, user_id, type, status, data, created_at, updated_at)
                 VALUES (:id, :uid, :type, \'pending\', :data, :now, :now)'
            )->execute($params);

            // Publish to Pub/Sub (triggers verification-automation service)
            $pubsub = $this->pubsub ?? new PubSubPublisher();
            try {
                $pubsub->verificationSubmitted($id, $userId, $data['type']);
            } catch (\Throwable) {
                // Non-critical: don't fail submission if Pub/Sub is down
            }

            return $this->created(['data' => ['id' => $id]]);
        } catch (\Throwable $e) {
            error_log("[VerificationController] ERROR: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            return $this->error('Verification failed: ' . $e->getMessage(), 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  POST /verifications/evaluate — Auto-evaluate applicable types      */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/evaluate', name: 'verif.evaluate', summary: 'Auto-evaluate verifications', tags: ['Verification'])]
    public function evaluate(ServerRequestInterface $request): JsonResponse
    {
        try {
            $userId = $this->userId($request);
            $pdo = $this->db->pdo();

            // 1. Fetch freelancer profile
            $stmt = $pdo->prepare(
                'SELECT portfolio_urls, certifications, experience_years, hourly_rate,
                        education, headline, bio, website_url, github_url, linkedin_url,
                        tax_id_type, tax_id_last4, billing_country, billing_state,
                        billing_city, billing_address, billing_zip
                 FROM "freelancerprofile" WHERE user_id = :uid'
            );
            $stmt->execute(['uid' => $userId]);
            $profile = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$profile) {
                return $this->error('No freelancer profile found', 404);
            }

            // 1b. Fetch user data for Stripe Connect status
            $userStmt = $pdo->prepare(
                'SELECT stripe_connect_account_id FROM "user" WHERE id = :uid'
            );
            $userStmt->execute(['uid' => $userId]);
            $user = $userStmt->fetch(\PDO::FETCH_ASSOC) ?: [];
            // 2. Fetch skills with names
            $skillStmt = $pdo->prepare(
                'SELECT s.name, fs.proficiency, fs.years_experience
                 FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id
                 WHERE fs.freelancer_id = :uid ORDER BY fs.years_experience DESC'
            );
            $skillStmt->execute(['uid' => $userId]);
            $skills = $skillStmt->fetchAll(\PDO::FETCH_ASSOC);
            $skillCount = count($skills);

            // 3. Parse JSON fields
            $portfolioUrls = json_decode($profile['portfolio_urls'] ?: '[]', true);
            $certifications = json_decode($profile['certifications'] ?: '[]', true);
            $education = json_decode($profile['education'] ?: '[]', true);
            $experienceYears = (int) $profile['experience_years'];

            // 4. Determine applicable verification types
            $applicable = [];
            $reasons = [];

            // Identity — always applicable
            $applicable[] = 'identity';
            $reasons['identity'] = 'Identity verification is always recommended';

            // Skill assessment — requires at least 1 skill
            if ($skillCount > 0) {
                $applicable[] = 'skill_assessment';
                $reasons['skill_assessment'] = "You have {$skillCount} skill(s) to assess";
            }

            // Portfolio — requires at least 1 portfolio URL or certification
            if (!empty($portfolioUrls) || !empty($certifications)) {
                $applicable[] = 'portfolio';
                $items = count($portfolioUrls) + count($certifications);
                $reasons['portfolio'] = "You have {$items} portfolio/certification item(s)";
            }

            // Work history — requires experience
            if ($experienceYears > 0) {
                $applicable[] = 'work_history';
                $reasons['work_history'] = "{$experienceYears} year(s) of experience to verify";
            }

            // Payment method — always applicable (can verify any time)
            $applicable[] = 'payment_method';
            $reasons['payment_method'] = 'Payment method verification';

            // 5. Get existing verifications — only skip actively processing ones
            $existingStmt = $pdo->prepare(
                'SELECT type, status FROM "verification"
                 WHERE user_id = :uid AND status IN (\'pending\', \'in_review\')
                 ORDER BY created_at DESC'
            );
            $existingStmt->execute(['uid' => $userId]);
            $existingMap = [];
            foreach ($existingStmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                if (!isset($existingMap[$row['type']])) {
                    $existingMap[$row['type']] = $row['status'];
                }
            }

            // 5b. Fetch ID document attachments (uploaded during profile completion)
            $docStmt = $pdo->prepare(
                'SELECT file_name, file_url, mime_type FROM "attachment"
                 WHERE entity_type = \'verification\' AND uploaded_by_id = :uid
                 ORDER BY created_at DESC'
            );
            $docStmt->execute(['uid' => $userId]);
            $idDocuments = $docStmt->fetchAll(\PDO::FETCH_ASSOC);

            // 5c. Fetch payment methods
            $pmStmt = $pdo->prepare(
                'SELECT type, provider, last_four, is_default, expiry, verified
                 FROM "paymentmethod" WHERE user_id = :uid AND is_active = true
                 ORDER BY is_default DESC, created_at DESC'
            );
            $pmStmt->execute(['uid' => $userId]);
            $paymentMethods = $pmStmt->fetchAll(\PDO::FETCH_ASSOC);

            // 6. Build type-specific data payloads with actual user content
            $typeData = [
                'identity' => [
                    'reason' => $reasons['identity'] ?? '',
                    'headline' => $profile['headline'] ?? null,
                    'bio' => $profile['bio'] ?? null,
                    'document_urls' => array_map(fn($d) => $d['file_url'], $idDocuments),
                    'documents' => $idDocuments,
                ],
                'skill_assessment' => [
                    'reason' => $reasons['skill_assessment'] ?? '',
                    'skills' => $skills,
                ],
                'portfolio' => [
                    'reason' => $reasons['portfolio'] ?? '',
                    'portfolio_items' => $portfolioUrls,
                    'certifications' => $certifications,
                    'education' => $education,
                    'website_url' => $profile['website_url'] ?? null,
                    'github_url' => $profile['github_url'] ?? null,
                    'linkedin_url' => $profile['linkedin_url'] ?? null,
                ],
                'work_history' => [
                    'reason' => $reasons['work_history'] ?? '',
                    'experience_years' => $experienceYears,
                    'headline' => $profile['headline'] ?? null,
                    'bio' => $profile['bio'] ?? null,
                    'skills' => $skills,
                ],
                'payment_method' => [
                    'reason' => $reasons['payment_method'] ?? '',
                    'payment_methods' => $paymentMethods,
                    'has_payment_method' => !empty($paymentMethods),
                    'tax_id_type' => $profile['tax_id_type'] ?? null,
                    'has_tax_id' => !empty($profile['tax_id_last4']),
                    'tax_id_last4' => $profile['tax_id_last4'] ?? null,
                    'billing_country' => $profile['billing_country'] ?? null,
                    'billing_state' => $profile['billing_state'] ?? null,
                    'billing_city' => $profile['billing_city'] ?? null,
                    'billing_address' => $profile['billing_address'] ?? null,
                    'billing_zip' => $profile['billing_zip'] ?? null,
                    'has_billing_address' => !empty($profile['billing_country']) && !empty($profile['billing_city']),
                    'stripe_connect_account_id' => $user['stripe_connect_account_id'] ?? null,
                    'has_stripe_connect' => !empty($user['stripe_connect_account_id']),
                ],
            ];

            // 7. Create new verification rows for applicable types
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
            $pubsub = $this->pubsub ?? new PubSubPublisher();
            $created = [];
            $skipped = [];

            foreach ($applicable as $type) {
                if (isset($existingMap[$type])) {
                    $skipped[] = [
                        'type' => $type,
                        'status' => $existingMap[$type],
                        'reason' => 'Already has active verification',
                    ];
                    continue;
                }

                $payload = $typeData[$type] ?? ['reason' => $reasons[$type] ?? ''];
                $payload['auto_evaluated'] = true;

                $id = $this->uuid();
                $pdo->prepare(
                    'INSERT INTO "verification" (id, user_id, type, status, data, created_at, updated_at)
                     VALUES (:id, :uid, :type, \'pending\', :data, :now, :now)'
                )->execute([
                            'id' => $id,
                            'uid' => $userId,
                            'type' => $type,
                            'data' => json_encode($payload),
                            'now' => $now,
                        ]);

                // Publish to PubSub for AI processing
                try {
                    $pubsub->verificationSubmitted($id, $userId, $type);
                } catch (\Throwable) {
                    // Non-critical
                }

                $created[] = ['id' => $id, 'type' => $type];
            }

            // 7. Auto-process verifications
            // ── Inline AI scoring (works in both dev and prod) ──
            $scorer = new VertexAiScorer();
            foreach ($created as &$item) {
                try {
                    $aiResult = $scorer->scoreVerification(
                        $item['type'],
                        $typeData[$item['type']] ?? []
                    );
                    $confidence = (float) ($aiResult['confidence'] ?? 0.0);
                    $reasoning = $aiResult['reasoning'] ?? '';
                    $checks = $aiResult['checks'] ?? [];
                    $aiModel = $aiResult['model'] ?? 'unknown';
                    error_log("[VerificationController] scored {$item['type']}: confidence={$confidence} reasoning={$reasoning}");
                    $scorerFailed = false;
                } catch (\Throwable $e) {
                    error_log("[VerificationController] scorer failed for {$item['type']}: " . $e->getMessage());
                    $confidence = 0.0;
                    $reasoning = 'AI scorer unavailable: ' . $e->getMessage();
                    $checks = [];
                    $aiModel = 'error';
                    $scorerFailed = true;
                }

                try {
                    if ($scorerFailed) {
                        // AI unavailable — require human review, NEVER auto-approve
                        $newStatus = 'in_review';
                        $decision = 'human_review';
                    } elseif ($confidence >= 0.85) {
                        $newStatus = 'approved';
                        $decision = 'auto_approved';
                    } elseif ($confidence >= 0.50) {
                        $newStatus = 'in_review';
                        $decision = 'human_review';
                    } else {
                        $newStatus = 'rejected';
                        $decision = 'auto_rejected';
                    }

                    $pdo->prepare(
                        'UPDATE "verification" SET status = :status, ai_confidence = :conf,
                                ai_model_version = :model, ai_result = :result,
                                data = :data, updated_at = :now
                         WHERE id = :id'
                    )->execute([
                                'status' => $newStatus,
                                'conf' => round($confidence, 4),
                                'model' => $aiModel,
                                'result' => json_encode([
                                    'decision' => $decision,
                                    'confidence' => $confidence,
                                    'reasoning' => $reasoning,
                                    'checks' => $checks,
                                ]),
                                'data' => json_encode(
                                    array_merge(
                                        $typeData[$item['type']] ?? ['reason' => $reasons[$item['type']] ?? ''],
                                        ['auto_evaluated' => true]
                                    )
                                ),
                                'now' => $now,
                                'id' => $item['id'],
                            ]);

                    $item['status'] = $newStatus;
                    $item['confidence'] = round($confidence, 4);

                    // Send notification + socket event
                    $this->notifyVerificationStatus(
                        $userId,
                        $item['id'],
                        $item['type'],
                        $newStatus,
                        round($confidence, 4),
                        $pdo,
                        $now
                    );
                } catch (\Throwable $e) {
                    error_log("[VerificationController] update failed for {$item['type']}: " . $e->getMessage());
                }
            }
            unset($item);

            // 8. Return summary
            $allTypes = ['identity', 'skill_assessment', 'portfolio', 'work_history', 'payment_method'];
            $notApplicable = array_diff($allTypes, $applicable);

            return $this->json([
                'data' => [
                    'evaluated' => count($applicable),
                    'created' => $created,
                    'skipped' => $skipped,
                    'not_applicable' => array_values($notApplicable),
                    'reasons' => $reasons,
                ],
            ]);
        } catch (\Throwable $e) {
            error_log("[VerificationController] evaluate ERROR: " . $e->getMessage());
            return $this->error('Evaluation failed: ' . $e->getMessage(), 500);
        }
    }

    #[Route('GET', '', name: 'verif.index', summary: 'My verifications', tags: ['Verification'])]
    public function index(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT id, type, status, reviewed_at, expires_at, created_at, updated_at
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

    /* (Verification scoring is now handled by VertexAiScorer service) */

    /**
     * Create a notification record and push real-time event via Socket.IO/Redis.
     */
    private function notifyVerificationStatus(
        string $userId,
        string $verificationId,
        string $type,
        string $status,
        float $confidence,
        \PDO $pdo,
        string $now
    ): void {
        $typeLabels = [
            'identity' => 'Identity',
            'skill_assessment' => 'Skill Assessment',
            'portfolio' => 'Portfolio',
            'work_history' => 'Work History',
            'payment_method' => 'Payment Method',
        ];
        $label = $typeLabels[$type] ?? ucfirst(str_replace('_', ' ', $type));

        $meta = match ($status) {
            'approved' => [
                'icon' => '✅',
                'title' => "{$label} Verified",
                'body' => "Your {$label} verification has been approved with " . round($confidence * 100) . "% confidence.",
                'priority' => 'success',
            ],
            'in_review' => [
                'icon' => '🔄',
                'title' => "{$label} Under Review",
                'body' => "Your {$label} verification is being reviewed by our team.",
                'priority' => 'info',
            ],
            'rejected' => [
                'icon' => '❌',
                'title' => "{$label} Verification Failed",
                'body' => "Your {$label} verification could not be approved. Please review and resubmit.",
                'priority' => 'warning',
            ],
            default => null,
        };

        if (!$meta)
            return;

        $notifId = $this->uuid();

        // 1. Persist to DB
        try {
            $pdo->prepare(
                'INSERT INTO "notification" (id, user_id, type, title, body, data, priority, channel, created_at)
                 VALUES (:id, :uid, :type, :title, :body, :data, :prio, :chan, :now)'
            )->execute([
                        'id' => $notifId,
                        'uid' => $userId,
                        'type' => "verification.{$status}",
                        'title' => "{$meta['icon']} {$meta['title']}",
                        'body' => $meta['body'],
                        'data' => json_encode([
                            'verification_id' => $verificationId,
                            'verification_type' => $type,
                            'status' => $status,
                            'confidence' => $confidence,
                            'link' => '/dashboard/settings/verification',
                        ]),
                        'prio' => $meta['priority'],
                        'chan' => 'in_app',
                        'now' => $now,
                    ]);
        } catch (\Throwable $e) {
            error_log("[VerificationController] notification insert: " . $e->getMessage());
        }

        // 2. Push real-time via Redis → Socket.IO
        try {
            $redisHost = getenv('REDIS_HOST') ?: 'redis';
            $redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
            $redis = new \Redis();
            $redis->connect($redisHost, $redisPort, 2.0);

            $socket = new SocketEvent($redis);
            $socket->toUser($userId, 'notification:new', [
                'id' => $notifId,
                'type' => "verification.{$status}",
                'title' => "{$meta['icon']} {$meta['title']}",
                'body' => $meta['body'],
                'data' => [
                    'verification_id' => $verificationId,
                    'verification_type' => $type,
                    'status' => $status,
                    'confidence' => $confidence,
                    'link' => '/dashboard/settings/verification',
                ],
                'priority' => $meta['priority'],
                'created_at' => $now,
            ]);

            $redis->close();
        } catch (\Throwable $e) {
            error_log("[VerificationController] socket emit: " . $e->getMessage());
        }
    }
}
