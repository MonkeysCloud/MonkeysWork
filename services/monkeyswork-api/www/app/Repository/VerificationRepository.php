<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Verification;
use MonkeysLegion\Repository\EntityRepository;

class VerificationRepository extends EntityRepository
{
    protected string $table = 'verifications';
    protected string $entityClass = Verification::class;
}
