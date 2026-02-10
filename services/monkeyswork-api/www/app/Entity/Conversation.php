<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\OneToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;
use MonkeysLegion\Entity\Attributes\ManyToMany;
use MonkeysLegion\Entity\Attributes\JoinTable;

#[Entity(table: 'conversations')]
class Conversation
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid', nullable: true, unique: true)]
    #[OneToOne(targetEntity: Contract::class, inversedBy: 'conversation')]
    public ?string $contract_id = null;

    #[Field(type: 'string', length: 200, nullable: true)]
    public ?string $title = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $last_message_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[ManyToMany(targetEntity: User::class, inversedBy: 'conversations')]
    #[JoinTable(name: 'conversation_participants', joinColumn: 'conversation_id', inverseColumn: 'user_id')]
    public array $participants = [];

    #[OneToMany(targetEntity: Message::class, mappedBy: 'conversation')]
    public array $messages = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): ?string { return $this->contract_id; }
    public function getTitle(): ?string { return $this->title; }
    public function getLastMessageAt(): ?\DateTimeImmutable { return $this->last_message_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getParticipants(): array { return $this->participants; }
    public function getMessages(): array { return $this->messages; }

    // ── Setters ──

    public function setContractId(?string $v): self { $this->contract_id = $v; return $this; }
    public function setTitle(?string $v): self { $this->title = $v; return $this; }
    public function setLastMessageAt(?\DateTimeImmutable $v): self { $this->last_message_at = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addParticipant(User $u): self { $this->participants[] = $u; return $this; }
    public function removeParticipant(User $u): self { $this->participants = array_filter($this->participants, fn($i) => $i !== $u); return $this; }

    public function addMessage(Message $m): self { $this->messages[] = $m; return $this; }
    public function removeMessage(Message $m): self { $this->messages = array_filter($this->messages, fn($i) => $i !== $m); return $this; }

    // ── Domain methods ──

    public function touchLastMessage(?\DateTimeImmutable $at = null): self
    {
        $this->last_message_at = $at ?? new \DateTimeImmutable();
        return $this;
    }
}
