<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\BudgetType;
use App\Enum\ContractStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'contracts')]
class Contract
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[OneToOne(targetEntity: Job::class, inversedBy: 'contract')]
    public string $job_id;

    #[Field(type: 'uuid', unique: true)]
    #[OneToOne(targetEntity: Proposal::class, inversedBy: 'contract')]
    public string $proposal_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $client_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $freelancer_id;

    #[Field(type: 'string', length: 200)]
    public string $title;

    #[Field(type: 'text', nullable: true, comment: 'terms')]
    public ?string $description = null;

    #[Field(type: 'enum', enumValues: ['fixed', 'hourly'])]
    public string $contract_type;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $total_amount;

    #[Field(type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'if hourly')]
    public ?string $hourly_rate = null;

    #[Field(type: 'integer', nullable: true, comment: 'if hourly')]
    public ?int $weekly_hour_limit = null;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['active', 'paused', 'completed', 'disputed', 'cancelled'], default: 'active')]
    public string $status = 'active';

    #[Field(type: 'decimal', precision: 4, scale: 2, default: 10.00, comment: 'MonkeysWork cut')]
    public string $platform_fee_percent = '10.00';

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $started_at;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $completed_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $cancelled_at = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $cancellation_reason = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Relationships ──

    #[OneToMany(targetEntity: Milestone::class, mappedBy: 'contract')]
    public array $milestones = [];

    #[OneToMany(targetEntity: EscrowTransaction::class, mappedBy: 'contract')]
    public array $escrowTransactions = [];

    #[OneToMany(targetEntity: Invoice::class, mappedBy: 'contract')]
    public array $invoices = [];

    #[OneToMany(targetEntity: Dispute::class, mappedBy: 'contract')]
    public array $disputes = [];

    #[OneToMany(targetEntity: Review::class, mappedBy: 'contract')]
    public array $reviews = [];

    #[OneToOne(targetEntity: Conversation::class, mappedBy: 'contract')]
    public ?Conversation $conversation = null;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getJobId(): string { return $this->job_id; }
    public function getProposalId(): string { return $this->proposal_id; }
    public function getClientId(): string { return $this->client_id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getTitle(): string { return $this->title; }
    public function getDescription(): ?string { return $this->description; }
    public function getContractTypeValue(): string { return $this->contract_type; }
    public function getTotalAmount(): string { return $this->total_amount; }
    public function getHourlyRate(): ?string { return $this->hourly_rate; }
    public function getWeeklyHourLimit(): ?int { return $this->weekly_hour_limit; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getPlatformFeePercent(): string { return $this->platform_fee_percent; }
    public function getStartedAt(): \DateTimeImmutable { return $this->started_at; }
    public function getCompletedAt(): ?\DateTimeImmutable { return $this->completed_at; }
    public function getCancelledAt(): ?\DateTimeImmutable { return $this->cancelled_at; }
    public function getCancellationReason(): ?string { return $this->cancellation_reason; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getMilestones(): array { return $this->milestones; }
    public function getEscrowTransactions(): array { return $this->escrowTransactions; }
    public function getInvoices(): array { return $this->invoices; }
    public function getDisputes(): array { return $this->disputes; }
    public function getReviews(): array { return $this->reviews; }
    public function getConversation(): ?Conversation { return $this->conversation; }

    // ── Setters ──

    public function setJobId(string $v): self { $this->job_id = $v; return $this; }
    public function setProposalId(string $v): self { $this->proposal_id = $v; return $this; }
    public function setClientId(string $v): self { $this->client_id = $v; return $this; }
    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setTitle(string $v): self { $this->title = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setContractTypeValue(string $v): self { $this->contract_type = $v; return $this; }
    public function setTotalAmount(string $v): self { $this->total_amount = $v; return $this; }
    public function setHourlyRate(?string $v): self { $this->hourly_rate = $v; return $this; }
    public function setWeeklyHourLimit(?int $v): self { $this->weekly_hour_limit = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setPlatformFeePercent(string $v): self { $this->platform_fee_percent = $v; return $this; }
    public function setStartedAt(\DateTimeImmutable $v): self { $this->started_at = $v; return $this; }
    public function setCompletedAt(?\DateTimeImmutable $v): self { $this->completed_at = $v; return $this; }
    public function setCancelledAt(?\DateTimeImmutable $v): self { $this->cancelled_at = $v; return $this; }
    public function setCancellationReason(?string $v): self { $this->cancellation_reason = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }
    public function setConversation(?Conversation $c): self { $this->conversation = $c; return $this; }

    // ── Collection mutators ──

    public function addMilestone(Milestone $m): self { $this->milestones[] = $m; return $this; }
    public function removeMilestone(Milestone $m): self { $this->milestones = array_filter($this->milestones, fn($i) => $i !== $m); return $this; }

    public function addEscrowTransaction(EscrowTransaction $e): self { $this->escrowTransactions[] = $e; return $this; }
    public function removeEscrowTransaction(EscrowTransaction $e): self { $this->escrowTransactions = array_filter($this->escrowTransactions, fn($i) => $i !== $e); return $this; }

    public function addInvoice(Invoice $inv): self { $this->invoices[] = $inv; return $this; }
    public function removeInvoice(Invoice $inv): self { $this->invoices = array_filter($this->invoices, fn($i) => $i !== $inv); return $this; }

    public function addDispute(Dispute $d): self { $this->disputes[] = $d; return $this; }
    public function removeDispute(Dispute $d): self { $this->disputes = array_filter($this->disputes, fn($i) => $i !== $d); return $this; }

    public function addReview(Review $r): self { $this->reviews[] = $r; return $this; }
    public function removeReview(Review $r): self { $this->reviews = array_filter($this->reviews, fn($i) => $i !== $r); return $this; }

    // ── Enum helpers ──

    public function getContractStatus(): ContractStatus { return ContractStatus::from($this->status); }
    public function setContractStatus(ContractStatus $s): self { $this->status = $s->value; return $this; }
    public function getContractType(): BudgetType { return BudgetType::from($this->contract_type); }
    public function setContractType(BudgetType $t): self { $this->contract_type = $t->value; return $this; }

    // ── Domain methods ──

    public function complete(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'completed';
        $this->completed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function cancel(string $reason, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'cancelled';
        $this->cancellation_reason = $reason;
        $this->cancelled_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function pause(): self { $this->status = 'paused'; return $this; }
    public function resume(): self { $this->status = 'active'; return $this; }
}
