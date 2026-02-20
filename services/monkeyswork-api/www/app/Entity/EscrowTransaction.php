<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\EscrowType;
use App\Enum\EscrowStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'escrow_transactions')]
class EscrowTransaction
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'escrowTransactions')]
    public string $contract_id;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: Milestone::class)]
    public ?string $milestone_id = null;

    #[Field(type: 'enum', enumValues: ['fund', 'fund_failed', 'release', 'refund', 'dispute_hold', 'dispute_refund', 'platform_fee', 'client_fee'])]
    public string $type;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $amount;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['pending', 'completed', 'failed', 'reversed'], default: 'pending')]
    public string $status = 'pending';

    #[Field(type: 'string', length: 255, nullable: true, comment: 'external gateway ID')]
    public ?string $gateway_reference = null;

    #[Field(type: 'json', nullable: true, comment: 'gateway response blob')]
    public ?array $gateway_metadata = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $processed_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getMilestoneId(): ?string { return $this->milestone_id; }
    public function getType(): string { return $this->type; }
    public function getAmount(): string { return $this->amount; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getGatewayReference(): ?string { return $this->gateway_reference; }
    public function getGatewayMetadata(): ?array { return $this->gateway_metadata; }
    public function getProcessedAt(): ?\DateTimeImmutable { return $this->processed_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setMilestoneId(?string $v): self { $this->milestone_id = $v; return $this; }
    public function setTypeValue(string $v): self { $this->type = $v; return $this; }
    public function setAmount(string $v): self { $this->amount = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setGatewayReference(?string $v): self { $this->gateway_reference = $v; return $this; }
    public function setGatewayMetadata(?array $v): self { $this->gateway_metadata = $v; return $this; }
    public function setProcessedAt(?\DateTimeImmutable $v): self { $this->processed_at = $v; return $this; }

    // ── Enum helpers ──

    public function getEscrowType(): EscrowType { return EscrowType::from($this->type); }
    public function setEscrowType(EscrowType $t): self { $this->type = $t->value; return $this; }
    public function getEscrowStatus(): EscrowStatus { return EscrowStatus::from($this->status); }
    public function setEscrowStatus(EscrowStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function markCompleted(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'completed';
        $this->processed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function markFailed(): self { $this->status = 'failed'; return $this; }
    public function reverse(): self { $this->status = 'reversed'; return $this; }
}
