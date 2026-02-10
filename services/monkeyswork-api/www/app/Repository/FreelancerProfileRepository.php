<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\FreelancerProfile;
use MonkeysLegion\Repository\EntityRepository;

class FreelancerProfileRepository extends EntityRepository
{
    protected string $table = 'freelancer_profiles';
    protected string $entityClass = FreelancerProfile::class;
}
