<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\FeatureFlag;
use MonkeysLegion\Repository\EntityRepository;

class FeatureFlagRepository extends EntityRepository
{
    protected string $table = 'feature_flags';
    protected string $entityClass = FeatureFlag::class;
}
