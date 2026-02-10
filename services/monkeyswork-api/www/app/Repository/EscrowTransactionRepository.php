<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\EscrowTransaction;
use MonkeysLegion\Repository\EntityRepository;

class EscrowTransactionRepository extends EntityRepository
{
    protected string $table = 'escrow_transactions';
    protected string $entityClass = EscrowTransaction::class;
}
