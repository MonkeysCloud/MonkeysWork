<?php
declare(strict_types=1);

namespace App\Enum;

enum DisputeStatus: string
{
    case Open               = 'open';
    case UnderReview        = 'under_review';
    case ResolvedClient     = 'resolved_client';
    case ResolvedFreelancer = 'resolved_freelancer';
    case ResolvedSplit      = 'resolved_split';
    case Escalated          = 'escalated';
}
