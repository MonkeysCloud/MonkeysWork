<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\DisputeReason;
use App\Enum\DisputeStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'disputes')]
class Dispute
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'disputes')]
    public string $contract_id;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: Milestone::class)]
    public ?string $milestone_id = null;

    #[Field(type: 'uuid', comment: 'who raised it')]
    #[ManyToOne(targetEntity: User::class)]
    public string $raised_by;

    #[Field(type: 'enum', enumValues: ['quality', 'non_delivery', 'scope_change', 'payment', 'communication', 'other'])]
    public string $reason;

    #[Field(type: 'text')]
    public string $description;

    #[Field(type: 'json', default: '[]', comment: '[{url, name}]')]
    public array $evidence_urls = [];

    #[Field(type: 'enum', enumValues: ['open', 'under_review', 'resolved_client', 'resolved_freelancer', 'resolved_split', 'escalated'], default: 'open')]
    public string $status = 'open';

    #[Field(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    public ?string $resolution_amount = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $resolution_notes = null;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: User::class)]
    public ?string $resolved_by = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $resolved_at = null;

    #[Field(type: 'timestamptz', nullable: true, comment: 'deadline for awaiting party to respond')]
    public ?\DateTimeImmutable $response_deadline = null;

    #[Field(type: 'uuid', nullable: true, comment: 'user who must respond next')]
    #[ManyToOne(targetEntity: User::class)]
    public ?string $awaiting_response_from = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[OneToMany(targetEntity: DisputeMessage::class, mappedBy: 'dispute')]
    public array $messages = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getMilestoneId(): ?string { return $this->milestone_id; }
    public function getRaisedBy(): string { return $this->raised_by; }
    public function getReason(): string { return $this->reason; }
    public function getDescription(): string { return $this->description; }
    public function getEvidenceUrls(): array { return $this->evidence_urls; }
    public function getStatus(): string { return $this->status; }
    public function getResolutionAmount(): ?string { return $this->resolution_amount; }
    public function getResolutionNotes(): ?string { return $this->resolution_notes; }
    public function getResolvedBy(): ?string { return $this->resolved_by; }
    public function getResolvedAt(): ?\DateTimeImmutable { return $this->resolved_at; }
    public function getResponseDeadline(): ?\DateTimeImmutable { return $this->response_deadline; }
    public function getAwaitingResponseFrom(): ?string { return $this->awaiting_response_from; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getMessages(): array { return $this->messages; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setMilestoneId(?string $v): self { $this->milestone_id = $v; return $this; }
    public function setRaisedBy(string $v): self { $this->raised_by = $v; return $this; }
    public function setReasonValue(string $v): self { $this->reason = $v; return $this; }
    public function setDescription(string $v): self { $this->description = $v; return $this; }
    public function setEvidenceUrls(array $v): self { $this->evidence_urls = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setResolutionAmount(?string $v): self { $this->resolution_amount = $v; return $this; }
    public function setResolutionNotes(?string $v): self { $this->resolution_notes = $v; return $this; }
    public function setResolvedBy(?string $v): self { $this->resolved_by = $v; return $this; }
    public function setResolvedAt(?\DateTimeImmutable $v): self { $this->resolved_at = $v; return $this; }
    public function setResponseDeadline(?\DateTimeImmutable $v): self { $this->response_deadline = $v; return $this; }
    public function setAwaitingResponseFrom(?string $v): self { $this->awaiting_response_from = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addMessage(DisputeMessage $m): self { $this->messages[] = $m; return $this; }
    public function removeMessage(DisputeMessage $m): self { $this->messages = array_filter($this->messages, fn($i) => $i !== $m); return $this; }

    // ── Enum helpers ──

    public function getDisputeReason(): DisputeReason { return DisputeReason::from($this->reason); }
    public function setDisputeReason(DisputeReason $r): self { $this->reason = $r->value; return $this; }
    public function getDisputeStatus(): DisputeStatus { return DisputeStatus::from($this->status); }
    public function setDisputeStatus(DisputeStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function resolve(string $status, ?string $amount, string $notes, string $resolvedBy, ?\DateTimeImmutable $at = null): self
    {
        $this->status = $status;
        $this->resolution_amount = $amount;
        $this->resolution_notes = $notes;
        $this->resolved_by = $resolvedBy;
        $this->resolved_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function escalate(): self
    {
        $this->status = 'escalated';
        return $this;
    }
}
