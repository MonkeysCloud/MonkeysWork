<?php
declare(strict_types=1);

namespace App\Enum;

enum TimesheetStatus: string
{
    case Pending   = 'pending';
    case Submitted = 'submitted';
    case Approved  = 'approved';
    case Disputed  = 'disputed';
    case Paid      = 'paid';
}
