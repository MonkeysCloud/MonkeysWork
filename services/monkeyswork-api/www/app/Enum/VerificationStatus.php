<?php
declare(strict_types=1);

namespace App\Enum;

enum VerificationStatus: string
{
    case Pending      = 'pending';
    case InReview     = 'in_review';
    case AutoApproved = 'auto_approved';
    case AutoRejected = 'auto_rejected';
    case HumanReview  = 'human_review';
    case Approved     = 'approved';
    case Rejected     = 'rejected';
}
