<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'notifications')]
class Notification
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'notifications')]
    public string $user_id;

    #[Field(type: 'string', length: 100, comment: 'notification type key')]
    public string $type;

    #[Field(type: 'string', length: 255)]
    public string $title;

    #[Field(type: 'text', nullable: true)]
    public ?string $body = null;

    #[Field(type: 'json', default: '{}', comment: 'payload, deep-links')]
    public array $data = [];

    #[Field(type: 'string', length: 20, default: 'info', comment: 'info, warning, error, success')]
    public string $priority = 'info';

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $read_at = null;

    #[Field(type: 'string', length: 50, nullable: true, comment: 'in_app, email, push')]
    public ?string $channel = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getType(): string { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getBody(): ?string { return $this->body; }
    public function getData(): array { return $this->data; }
    public function getPriority(): string { return $this->priority; }
    public function getReadAt(): ?\DateTimeImmutable { return $this->read_at; }
    public function getChannel(): ?string { return $this->channel; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setUserId(string $v): self { $this->user_id = $v; return $this; }
    public function setType(string $v): self { $this->type = $v; return $this; }
    public function setTitle(string $v): self { $this->title = $v; return $this; }
    public function setBody(?string $v): self { $this->body = $v; return $this; }
    public function setData(array $v): self { $this->data = $v; return $this; }
    public function setPriority(string $v): self { $this->priority = $v; return $this; }
    public function setReadAt(?\DateTimeImmutable $v): self { $this->read_at = $v; return $this; }
    public function setChannel(?string $v): self { $this->channel = $v; return $this; }

    // ── Domain methods ──

    public function markRead(?\DateTimeImmutable $at = null): self
    {
        if ($this->read_at === null) {
            $this->read_at = $at ?? new \DateTimeImmutable();
        }
        return $this;
    }

    public function isRead(): bool { return $this->read_at !== null; }
}
