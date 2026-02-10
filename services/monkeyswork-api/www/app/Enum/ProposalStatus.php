<?php
declare(strict_types=1);

namespace App\Enum;

enum ProposalStatus: string
{
    case Submitted   = 'submitted';
    case Viewed      = 'viewed';
    case Shortlisted = 'shortlisted';
    case Accepted    = 'accepted';
    case Rejected    = 'rejected';
    case Withdrawn   = 'withdrawn';
}
