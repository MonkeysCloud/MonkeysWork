<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\BudgetType;
use App\Enum\ProposalStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToOne;

#[Entity(table: 'proposals')]
class Proposal
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Job::class, inversedBy: 'proposals')]
    public string $job_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: FreelancerProfile::class, inversedBy: 'proposals')]
    public string $freelancer_id;

    #[Field(type: 'text', nullable: true)]
    public ?string $cover_letter = null;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $bid_amount;

    #[Field(type: 'enum', enumValues: ['fixed', 'hourly'])]
    public string $bid_type;

    #[Field(type: 'integer', nullable: true)]
    public ?int $estimated_duration_days = null;

    #[Field(type: 'enum', enumValues: ['submitted', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'], default: 'submitted')]
    public string $status = 'submitted';

    #[Field(type: 'json', default: '[]', comment: '[{title, amount, days}]')]
    public array $milestones_proposed = [];

    #[Field(type: 'json', default: '[]', comment: '[{url, name, size}]')]
    public array $attachments = [];

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true, comment: '0.0000-1.0000')]
    public ?string $ai_match_score = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $ai_match_model_version = null;

    #[Field(type: 'json', nullable: true, comment: 'score components')]
    public ?array $ai_match_breakdown = null;

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true)]
    public ?string $ai_fraud_score = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $ai_fraud_model_version = null;

    #[Field(type: 'string', length: 20, nullable: true, comment: 'allow, review, block')]
    public ?string $ai_fraud_action = null;

    #[Field(type: 'timestamptz', nullable: true, comment: 'client first viewed')]
    public ?\DateTimeImmutable $viewed_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $shortlisted_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[OneToOne(targetEntity: Contract::class, mappedBy: 'proposal')]
    public ?Contract $contract = null;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getJobId(): string { return $this->job_id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getCoverLetter(): ?string { return $this->cover_letter; }
    public function getBidAmount(): string { return $this->bid_amount; }
    public function getBidTypeValue(): string { return $this->bid_type; }
    public function getEstimatedDurationDays(): ?int { return $this->estimated_duration_days; }
    public function getStatus(): string { return $this->status; }
    public function getMilestonesProposed(): array { return $this->milestones_proposed; }
    public function getAttachments(): array { return $this->attachments; }
    public function getAiMatchScore(): ?string { return $this->ai_match_score; }
    public function getAiMatchModelVersion(): ?string { return $this->ai_match_model_version; }
    public function getAiMatchBreakdown(): ?array { return $this->ai_match_breakdown; }
    public function getAiFraudScore(): ?string { return $this->ai_fraud_score; }
    public function getAiFraudModelVersion(): ?string { return $this->ai_fraud_model_version; }
    public function getAiFraudAction(): ?string { return $this->ai_fraud_action; }
    public function getViewedAt(): ?\DateTimeImmutable { return $this->viewed_at; }
    public function getShortlistedAt(): ?\DateTimeImmutable { return $this->shortlisted_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getContract(): ?Contract { return $this->contract; }

    // ── Setters ──

    public function setJobId(string $v): self { $this->job_id = $v; return $this; }
    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setCoverLetter(?string $v): self { $this->cover_letter = $v; return $this; }
    public function setBidAmount(string $v): self { $this->bid_amount = $v; return $this; }
    public function setBidTypeValue(string $v): self { $this->bid_type = $v; return $this; }
    public function setEstimatedDurationDays(?int $v): self { $this->estimated_duration_days = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setMilestonesProposed(array $v): self { $this->milestones_proposed = $v; return $this; }
    public function setAttachments(array $v): self { $this->attachments = $v; return $this; }
    public function setAiMatchScore(?string $v): self { $this->ai_match_score = $v; return $this; }
    public function setAiMatchModelVersion(?string $v): self { $this->ai_match_model_version = $v; return $this; }
    public function setAiMatchBreakdown(?array $v): self { $this->ai_match_breakdown = $v; return $this; }
    public function setAiFraudScore(?string $v): self { $this->ai_fraud_score = $v; return $this; }
    public function setAiFraudModelVersion(?string $v): self { $this->ai_fraud_model_version = $v; return $this; }
    public function setAiFraudAction(?string $v): self { $this->ai_fraud_action = $v; return $this; }
    public function setViewedAt(?\DateTimeImmutable $v): self { $this->viewed_at = $v; return $this; }
    public function setShortlistedAt(?\DateTimeImmutable $v): self { $this->shortlisted_at = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }
    public function setContract(?Contract $c): self { $this->contract = $c; return $this; }

    // ── Enum helpers ──

    public function getProposalStatus(): ProposalStatus { return ProposalStatus::from($this->status); }
    public function setProposalStatus(ProposalStatus $s): self { $this->status = $s->value; return $this; }
    public function getBidType(): BudgetType { return BudgetType::from($this->bid_type); }
    public function setBidType(BudgetType $t): self { $this->bid_type = $t->value; return $this; }

    // ── Domain methods ──

    public function markViewed(?\DateTimeImmutable $at = null): self
    {
        if ($this->viewed_at === null) {
            $this->viewed_at = $at ?? new \DateTimeImmutable();
        }
        return $this;
    }

    public function shortlist(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'shortlisted';
        $this->shortlisted_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function withdraw(): self
    {
        $this->status = 'withdrawn';
        return $this;
    }
}
