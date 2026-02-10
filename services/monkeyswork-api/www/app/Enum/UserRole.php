<?php
declare(strict_types=1);

namespace App\Enum;

enum UserRole: string
{
    case Client     = 'client';
    case Freelancer = 'freelancer';
    case Admin      = 'admin';
    case Ops        = 'ops';
}
