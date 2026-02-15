<?php
declare(strict_types=1);

namespace App\Event;

final class TimeEntryLogged
{
    public function __construct(
        public readonly string $entryId,
        public readonly string $contractId,
        public readonly string $freelancerId,
        public readonly int    $durationMinutes,
        public readonly string $amount,
    ) {}
}
