<?php
declare(strict_types=1);

namespace App\Event;

final class ProposalSubmitted extends DomainEvent
{
    public function __construct(
        public readonly string $proposalId,
        public readonly string $jobId,
        public readonly string $freelancerId,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'proposal.submitted'; }
    public function getTopic(): string { return self::TOPIC_PROPOSAL; }

    protected function payload(): array
    {
        return [
            'proposal_id'   => $this->proposalId,
            'job_id'        => $this->jobId,
            'freelancer_id' => $this->freelancerId,
        ];
    }
}
