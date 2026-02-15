<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\WeeklyTimesheet;
use MonkeysLegion\Repository\EntityRepository;

class WeeklyTimesheetRepository extends EntityRepository
{
    protected string $table = 'weekly_timesheets';
    protected string $entityClass = WeeklyTimesheet::class;
}
