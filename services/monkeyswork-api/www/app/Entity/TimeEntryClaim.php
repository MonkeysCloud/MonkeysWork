<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'time_entry_claim')]
class TimeEntryClaim
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: TimeEntry::class)]
    public string $time_entry_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $client_id;

    #[Field(type: 'enum', enumValues: ['detail_request', 'dispute'], default: 'detail_request')]
    public string $type = 'detail_request';

    #[Field(type: 'text')]
    public string $message;

    #[Field(type: 'enum', enumValues: ['open', 'responded', 'resolved'], default: 'open')]
    public string $status = 'open';

    #[Field(type: 'text', nullable: true)]
    public ?string $response = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $resolved_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getTimeEntryId(): string { return $this->time_entry_id; }
    public function getClientId(): string { return $this->client_id; }
    public function getType(): string { return $this->type; }
    public function getMessage(): string { return $this->message; }
    public function getStatus(): string { return $this->status; }
    public function getResponse(): ?string { return $this->response; }
    public function getResolvedAt(): ?\DateTimeImmutable { return $this->resolved_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setTimeEntryId(string $v): self { $this->time_entry_id = $v; return $this; }
    public function setClientId(string $v): self { $this->client_id = $v; return $this; }
    public function setType(string $v): self { $this->type = $v; return $this; }
    public function setMessage(string $v): self { $this->message = $v; return $this; }
    public function setStatus(string $v): self { $this->status = $v; return $this; }
    public function setResponse(?string $v): self { $this->response = $v; return $this; }
    public function setResolvedAt(?\DateTimeImmutable $v): self { $this->resolved_at = $v; return $this; }

    // ── Domain ──

    public function respond(string $response): self
    {
        $this->response = $response;
        $this->status = 'responded';
        return $this;
    }

    public function resolve(): self
    {
        $this->status = 'resolved';
        $this->resolved_at = new \DateTimeImmutable();
        return $this;
    }
}
