<?php
declare(strict_types=1);

namespace App\Event;

final class DisputeOpened extends DomainEvent
{
    public function __construct(
        public readonly string $disputeId,
        public readonly string $contractId,
        public readonly string $openedBy,
        public readonly string $reason,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'dispute.opened'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'dispute_id'  => $this->disputeId,
            'contract_id' => $this->contractId,
            'opened_by'   => $this->openedBy,
            'reason'      => $this->reason,
        ];
    }
}
