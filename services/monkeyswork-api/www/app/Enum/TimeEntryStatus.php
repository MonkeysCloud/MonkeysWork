<?php
declare(strict_types=1);

namespace App\Enum;

enum TimeEntryStatus: string
{
    case Running  = 'running';
    case Logged   = 'logged';
    case Approved = 'approved';
    case Disputed = 'disputed';
    case Rejected = 'rejected';
}
