<?php
declare(strict_types=1);

namespace App\Event;

final class DisputeResolved extends DomainEvent
{
    public function __construct(
        public readonly string $disputeId,
        public readonly string $contractId,
        public readonly string $resolution,
        public readonly string $resolvedBy,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'dispute.resolved'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'dispute_id'  => $this->disputeId,
            'contract_id' => $this->contractId,
            'resolution'  => $this->resolution,
            'resolved_by' => $this->resolvedBy,
        ];
    }
}
