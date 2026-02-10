<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\MilestoneStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'milestones')]
class Milestone
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'milestones')]
    public string $contract_id;

    #[Field(type: 'string', length: 200)]
    public string $title;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $amount;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['pending', 'in_progress', 'submitted', 'revision_requested', 'accepted', 'disputed'], default: 'pending')]
    public string $status = 'pending';

    #[Field(type: 'integer', default: 0)]
    public int $sort_order = 0;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $due_date = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $started_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $submitted_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $completed_at = null;

    #[Field(type: 'integer', default: 0)]
    public int $revision_count = 0;

    #[Field(type: 'text', nullable: true)]
    public ?string $client_feedback = null;

    #[Field(type: 'boolean', default: false)]
    public bool $escrow_funded = false;

    #[Field(type: 'boolean', default: false)]
    public bool $escrow_released = false;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[OneToMany(targetEntity: Deliverable::class, mappedBy: 'milestone')]
    public array $deliverables = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getTitle(): string { return $this->title; }
    public function getDescription(): ?string { return $this->description; }
    public function getAmount(): string { return $this->amount; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getSortOrder(): int { return $this->sort_order; }
    public function getDueDate(): ?\DateTimeImmutable { return $this->due_date; }
    public function getStartedAt(): ?\DateTimeImmutable { return $this->started_at; }
    public function getSubmittedAt(): ?\DateTimeImmutable { return $this->submitted_at; }
    public function getCompletedAt(): ?\DateTimeImmutable { return $this->completed_at; }
    public function getRevisionCount(): int { return $this->revision_count; }
    public function getClientFeedback(): ?string { return $this->client_feedback; }
    public function isEscrowFunded(): bool { return $this->escrow_funded; }
    public function isEscrowReleased(): bool { return $this->escrow_released; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getDeliverables(): array { return $this->deliverables; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setTitle(string $v): self { $this->title = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setAmount(string $v): self { $this->amount = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setSortOrder(int $v): self { $this->sort_order = $v; return $this; }
    public function setDueDate(?\DateTimeImmutable $v): self { $this->due_date = $v; return $this; }
    public function setStartedAt(?\DateTimeImmutable $v): self { $this->started_at = $v; return $this; }
    public function setSubmittedAt(?\DateTimeImmutable $v): self { $this->submitted_at = $v; return $this; }
    public function setCompletedAt(?\DateTimeImmutable $v): self { $this->completed_at = $v; return $this; }
    public function setRevisionCount(int $v): self { $this->revision_count = $v; return $this; }
    public function setClientFeedback(?string $v): self { $this->client_feedback = $v; return $this; }
    public function setEscrowFunded(bool $v): self { $this->escrow_funded = $v; return $this; }
    public function setEscrowReleased(bool $v): self { $this->escrow_released = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addDeliverable(Deliverable $d): self { $this->deliverables[] = $d; return $this; }
    public function removeDeliverable(Deliverable $d): self { $this->deliverables = array_filter($this->deliverables, fn($i) => $i !== $d); return $this; }

    // ── Enum helpers ──

    public function getMilestoneStatus(): MilestoneStatus { return MilestoneStatus::from($this->status); }
    public function setMilestoneStatus(MilestoneStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function start(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'in_progress';
        $this->started_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function submit(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'submitted';
        $this->submitted_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function accept(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'accepted';
        $this->completed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function requestRevision(string $feedback): self
    {
        $this->status = 'revision_requested';
        $this->client_feedback = $feedback;
        $this->revision_count++;
        return $this;
    }

    public function fundEscrow(): self { $this->escrow_funded = true; return $this; }
    public function releaseEscrow(): self { $this->escrow_released = true; return $this; }
}
