<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/email-preferences')]
#[Middleware('auth')]
final class EmailPreferenceController
{
    use ApiController;

    private const COLUMNS = [
        'account_emails',
        'contract_emails',
        'proposal_emails',
        'message_digest',
        'review_emails',
        'payment_emails',
        'job_recommendations',
        'marketing_emails',
    ];

    public function __construct(
        private ConnectionInterface $db,
    ) {}

    /* ------------------------------------------------------------------ */
    /*  GET /email-preferences                                             */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '', name: 'email_prefs.show', summary: 'Get email preferences', tags: ['Email Preferences'])]
    public function show(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "email_preference" WHERE user_id = :uid'
        );
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) {
            // Return defaults (all enabled except marketing)
            $defaults = array_fill_keys(self::COLUMNS, true);
            $defaults['marketing_emails'] = false;
            $defaults['user_id'] = $userId;
            return $this->json(['data' => $defaults]);
        }

        return $this->json(['data' => $row]);
    }

    /* ------------------------------------------------------------------ */
    /*  PATCH /email-preferences                                           */
    /* ------------------------------------------------------------------ */
    #[Route('PATCH', '', name: 'email_prefs.update', summary: 'Update email preferences', tags: ['Email Preferences'])]
    public function update(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        // Filter only valid columns
        $updates = [];
        foreach (self::COLUMNS as $col) {
            if (isset($data[$col])) {
                $updates[$col] = (bool) $data[$col];
            }
        }

        if (empty($updates)) {
            return $this->error('No valid preferences provided');
        }

        // Upsert
        $setClauses = [];
        $params = ['uid' => $userId];
        foreach ($updates as $col => $val) {
            $setClauses[] = "{$col} = :{$col}";
            $params[$col] = $val ? 'true' : 'false';
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $params['now'] = $now;

        // Check if row exists
        $existsStmt = $this->db->pdo()->prepare('SELECT 1 FROM "email_preference" WHERE user_id = :uid');
        $existsStmt->execute(['uid' => $userId]);

        if ($existsStmt->fetch()) {
            // Update
            $sql = 'UPDATE "email_preference" SET ' . implode(', ', $setClauses) . ', updated_at = :now WHERE user_id = :uid';
            $this->db->pdo()->prepare($sql)->execute($params);
        } else {
            // Insert with defaults + overrides
            $allCols = ['user_id' => $userId];
            foreach (self::COLUMNS as $col) {
                $allCols[$col] = $updates[$col] ?? ($col === 'marketing_emails' ? false : true);
            }
            $allCols['updated_at'] = $now;

            $colNames = implode(', ', array_keys($allCols));
            $placeholders = ':' . implode(', :', array_keys($allCols));

            $insertParams = [];
            foreach ($allCols as $k => $v) {
                $insertParams[$k] = is_bool($v) ? ($v ? 'true' : 'false') : (string) $v;
            }

            $this->db->pdo()->prepare(
                "INSERT INTO \"email_preference\" ({$colNames}) VALUES ({$placeholders})"
            )->execute($insertParams);
        }

        // Fetch updated
        $stmt = $this->db->pdo()->prepare('SELECT * FROM "email_preference" WHERE user_id = :uid');
        $stmt->execute(['uid' => $userId]);

        return $this->json(['data' => $stmt->fetch(\PDO::FETCH_ASSOC), 'message' => 'Preferences updated']);
    }
}