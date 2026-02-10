<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'messages')]
class Message
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Conversation::class, inversedBy: 'messages')]
    public string $conversation_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $sender_id;

    #[Field(type: 'text')]
    public string $content;

    #[Field(type: 'string', length: 30, default: 'text', comment: 'text, file, system')]
    public string $message_type = 'text';

    #[Field(type: 'json', default: '[]', comment: '[{url, name, size, mime}]')]
    public array $attachments = [];

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $read_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $edited_at = null;

    #[Field(type: 'timestamptz', nullable: true, comment: 'soft delete')]
    public ?\DateTimeImmutable $deleted_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getConversationId(): string { return $this->conversation_id; }
    public function getSenderId(): string { return $this->sender_id; }
    public function getContent(): string { return $this->content; }
    public function getMessageType(): string { return $this->message_type; }
    public function getAttachments(): array { return $this->attachments; }
    public function getReadAt(): ?\DateTimeImmutable { return $this->read_at; }
    public function getEditedAt(): ?\DateTimeImmutable { return $this->edited_at; }
    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deleted_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setConversationId(string $v): self { $this->conversation_id = $v; return $this; }
    public function setSenderId(string $v): self { $this->sender_id = $v; return $this; }
    public function setContent(string $v): self { $this->content = $v; return $this; }
    public function setMessageType(string $v): self { $this->message_type = $v; return $this; }
    public function setAttachments(array $v): self { $this->attachments = $v; return $this; }
    public function setReadAt(?\DateTimeImmutable $v): self { $this->read_at = $v; return $this; }
    public function setEditedAt(?\DateTimeImmutable $v): self { $this->edited_at = $v; return $this; }

    // ── Domain methods ──

    public function markRead(?\DateTimeImmutable $at = null): self
    {
        if ($this->read_at === null) {
            $this->read_at = $at ?? new \DateTimeImmutable();
        }
        return $this;
    }

    public function edit(string $newContent, ?\DateTimeImmutable $at = null): self
    {
        $this->content = $newContent;
        $this->edited_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function softDelete(?\DateTimeImmutable $at = null): self
    {
        $this->deleted_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function restore(): self
    {
        $this->deleted_at = null;
        return $this;
    }

    public function isDeleted(): bool { return $this->deleted_at !== null; }
    public function isRead(): bool { return $this->read_at !== null; }
    public function isEdited(): bool { return $this->edited_at !== null; }
}
