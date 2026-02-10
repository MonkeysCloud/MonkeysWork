<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'invitations')]
class Invitation
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Job::class, inversedBy: 'invitations')]
    public string $job_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $client_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $freelancer_id;

    #[Field(type: 'text', nullable: true, comment: 'personal note')]
    public ?string $message = null;

    #[Field(type: 'string', length: 20, default: 'pending', comment: 'pending, accepted, declined, expired')]
    public string $status = 'pending';

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $responded_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getJobId(): string { return $this->job_id; }
    public function getClientId(): string { return $this->client_id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getMessage(): ?string { return $this->message; }
    public function getStatus(): string { return $this->status; }
    public function getRespondedAt(): ?\DateTimeImmutable { return $this->responded_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setJobId(string $v): self { $this->job_id = $v; return $this; }
    public function setClientId(string $v): self { $this->client_id = $v; return $this; }
    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setMessage(?string $v): self { $this->message = $v; return $this; }
    public function setStatus(string $v): self { $this->status = $v; return $this; }
    public function setRespondedAt(?\DateTimeImmutable $v): self { $this->responded_at = $v; return $this; }

    // ── Domain methods ──

    public function accept(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'accepted';
        $this->responded_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function decline(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'declined';
        $this->responded_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function expire(): self
    {
        $this->status = 'expired';
        return $this;
    }
}
