<?php
declare(strict_types=1);

namespace App\Event;

final class TimesheetSubmitted
{
    public function __construct(
        public readonly string $timesheetId,
        public readonly string $contractId,
        public readonly string $freelancerId,
        public readonly int    $totalMinutes,
        public readonly string $totalAmount,
    ) {}
}
