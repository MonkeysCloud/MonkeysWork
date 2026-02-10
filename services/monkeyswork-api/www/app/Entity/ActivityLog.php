<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'activity_log')]
class ActivityLog
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'activityLogs', nullable: true)]
    public ?string $user_id = null;

    #[Field(type: 'string', length: 100)]
    public string $action;

    #[Field(type: 'uuid', nullable: true)]
    public ?string $entity_id = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $entity_type = null;

    #[Field(type: 'json', default: '{}')]
    public array $metadata = [];

    #[Field(type: 'string', length: 45, nullable: true)]
    public ?string $ip_address = null;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $user_agent = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): ?string { return $this->user_id; }
    public function getAction(): string { return $this->action; }
    public function getEntityId(): ?string { return $this->entity_id; }
    public function getEntityType(): ?string { return $this->entity_type; }
    public function getMetadata(): array { return $this->metadata; }
    public function getIpAddress(): ?string { return $this->ip_address; }
    public function getUserAgent(): ?string { return $this->user_agent; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setUserId(?string $v): self { $this->user_id = $v; return $this; }
    public function setAction(string $v): self { $this->action = $v; return $this; }
    public function setEntityId(?string $v): self { $this->entity_id = $v; return $this; }
    public function setEntityType(?string $v): self { $this->entity_type = $v; return $this; }
    public function setMetadata(array $v): self { $this->metadata = $v; return $this; }
    public function setIpAddress(?string $v): self { $this->ip_address = $v; return $this; }
    public function setUserAgent(?string $v): self { $this->user_agent = $v; return $this; }
}
