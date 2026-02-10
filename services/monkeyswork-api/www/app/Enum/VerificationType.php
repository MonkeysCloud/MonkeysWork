<?php
declare(strict_types=1);

namespace App\Enum;

enum VerificationType: string
{
    case Identity        = 'identity';
    case SkillAssessment = 'skill_assessment';
    case Portfolio       = 'portfolio';
    case WorkHistory     = 'work_history';
    case PaymentMethod   = 'payment_method';
}
