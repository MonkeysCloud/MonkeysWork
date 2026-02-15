<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\TimeEntry;
use MonkeysLegion\Repository\EntityRepository;

class TimeEntryRepository extends EntityRepository
{
    protected string $table = 'time_entries';
    protected string $entityClass = TimeEntry::class;
}
