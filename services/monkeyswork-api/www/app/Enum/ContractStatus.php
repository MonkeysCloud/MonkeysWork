<?php
declare(strict_types=1);

namespace App\Enum;

enum ContractStatus: string
{
    case Active    = 'active';
    case Paused    = 'paused';
    case Completed = 'completed';
    case Disputed  = 'disputed';
    case Cancelled = 'cancelled';
}
