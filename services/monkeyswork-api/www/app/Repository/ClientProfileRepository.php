<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\ClientProfile;
use MonkeysLegion\Repository\EntityRepository;

class ClientProfileRepository extends EntityRepository
{
    protected string $table = 'client_profiles';
    protected string $entityClass = ClientProfile::class;
}
