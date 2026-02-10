<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\ActivityLog;
use MonkeysLegion\Repository\EntityRepository;

class ActivityLogRepository extends EntityRepository
{
    protected string $table = 'activity_log';
    protected string $entityClass = ActivityLog::class;
}
