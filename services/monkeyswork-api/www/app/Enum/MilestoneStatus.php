<?php
declare(strict_types=1);

namespace App\Enum;

enum MilestoneStatus: string
{
    case Pending           = 'pending';
    case InProgress        = 'in_progress';
    case Submitted         = 'submitted';
    case RevisionRequested = 'revision_requested';
    case Accepted          = 'accepted';
    case Disputed          = 'disputed';
}
