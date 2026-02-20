<?php
declare(strict_types=1);

namespace App\Controller;

use App\Event\TimeEntryLogged;
use App\Event\TimesheetSubmitted;
use App\Event\TimesheetApproved;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/time')]
#[Middleware('auth')]
final class TimeTrackingController
{
    use ApiController;

    public function __construct(
        private ConnectionInterface $db,
        private ?EventDispatcherInterface $events = null,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    //  TIME ENTRIES
    // ═══════════════════════════════════════════════════════════════

    #[Route('POST', '/entries/start', name: 'time.start', summary: 'Start a live timer', tags: ['Time Tracking'])]
    public function start(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $contractId = $data['contract_id'] ?? null;
        if (!$contractId) {
            return $this->error('contract_id is required');
        }

        $contract = $this->findContract($contractId, $userId);
        if ($contract instanceof JsonResponse) {
            return $contract;
        }

        if ($contract['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can log time');
        }

        if ($contract['contract_type'] !== 'hourly') {
            return $this->error('Time tracking is only available for hourly contracts');
        }

        // Check for already-running timer on this contract
        $stmt = $this->db->pdo()->prepare(
            'SELECT id FROM "timeentry" WHERE freelancer_id = :uid AND status = \'running\' LIMIT 1'
        );
        $stmt->execute(['uid' => $userId]);
        if ($stmt->fetch()) {
            return $this->error('You already have a running timer. Stop it first.');
        }

        // ── Weekly hour limit enforcement ──
        $weeklyLimit = isset($contract['weekly_hour_limit']) ? (int) $contract['weekly_hour_limit'] : null;
        if ($weeklyLimit && $weeklyLimit > 0) {
            // Monday 00:00 of the current ISO week
            $weekStart = (new \DateTimeImmutable('monday this week'))->format('Y-m-d 00:00:00');
            $weekEnd   = (new \DateTimeImmutable('monday next week'))->format('Y-m-d 00:00:00');

            $hwStmt = $this->db->pdo()->prepare(
                'SELECT COALESCE(SUM(duration_minutes), 0) AS mins
                 FROM "timeentry"
                 WHERE contract_id = :cid AND freelancer_id = :uid
                   AND started_at >= :ws AND started_at < :we
                   AND status IN (\'stopped\', \'running\')'
            );
            $hwStmt->execute([
                'cid' => $contractId, 'uid' => $userId,
                'ws'  => $weekStart,  'we'  => $weekEnd,
            ]);
            $minutesThisWeek = (int) $hwStmt->fetchColumn();
            $hoursThisWeek   = round($minutesThisWeek / 60, 2);
            $remaining       = round($weeklyLimit - $hoursThisWeek, 2);

            if ($minutesThisWeek >= ($weeklyLimit * 60)) {
                return $this->json([
                    'error'            => 'Weekly hour limit reached for this contract',
                    'weekly_limit'     => $weeklyLimit,
                    'hours_this_week'  => $hoursThisWeek,
                    'remaining_hours'  => max(0, $remaining),
                ], 409);
            }
        }

        $id  = $this->uuid();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "timeentry" (id, contract_id, freelancer_id, milestone_id, started_at,
                                       is_manual, is_billable, hourly_rate, status,
                                       description, task_label, created_at, updated_at)
             VALUES (:id, :cid, :uid, :mid, :now,
                     FALSE, TRUE, :rate, \'running\',
                     :desc, :label, :now, :now)'
        )->execute([
            'id'    => $id,
            'cid'   => $contractId,
            'uid'   => $userId,
            'mid'   => $data['milestone_id'] ?? null,
            'now'   => $now,
            'rate'  => $contract['hourly_rate'] ?? '0.00',
            'desc'  => $data['description'] ?? null,
            'label' => $data['task_label'] ?? null,
        ]);

        return $this->created(['data' => ['id' => $id, 'started_at' => $now]]);
    }

    #[Route('POST', '/entries/{id}/stop', name: 'time.stop', summary: 'Stop timer', tags: ['Time Tracking'])]
    public function stop(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can stop the timer');
        }
        if ($entry['status'] !== 'running') {
            return $this->error('Timer is not running');
        }

        $now     = new \DateTimeImmutable();
        $started = new \DateTimeImmutable($entry['started_at']);
        $minutes = (int) round(($now->getTimestamp() - $started->getTimestamp()) / 60);
        $rate    = (float) $entry['hourly_rate'];
        $amount  = number_format(($minutes / 60) * $rate, 2, '.', '');

        $this->db->pdo()->prepare(
            'UPDATE "timeentry"
             SET ended_at = :now, duration_minutes = :dur, amount = :amt,
                 status = \'logged\', updated_at = :now
             WHERE id = :id'
        )->execute([
            'now' => $now->format('Y-m-d H:i:s'),
            'dur' => $minutes,
            'amt' => $amount,
            'id'  => $id,
        ]);

        // Dispatch event
        $this->events?->dispatch(new TimeEntryLogged(
            $id, $entry['contract_id'], $userId, $minutes, $amount
        ));

        return $this->json([
            'message' => 'Timer stopped',
            'data'    => [
                'duration_minutes' => $minutes,
                'amount'           => $amount,
            ],
        ]);
    }

