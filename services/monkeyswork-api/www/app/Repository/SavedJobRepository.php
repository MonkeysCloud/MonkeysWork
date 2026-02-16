<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\SavedJob;
use MonkeysLegion\Repository\EntityRepository;

class SavedJobRepository extends EntityRepository
{
    protected string $table = 'saved_job';
    protected string $entityClass = SavedJob::class;
}
