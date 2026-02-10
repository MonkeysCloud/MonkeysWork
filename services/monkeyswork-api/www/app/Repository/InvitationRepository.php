<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Invitation;
use MonkeysLegion\Repository\EntityRepository;

class InvitationRepository extends EntityRepository
{
    protected string $table = 'invitations';
    protected string $entityClass = Invitation::class;
}
