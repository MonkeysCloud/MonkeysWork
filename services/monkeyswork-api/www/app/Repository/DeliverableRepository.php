<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Deliverable;
use MonkeysLegion\Repository\EntityRepository;

class DeliverableRepository extends EntityRepository
{
    protected string $table = 'deliverables';
    protected string $entityClass = Deliverable::class;
}
