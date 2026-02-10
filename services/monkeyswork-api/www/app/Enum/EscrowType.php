<?php
declare(strict_types=1);

namespace App\Enum;

enum EscrowType: string
{
    case Fund        = 'fund';
    case Release     = 'release';
    case Refund      = 'refund';
    case DisputeHold = 'dispute_hold';
    case PlatformFee = 'platform_fee';
}
