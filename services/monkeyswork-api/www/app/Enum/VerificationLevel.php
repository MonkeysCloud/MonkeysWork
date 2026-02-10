<?php
declare(strict_types=1);

namespace App\Enum;

enum VerificationLevel: string
{
    case None     = 'none';
    case Basic    = 'basic';
    case Verified = 'verified';
    case Premium  = 'premium';
}
