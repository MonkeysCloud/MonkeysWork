<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Job;
use MonkeysLegion\Repository\EntityRepository;

class JobRepository extends EntityRepository
{
    protected string $table = 'jobs';
    protected string $entityClass = Job::class;
}
