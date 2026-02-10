<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Milestone;
use MonkeysLegion\Repository\EntityRepository;

class MilestoneRepository extends EntityRepository
{
    protected string $table = 'milestones';
    protected string $entityClass = Milestone::class;
}
