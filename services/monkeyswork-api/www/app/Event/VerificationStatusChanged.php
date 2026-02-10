<?php
declare(strict_types=1);

namespace App\Event;

final class VerificationStatusChanged extends DomainEvent
{
    public function __construct(
        public readonly string $verificationId,
        public readonly string $userId,
        public readonly string $newStatus,
        public readonly string $verificationType,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'verification.status_changed'; }
    public function getTopic(): string { return self::TOPIC_VERIFICATION; }

    protected function payload(): array
    {
        return [
            'verification_id'   => $this->verificationId,
            'user_id'           => $this->userId,
            'new_status'        => $this->newStatus,
            'verification_type' => $this->verificationType,
        ];
    }
}
