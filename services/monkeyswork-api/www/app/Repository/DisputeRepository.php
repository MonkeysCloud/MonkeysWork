<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Dispute;
use MonkeysLegion\Repository\EntityRepository;

class DisputeRepository extends EntityRepository
{
    protected string $table = 'disputes';
    protected string $entityClass = Dispute::class;
}