    #[Route('POST', '/entries', name: 'time.create', summary: 'Manual time entry', tags: ['Time Tracking'])]
    public function create(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $contractId = $data['contract_id'] ?? null;
        if (!$contractId) {
            return $this->error('contract_id is required');
        }

        $contract = $this->findContract($contractId, $userId);
        if ($contract instanceof JsonResponse) {
            return $contract;
        }

        if ($contract['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can log time');
        }

        $startedAt = $data['started_at'] ?? null;
        $endedAt   = $data['ended_at'] ?? null;
        $duration  = (int) ($data['duration_minutes'] ?? 0);

        if (!$startedAt || !$endedAt || $duration <= 0) {
            return $this->error('started_at, ended_at, and duration_minutes are required for manual entries');
        }

        $rate   = (float) ($contract['hourly_rate'] ?? 0);
        $amount = number_format(($duration / 60) * $rate, 2, '.', '');
        $id     = $this->uuid();
        $now    = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "timeentry" (id, contract_id, freelancer_id, milestone_id,
                                       started_at, ended_at, duration_minutes,
                                       is_manual, is_billable, hourly_rate, amount,
                                       status, description, task_label, created_at, updated_at)
             VALUES (:id, :cid, :uid, :mid,
                     :start, :end, :dur,
                     TRUE, :billable, :rate, :amt,
                     \'logged\', :desc, :label, :now, :now)'
        )->execute([
            'id'       => $id,
            'cid'      => $contractId,
            'uid'      => $userId,
            'mid'      => $data['milestone_id'] ?? null,
            'start'    => $startedAt,
            'end'      => $endedAt,
            'dur'      => $duration,
            'billable' => ($data['is_billable'] ?? true) ? 'true' : 'false',
            'rate'     => $contract['hourly_rate'] ?? '0.00',
            'amt'      => $amount,
            'desc'     => $data['description'] ?? null,
            'label'    => $data['task_label'] ?? null,
            'now'      => $now,
        ]);

        // Dispatch event
        $this->events?->dispatch(new TimeEntryLogged(
            $id, $contractId, $userId, $duration, $amount
        ));

        return $this->created(['data' => ['id' => $id, 'amount' => $amount]]);
    }

