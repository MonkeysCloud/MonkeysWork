<?php
declare(strict_types=1);

namespace App\Event;

final class JobPublished extends DomainEvent
{
    public function __construct(
        public readonly string $jobId,
        public readonly string $clientId,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'job.published'; }
    public function getTopic(): string { return self::TOPIC_JOB; }

    protected function payload(): array
    {
        return [
            'job_id'    => $this->jobId,
            'client_id' => $this->clientId,
        ];
    }
}
