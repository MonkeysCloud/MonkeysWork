<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Payout;
use MonkeysLegion\Repository\EntityRepository;

class PayoutRepository extends EntityRepository
{
    protected string $table = 'payouts';
    protected string $entityClass = Payout::class;
}
