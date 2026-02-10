<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Contract;
use MonkeysLegion\Repository\EntityRepository;

class ContractRepository extends EntityRepository
{
    protected string $table = 'contracts';
    protected string $entityClass = Contract::class;
}
