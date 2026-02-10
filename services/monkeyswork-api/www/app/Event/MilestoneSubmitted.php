<?php
declare(strict_types=1);

namespace App\Event;

final class MilestoneSubmitted extends DomainEvent
{
    public function __construct(
        public readonly string $milestoneId,
        public readonly string $contractId,
        public readonly string $freelancerId,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'milestone.submitted'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'milestone_id'  => $this->milestoneId,
            'contract_id'   => $this->contractId,
            'freelancer_id' => $this->freelancerId,
        ];
    }
}
