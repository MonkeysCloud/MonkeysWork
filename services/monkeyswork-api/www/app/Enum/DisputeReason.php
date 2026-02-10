<?php
declare(strict_types=1);

namespace App\Enum;

enum DisputeReason: string
{
    case Quality       = 'quality';
    case NonDelivery   = 'non_delivery';
    case ScopeChange   = 'scope_change';
    case Payment       = 'payment';
    case Communication = 'communication';
    case Other         = 'other';
}
