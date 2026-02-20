<?php
declare(strict_types=1);

namespace App\Enum;

enum EscrowType: string
{
    case Fund        = 'fund';
    case FundFailed  = 'fund_failed';
    case Release     = 'release';
    case Refund      = 'refund';
    case DisputeHold   = 'dispute_hold';
    case DisputeRefund = 'dispute_refund';
    case PlatformFee   = 'platform_fee';
    case ClientFee   = 'client_fee';
}
