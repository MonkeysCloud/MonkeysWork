<?php
declare(strict_types=1);

namespace App\Event;

final class ContractStarted extends DomainEvent
{
    public function __construct(
        public readonly string $contractId,
        public readonly string $clientId,
        public readonly string $freelancerId,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'contract.started'; }
    public function getTopic(): string { return self::TOPIC_MILESTONE; }

    protected function payload(): array
    {
        return [
            'contract_id'   => $this->contractId,
            'client_id'     => $this->clientId,
            'freelancer_id' => $this->freelancerId,
        ];
    }
}
