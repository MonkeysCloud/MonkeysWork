<?php
declare(strict_types=1);

namespace App\Event;

final class UserRegistered extends DomainEvent
{
    public function __construct(
        public readonly string $userId,
        public readonly string $email,
        public readonly string $role,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'user.registered'; }
    public function getTopic(): string { return self::TOPIC_VERIFICATION; }

    protected function payload(): array
    {
        return [
            'user_id' => $this->userId,
            'email'   => $this->email,
            'role'    => $this->role,
        ];
    }
}
