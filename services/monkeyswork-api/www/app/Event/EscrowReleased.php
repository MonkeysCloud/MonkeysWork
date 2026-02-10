<?php
declare(strict_types=1);

namespace App\Event;

final class EscrowReleased extends DomainEvent
{
    public function __construct(
        public readonly string $transactionId,
        public readonly string $milestoneId,
        public readonly string $contractId,
        public readonly string $amount,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'escrow.released'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'transaction_id' => $this->transactionId,
            'milestone_id'   => $this->milestoneId,
            'contract_id'    => $this->contractId,
            'amount'         => $this->amount,
        ];
    }
}
