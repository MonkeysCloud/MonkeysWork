<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'dispute_messages')]
class DisputeMessage
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Dispute::class, inversedBy: 'messages')]
    public string $dispute_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $sender_id;

    #[Field(type: 'text')]
    public string $content;

    #[Field(type: 'json', default: '[]', comment: '[{url, name}]')]
    public array $attachments = [];

    #[Field(type: 'boolean', default: false)]
    public bool $is_internal = false;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getDisputeId(): string { return $this->dispute_id; }
    public function getSenderId(): string { return $this->sender_id; }
    public function getContent(): string { return $this->content; }
    public function getAttachments(): array { return $this->attachments; }
    public function isInternal(): bool { return $this->is_internal; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setDisputeId(string $v): self { $this->dispute_id = $v; return $this; }
    public function setSenderId(string $v): self { $this->sender_id = $v; return $this; }
    public function setContent(string $v): self { $this->content = $v; return $this; }
    public function setAttachments(array $v): self { $this->attachments = $v; return $this; }
    public function setIsInternal(bool $v): self { $this->is_internal = $v; return $this; }
}
