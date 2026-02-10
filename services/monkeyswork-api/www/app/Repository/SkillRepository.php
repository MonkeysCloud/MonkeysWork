<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Skill;
use MonkeysLegion\Repository\EntityRepository;

class SkillRepository extends EntityRepository
{
    protected string $table = 'skills';
    protected string $entityClass = Skill::class;
}