    #[Route('GET', '/entries', name: 'time.entries', summary: 'List time entries', tags: ['Time Tracking'])]
    public function entries(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $query  = $request->getQueryParams();
        $p      = $this->pagination($request);

        $where  = ['(c.client_id = :uid OR c.freelancer_id = :uid)'];
        $params = ['uid' => $userId];

        if (!empty($query['contract_id'])) {
            $where[]              = 'te.contract_id = :cid';
            $params['cid']        = $query['contract_id'];
        }
        if (!empty($query['status'])) {
            $where[]              = 'te.status = :st';
            $params['st']         = $query['status'];
        }
        if (!empty($query['from'])) {
            $where[]              = 'te.started_at >= :from';
            $params['from']       = $query['from'];
        }
        if (!empty($query['to'])) {
            $where[]              = 'te.started_at <= :to';
            $params['to']         = $query['to'];
        }

        $whereClause = implode(' AND ', $where);

        // Count
        $countStmt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"timeentry\" te
             JOIN \"contract\" c ON c.id = te.contract_id
             WHERE {$whereClause}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Fetch
        $params['limit']  = $p['perPage'];
        $params['offset'] = $p['offset'];
        $stmt = $this->db->pdo()->prepare(
            "SELECT te.*, c.title AS contract_title
             FROM \"timeentry\" te
             JOIN \"contract\" c ON c.id = te.contract_id
             WHERE {$whereClause}
             ORDER BY te.started_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->execute($params);

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/entries/running', name: 'time.running', summary: 'Get running timer', tags: ['Time Tracking'])]
    public function running(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT te.*, c.title AS contract_title
             FROM "timeentry" te
             JOIN "contract" c ON c.id = te.contract_id
             WHERE te.freelancer_id = :uid AND te.status = \'running\'
             LIMIT 1'
        );
        $stmt->execute(['uid' => $userId]);
        $entry = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$entry) {
            return $this->json(['data' => null]);
        }

        // Add elapsed time
        $started = new \DateTimeImmutable($entry['started_at']);
        $entry['elapsed_minutes'] = (int) round(
            ((new \DateTimeImmutable())->getTimestamp() - $started->getTimestamp()) / 60
        );

        return $this->json(['data' => $entry]);
    }

    #[Route('GET', '/entries/{id}', name: 'time.entry.show', summary: 'Entry detail', tags: ['Time Tracking'])]
    public function showEntry(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        return $this->json(['data' => $entry]);
    }

    #[Route('PATCH', '/entries/{id}', name: 'time.entry.update', summary: 'Edit entry', tags: ['Time Tracking'])]
    public function updateEntry(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can edit entries');
        }

        if (in_array($entry['status'], ['approved', 'disputed'], true)) {
            return $this->error('Cannot edit an approved or disputed entry');
        }

