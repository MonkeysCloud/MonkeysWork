<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Proposal;
use MonkeysLegion\Repository\EntityRepository;

class ProposalRepository extends EntityRepository
{
    protected string $table = 'proposals';
    protected string $entityClass = Proposal::class;
}
