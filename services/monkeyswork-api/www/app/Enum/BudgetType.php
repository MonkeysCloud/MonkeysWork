<?php
declare(strict_types=1);

namespace App\Enum;

enum BudgetType: string
{
    case Fixed  = 'fixed';
    case Hourly = 'hourly';
}
