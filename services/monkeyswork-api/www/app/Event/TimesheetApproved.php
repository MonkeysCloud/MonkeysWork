<?php
declare(strict_types=1);

namespace App\Event;

final class TimesheetApproved
{
    public function __construct(
        public readonly string $timesheetId,
        public readonly string $contractId,
        public readonly string $clientId,
        public readonly string $freelancerId,
        public readonly string $totalAmount,
    ) {}
}
