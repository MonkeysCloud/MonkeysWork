<?php
declare(strict_types=1);

namespace App\Event;

final class ProposalAccepted extends DomainEvent
{
    public function __construct(
        public readonly string $proposalId,
        public readonly string $jobId,
        public readonly string $freelancerId,
        public readonly string $clientId,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'proposal.accepted'; }
    public function getTopic(): string { return self::TOPIC_PROPOSAL; }

    protected function payload(): array
    {
        return [
            'proposal_id'   => $this->proposalId,
            'job_id'        => $this->jobId,
            'freelancer_id' => $this->freelancerId,
            'client_id'     => $this->clientId,
        ];
    }
}
