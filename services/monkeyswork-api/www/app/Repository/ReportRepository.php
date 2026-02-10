<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Report;
use MonkeysLegion\Repository\EntityRepository;

class ReportRepository extends EntityRepository
{
    protected string $table = 'reports';
    protected string $entityClass = Report::class;
}
