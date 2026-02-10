<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\AiDecisionLog;
use MonkeysLegion\Repository\EntityRepository;

class AiDecisionLogRepository extends EntityRepository
{
    protected string $table = 'ai_decision_log';
    protected string $entityClass = AiDecisionLog::class;
}