        $allowed = ['description', 'task_label', 'is_billable', 'duration_minutes', 'started_at', 'ended_at'];
        $sets    = [];
        $params  = ['id' => $id];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $sets[]     = "\"{$f}\" = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        if (empty($sets)) {
            return $this->error('No valid fields to update');
        }

        // Recompute amount if duration changed
        if (isset($params['duration_minutes'])) {
            $dur    = (int) $params['duration_minutes'];
            $rate   = (float) $entry['hourly_rate'];
            $amount = number_format(($dur / 60) * $rate, 2, '.', '');
            $sets[]           = '"amount" = :amt';
            $params['amt']    = $amount;
        }

        $sets[]        = '"updated_at" = :now';
        $params['now'] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'UPDATE "timeentry" SET ' . implode(', ', $sets) . ' WHERE id = :id'
        )->execute($params);

        return $this->json(['message' => 'Time entry updated']);
    }

    #[Route('DELETE', '/entries/{id}', name: 'time.entry.delete', summary: 'Delete entry', tags: ['Time Tracking'])]
    public function deleteEntry(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can delete entries');
        }

        if (in_array($entry['status'], ['approved', 'disputed'], true)) {
            return $this->error('Cannot delete an approved or disputed entry');
        }

        $this->db->pdo()->prepare('DELETE FROM "timeentry" WHERE id = :id')->execute(['id' => $id]);

        return $this->noContent();
    }

    #[Route('POST', '/entries/{id}/approve', name: 'time.entry.approve', summary: 'Approve entry', tags: ['Time Tracking'])]
    public function approveEntry(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['client_id'] !== $userId) {
            return $this->forbidden('Only the client can approve entries');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "timeentry"
             SET status = \'approved\', approved_by = :uid, approved_at = :now, updated_at = :now
             WHERE id = :id'
        )->execute(['uid' => $userId, 'now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Time entry approved']);
    }

    #[Route('POST', '/entries/{id}/reject', name: 'time.entry.reject', summary: 'Reject entry', tags: ['Time Tracking'])]
    public function rejectEntry(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['client_id'] !== $userId) {
            return $this->forbidden('Only the client can reject entries');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "timeentry"
             SET status = \'rejected\', rejected_reason = :reason, updated_at = :now
             WHERE id = :id'
        )->execute(['reason' => $data['reason'] ?? null, 'now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Time entry rejected']);
    }

    #[Route('POST', '/entries/heartbeat', name: 'time.heartbeat', summary: 'Tracker heartbeat', tags: ['Time Tracking'])]
    public function heartbeat(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);

        $entryId = $data['entry_id'] ?? null;
        if (!$entryId) {
            return $this->error('entry_id is required');
        }

        $entry = $this->findEntry($entryId, $userId);
        if ($entry instanceof JsonResponse) {
            return $entry;
        }

        if ($entry['status'] !== 'running') {
            return $this->error('Entry is not running');
        }

        $now    = new \DateTimeImmutable();
        $nowStr = $now->format('Y-m-d H:i:s');

        // Update entry timestamp + activity score
        $sets   = ['"updated_at" = :now'];
        $params = ['id' => $entryId, 'now' => $nowStr];

        if (isset($data['activity_score'])) {
            $sets[]          = '"activity_score" = :score';
            $params['score'] = $data['activity_score'];
        }

        // Also append to legacy JSONB array for backwards compat
        if (isset($data['screenshot_url'])) {
            $sets[]        = '"screenshot_urls" = "screenshot_urls" || :ss::jsonb';
            $params['ss']  = json_encode([$data['screenshot_url']]);
        }

        $this->db->pdo()->prepare(
            'UPDATE "timeentry" SET ' . implode(', ', $sets) . ' WHERE id = :id'
        )->execute($params);

        // Insert into screenshot table if we have a screenshot
        if (isset($data['screenshot_url'])) {
            $clicks = (int) ($data['click_count'] ?? 0);
            $keys   = (int) ($data['key_count'] ?? 0);
            $total  = $clicks + $keys;
            $pct    = number_format(min(100.0, ($total / max(1, 100)) * 100), 2, '.', '');

            $this->db->pdo()->prepare(
                'INSERT INTO "screenshot"
                    (id, time_entry_id, file_url, click_count, key_count, activity_percent, captured_at, created_at)
                 VALUES (:id, :entry, :url, :clicks, :keys, :pct, :cap, :cap)'
            )->execute([
                'id'     => $this->uuid(),
                'entry'  => $entryId,
                'url'    => $data['screenshot_url'],
                'clicks' => $clicks,
                'keys'   => $keys,
                'pct'    => $pct,
                'cap'    => $nowStr,
            ]);
        }

        return $this->json(['message' => 'Heartbeat received']);
    }

    // ═══════════════════════════════════════════════════════════════
    //  WEEKLY TIMESHEETS
    // ═══════════════════════════════════════════════════════════════

    #[Route('GET', '/timesheets', name: 'time.timesheets', summary: 'List timesheets', tags: ['Time Tracking'])]
    public function timesheets(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $query  = $request->getQueryParams();
        $p      = $this->pagination($request);

        $where  = ['(c.client_id = :uid OR c.freelancer_id = :uid)'];
        $params = ['uid' => $userId];

        if (!empty($query['contract_id'])) {
            $where[]       = 'ts.contract_id = :cid';
            $params['cid'] = $query['contract_id'];
        }
        if (!empty($query['status'])) {
            $where[]      = 'ts.status = :st';
            $params['st'] = $query['status'];
        }

        $whereClause = implode(' AND ', $where);

        $countStmt = $this->db->pdo()->prepare(
            "SELECT COUNT(*) FROM \"weeklytimesheet\" ts
             JOIN \"contract\" c ON c.id = ts.contract_id
             WHERE {$whereClause}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $params['limit']  = $p['perPage'];
        $params['offset'] = $p['offset'];
        $stmt = $this->db->pdo()->prepare(
            "SELECT ts.*, c.title AS contract_title
             FROM \"weeklytimesheet\" ts
             JOIN \"contract\" c ON c.id = ts.contract_id
             WHERE {$whereClause}
             ORDER BY ts.week_start DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->execute($params);

        return $this->paginated($stmt->fetchAll(\PDO::FETCH_ASSOC), $total, $p['page'], $p['perPage']);
    }

    #[Route('GET', '/timesheets/{id}', name: 'time.timesheet.show', summary: 'Timesheet detail', tags: ['Time Tracking'])]
    public function showTimesheet(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId    = $this->userId($request);
        $timesheet = $this->findTimesheet($id, $userId);
        if ($timesheet instanceof JsonResponse) {
            return $timesheet;
        }

        // Fetch associated time entries
        $stmt = $this->db->pdo()->prepare(
            'SELECT te.* FROM "timeentry" te
             WHERE te.contract_id = :cid
               AND te.started_at >= :ws AND te.started_at < :we
             ORDER BY te.started_at ASC'
        );
        $stmt->execute([
            'cid' => $timesheet['contract_id'],
            'ws'  => $timesheet['week_start'],
            'we'  => (new \DateTimeImmutable($timesheet['week_end']))->modify('+1 day')->format('Y-m-d'),
        ]);

        $timesheet['entries'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['data' => $timesheet]);
    }

    #[Route('POST', '/timesheets/{id}/submit', name: 'time.timesheet.submit', summary: 'Submit for review', tags: ['Time Tracking'])]
    public function submitTimesheet(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId    = $this->userId($request);
        $data      = $this->body($request);
        $timesheet = $this->findTimesheet($id, $userId);
        if ($timesheet instanceof JsonResponse) {
            return $timesheet;
        }

        if ($timesheet['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can submit timesheets');
        }

        if ($timesheet['status'] !== 'pending') {
            return $this->error('Timesheet has already been submitted');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "weeklytimesheet"
             SET status = \'submitted\', submitted_at = :now, notes = :notes, updated_at = :now
             WHERE id = :id'
        )->execute(['now' => $now, 'notes' => $data['notes'] ?? null, 'id' => $id]);

        $this->events?->dispatch(new TimesheetSubmitted(
            $id,
            $timesheet['contract_id'],
            $userId,
            (int) $timesheet['total_minutes'],
            (string) $timesheet['total_amount'],
        ));

        return $this->json(['message' => 'Timesheet submitted for review']);
    }

    #[Route('POST', '/timesheets/{id}/approve', name: 'time.timesheet.approve', summary: 'Approve timesheet', tags: ['Time Tracking'])]
    public function approveTimesheet(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId    = $this->userId($request);
        $timesheet = $this->findTimesheet($id, $userId);
        if ($timesheet instanceof JsonResponse) {
            return $timesheet;
        }

        if ($timesheet['client_id'] !== $userId) {
            return $this->forbidden('Only the client can approve timesheets');
        }

        if ($timesheet['status'] !== 'submitted') {
            return $this->error('Timesheet must be submitted before approval');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $txId = $this->uuid();

        $pdo = $this->db->pdo();
        $pdo->beginTransaction();
        try {
            // Approve timesheet
            $pdo->prepare(
                'UPDATE "weeklytimesheet"
                 SET status = \'approved\', approved_by = :uid, approved_at = :now, updated_at = :now
                 WHERE id = :id'
            )->execute(['uid' => $userId, 'now' => $now, 'id' => $id]);

            // Batch-approve all logged entries for this week
            $pdo->prepare(
                'UPDATE "timeentry"
                 SET status = \'approved\', approved_by = :uid, approved_at = :now, updated_at = :now
                 WHERE contract_id = :cid AND status = \'logged\'
                   AND started_at >= :ws AND started_at < :we'
            )->execute([
                'uid' => $userId,
                'now' => $now,
                'cid' => $timesheet['contract_id'],
                'ws'  => $timesheet['week_start'],
                'we'  => (new \DateTimeImmutable($timesheet['week_end']))->modify('+1 day')->format('Y-m-d'),
            ]);

            // Create escrow transaction for the total amount
            $pdo->prepare(
                'INSERT INTO "escrowtransaction" (id, contract_id, type, amount, currency, status, created_at)
                 VALUES (:id, :cid, \'fund\', :amt, :cur, \'completed\', :now)'
            )->execute([
                'id'  => $txId,
                'cid' => $timesheet['contract_id'],
                'amt' => $timesheet['total_amount'],
                'cur' => $timesheet['currency'] ?? 'USD',
                'now' => $now,
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error('Failed to approve timesheet', 500);
        }

        $this->events?->dispatch(new TimesheetApproved(
            $id,
            $timesheet['contract_id'],
            $userId,
            $timesheet['freelancer_id'],
            (string) $timesheet['total_amount'],
        ));

        return $this->json([
            'message' => 'Timesheet approved, escrow funded',
            'data'    => ['transaction_id' => $txId],
        ]);
    }

    #[Route('POST', '/timesheets/{id}/dispute', name: 'time.timesheet.dispute', summary: 'Dispute timesheet', tags: ['Time Tracking'])]
    public function disputeTimesheet(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId    = $this->userId($request);
        $data      = $this->body($request);
        $timesheet = $this->findTimesheet($id, $userId);
        if ($timesheet instanceof JsonResponse) {
            return $timesheet;
        }

        if ($timesheet['client_id'] !== $userId) {
            return $this->forbidden('Only the client can dispute timesheets');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "weeklytimesheet"
             SET status = \'disputed\', client_feedback = :fb, updated_at = :now
             WHERE id = :id'
        )->execute(['fb' => $data['feedback'] ?? null, 'now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Timesheet disputed']);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SUMMARY / AGGREGATION
    // ═══════════════════════════════════════════════════════════════

    #[Route('GET', '/summary', name: 'time.summary', summary: 'Time tracking summary', tags: ['Time Tracking'])]
    public function summary(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $query  = $request->getQueryParams();

        $contractId = $query['contract_id'] ?? null;
        if (!$contractId) {
            return $this->error('contract_id is required');
        }

        $contract = $this->findContract($contractId, $userId);
        if ($contract instanceof JsonResponse) {
            return $contract;
        }

        // Aggregate time entries
        $stmt = $this->db->pdo()->prepare(
            'SELECT
                 COUNT(*)                                   AS total_entries,
                 COALESCE(SUM(duration_minutes), 0)         AS total_minutes,
                 COALESCE(SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END), 0) AS billable_minutes,
                 COALESCE(SUM(amount), 0)                   AS total_amount,
                 COALESCE(SUM(CASE WHEN status = \'approved\' THEN amount ELSE 0 END), 0) AS approved_amount,
                 COALESCE(SUM(CASE WHEN status = \'running\' THEN 1 ELSE 0 END), 0)       AS running_count
             FROM "timeentry"
             WHERE contract_id = :cid'
        );
        $stmt->execute(['cid' => $contractId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Current week hours vs limit
        $weekStart = (new \DateTimeImmutable('monday this week'))->format('Y-m-d');
        $weekEnd   = (new \DateTimeImmutable('sunday this week'))->format('Y-m-d 23:59:59');

        $weekStmt = $this->db->pdo()->prepare(
            'SELECT COALESCE(SUM(duration_minutes), 0) AS week_minutes
             FROM "timeentry"
             WHERE contract_id = :cid AND started_at >= :ws AND started_at <= :we'
        );
        $weekStmt->execute(['cid' => $contractId, 'ws' => $weekStart, 'we' => $weekEnd]);
        $weekData = $weekStmt->fetch(\PDO::FETCH_ASSOC);

        $stats['current_week_minutes']  = (int) $weekData['week_minutes'];
        $stats['weekly_hour_limit']     = $contract['weekly_hour_limit'] ?? null;
        $stats['hourly_rate']           = $contract['hourly_rate'] ?? null;

        return $this->json(['data' => $stats]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SCREENSHOTS
    // ═══════════════════════════════════════════════════════════════

    #[Route('GET', '/entries/{id}/screenshots', name: 'time.screenshots', summary: 'List screenshots for entry', tags: ['Time Tracking'])]
    public function screenshots(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) return $entry;

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "screenshot"
             WHERE time_entry_id = :eid AND deleted_at IS NULL
             ORDER BY captured_at ASC'
        );
        $stmt->execute(['eid' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('DELETE', '/screenshots/{id}', name: 'time.screenshot.delete', summary: 'Delete a screenshot and deduct time', tags: ['Time Tracking'])]
    public function deleteScreenshot(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        // Find the screenshot
        $stmt = $this->db->pdo()->prepare('SELECT * FROM "screenshot" WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $ss = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$ss) return $this->notFound('Screenshot');

        // Auth check via entry
        $entry = $this->findEntry($ss['time_entry_id'], $userId);
        if ($entry instanceof JsonResponse) return $entry;
        if ($entry['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can delete screenshots');
        }

        return $this->softDeleteScreenshotAndDeduct($ss, $entry);
    }

    #[Route('POST', '/screenshots/batch-delete', name: 'time.screenshot.batchDelete', summary: 'Batch delete screenshots', tags: ['Time Tracking'])]
    public function batchDeleteScreenshots(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $ids    = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return $this->error('ids array is required');
        }

        $deleted = 0;
        foreach ($ids as $ssId) {
            $stmt = $this->db->pdo()->prepare('SELECT * FROM "screenshot" WHERE id = :id AND deleted_at IS NULL');
            $stmt->execute(['id' => $ssId]);
            $ss = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$ss) continue;

            $entry = $this->findEntry($ss['time_entry_id'], $userId);
            if ($entry instanceof JsonResponse) continue;
            if ($entry['freelancer_id'] !== $userId) continue;

            $this->softDeleteScreenshotAndDeduct($ss, $entry);
            $deleted++;
        }

        return $this->json(['message' => "Deleted {$deleted} screenshot(s)", 'deleted' => $deleted]);
    }

    private function softDeleteScreenshotAndDeduct(array $ss, array $entry): JsonResponse
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Soft-delete the screenshot
        $this->db->pdo()->prepare(
            'UPDATE "screenshot" SET deleted_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $ss['id']]);

        // Count remaining screenshots for this entry
        $totalStmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "screenshot"
             WHERE time_entry_id = :eid AND deleted_at IS NULL'
        );
        $totalStmt->execute(['eid' => $entry['id']]);
        $remaining = (int) $totalStmt->fetchColumn();

        // Count original total (including soft-deleted)
        $origStmt = $this->db->pdo()->prepare(
            'SELECT COUNT(*) FROM "screenshot" WHERE time_entry_id = :eid'
        );
        $origStmt->execute(['eid' => $entry['id']]);
        $original = (int) $origStmt->fetchColumn();

        // Proportional deduction: new_duration = original_duration * (remaining / original)
        if ($original > 0 && $entry['duration_minutes'] > 0) {
            $newMins = (int) round($entry['duration_minutes'] * ($remaining / $original));
            $rate    = (float) $entry['hourly_rate'];
            $newAmt  = number_format(($newMins / 60) * $rate, 2, '.', '');

            $this->db->pdo()->prepare(
                'UPDATE "timeentry" SET duration_minutes = :dur, amount = :amt, updated_at = :now WHERE id = :id'
            )->execute([
                'dur' => $newMins,
                'amt' => $newAmt,
                'now' => $now,
                'id'  => $entry['id'],
            ]);
        }

        return $this->json([
            'message'        => 'Screenshot deleted',
            'remaining'      => $remaining,
            'duration_minutes' => $newMins ?? $entry['duration_minutes'],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CLAIMS
    // ═══════════════════════════════════════════════════════════════

    #[Route('POST', '/entries/{id}/claims', name: 'time.claim.create', summary: 'Client creates a claim', tags: ['Time Tracking'])]
    public function createClaim(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) return $entry;

        if ($entry['client_id'] !== $userId) {
            return $this->forbidden('Only the client can file a claim');
        }

        $data = $this->body($request);
        $msg  = trim($data['message'] ?? '');
        $type = $data['type'] ?? 'detail_request';

        if (!$msg) return $this->error('message is required');
        if (!in_array($type, ['detail_request', 'dispute'])) {
            return $this->error('type must be detail_request or dispute');
        }

        $claimId = $this->uuid();
        $now     = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->db->pdo()->prepare(
            'INSERT INTO "time_entry_claim"
                (id, time_entry_id, client_id, type, message, status, created_at)
             VALUES (:id, :eid, :cid, :type, :msg, \'open\', :now)'
        )->execute([
            'id'   => $claimId,
            'eid'  => $id,
            'cid'  => $userId,
            'type' => $type,
            'msg'  => $msg,
            'now'  => $now,
        ]);

        return $this->json([
            'message' => 'Claim created',
            'data'    => ['id' => $claimId, 'status' => 'open'],
        ], 201);
    }

    #[Route('GET', '/entries/{id}/claims', name: 'time.claims', summary: 'List claims for entry', tags: ['Time Tracking'])]
    public function listClaims(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $entry  = $this->findEntry($id, $userId);
        if ($entry instanceof JsonResponse) return $entry;

        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "time_entry_claim"
             WHERE time_entry_id = :eid
             ORDER BY created_at DESC'
        );
        $stmt->execute(['eid' => $id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    #[Route('PUT', '/claims/{id}/respond', name: 'time.claim.respond', summary: 'Freelancer responds to a claim', tags: ['Time Tracking'])]
    public function respondClaim(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        $data   = $this->body($request);
        $resp   = trim($data['response'] ?? '');

        if (!$resp) return $this->error('response is required');

        $stmt = $this->db->pdo()->prepare(
            'SELECT c.*, te.freelancer_id
             FROM "time_entry_claim" c
             JOIN "timeentry" te ON te.id = c.time_entry_id
             WHERE c.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $claim = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$claim) return $this->notFound('Claim');
        if ($claim['freelancer_id'] !== $userId) {
            return $this->forbidden('Only the freelancer can respond');
        }
        if ($claim['status'] === 'resolved') {
            return $this->error('Claim is already resolved');
        }

        $this->db->pdo()->prepare(
            'UPDATE "time_entry_claim" SET response = :resp, status = \'responded\' WHERE id = :id'
        )->execute(['resp' => $resp, 'id' => $id]);

        return $this->json(['message' => 'Response submitted']);
    }

    #[Route('PUT', '/claims/{id}/resolve', name: 'time.claim.resolve', summary: 'Client resolves a claim', tags: ['Time Tracking'])]
    public function resolveClaim(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);

        $stmt = $this->db->pdo()->prepare(
            'SELECT c.*, te.contract_id
             FROM "time_entry_claim" c
             JOIN "timeentry" te ON te.id = c.time_entry_id
             WHERE c.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $claim = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$claim) return $this->notFound('Claim');
        if ($claim['client_id'] !== $userId) {
            return $this->forbidden('Only the client can resolve a claim');
        }
        if ($claim['status'] === 'resolved') {
            return $this->error('Claim is already resolved');
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->db->pdo()->prepare(
            'UPDATE "time_entry_claim" SET status = \'resolved\', resolved_at = :now WHERE id = :id'
        )->execute(['now' => $now, 'id' => $id]);

        return $this->json(['message' => 'Claim resolved']);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════

    private function findContract(string $id, ?string $userId): array|JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT * FROM "contract" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $c = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$c) {
            return $this->notFound('Contract');
        }
        if ($c['client_id'] !== $userId && $c['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $c;
    }

    private function findEntry(string $id, ?string $userId): array|JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT te.*, c.client_id, c.freelancer_id
             FROM "timeentry" te JOIN "contract" c ON c.id = te.contract_id
             WHERE te.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $e = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$e) {
            return $this->notFound('Time entry');
        }
        if ($e['client_id'] !== $userId && $e['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $e;
    }

    private function findTimesheet(string $id, ?string $userId): array|JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT ts.*, c.client_id
             FROM "weeklytimesheet" ts JOIN "contract" c ON c.id = ts.contract_id
             WHERE ts.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $ts = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$ts) {
            return $this->notFound('Timesheet');
        }
        if ($ts['client_id'] !== $userId && $ts['freelancer_id'] !== $userId) {
            return $this->forbidden();
        }

        return $ts;
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
