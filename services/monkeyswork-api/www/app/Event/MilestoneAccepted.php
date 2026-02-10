<?php
declare(strict_types=1);

namespace App\Event;

final class MilestoneAccepted extends DomainEvent
{
    public function __construct(
        public readonly string $milestoneId,
        public readonly string $contractId,
        public readonly string $clientId,
        public readonly string $amount,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'milestone.accepted'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'milestone_id' => $this->milestoneId,
            'contract_id'  => $this->contractId,
            'client_id'    => $this->clientId,
            'amount'       => $this->amount,
        ];
    }
}
