<?php
declare(strict_types=1);

namespace App\Enum;

enum JobStatus: string
{
    case Draft      = 'draft';
    case Open       = 'open';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';
    case Suspended  = 'suspended';
}
