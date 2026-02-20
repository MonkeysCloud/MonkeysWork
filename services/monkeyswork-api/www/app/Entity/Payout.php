<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\PayoutStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'payouts')]
class Payout
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: FreelancerProfile::class, inversedBy: 'payouts')]
    public string $freelancer_id;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: PaymentMethod::class)]
    public ?string $payment_method_id = null;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $amount;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'decimal', precision: 12, scale: 2, default: 0)]
    public string $fee = '0';

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $net_amount;

    #[Field(type: 'enum', enumValues: ['pending', 'processing', 'completed', 'failed', 'delayed'], default: 'pending')]
    public string $status = 'pending';

    #[Field(type: 'string', length: 255, nullable: true)]
    public ?string $gateway_reference = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $failure_reason = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $processed_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getPaymentMethodId(): ?string { return $this->payment_method_id; }
    public function getAmount(): string { return $this->amount; }
    public function getCurrency(): string { return $this->currency; }
    public function getFee(): string { return $this->fee; }
    public function getNetAmount(): string { return $this->net_amount; }
    public function getStatus(): string { return $this->status; }
    public function getGatewayReference(): ?string { return $this->gateway_reference; }
    public function getFailureReason(): ?string { return $this->failure_reason; }
    public function getProcessedAt(): ?\DateTimeImmutable { return $this->processed_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setPaymentMethodId(?string $v): self { $this->payment_method_id = $v; return $this; }
    public function setAmount(string $v): self { $this->amount = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setFee(string $v): self { $this->fee = $v; return $this; }
    public function setNetAmount(string $v): self { $this->net_amount = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setGatewayReference(?string $v): self { $this->gateway_reference = $v; return $this; }
    public function setFailureReason(?string $v): self { $this->failure_reason = $v; return $this; }
    public function setProcessedAt(?\DateTimeImmutable $v): self { $this->processed_at = $v; return $this; }

    // ── Enum helpers ──

    public function getPayoutStatus(): PayoutStatus { return PayoutStatus::from($this->status); }
    public function setPayoutStatus(PayoutStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function startProcessing(): self { $this->status = 'processing'; return $this; }

    public function markCompleted(?string $gatewayRef = null, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'completed';
        $this->gateway_reference = $gatewayRef ?? $this->gateway_reference;
        $this->processed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function markFailed(string $reason): self
    {
        $this->status = 'failed';
        $this->failure_reason = $reason;
        return $this;
    }

    public function markDelayed(string $reason): self
    {
        $this->status = 'delayed';
        $this->failure_reason = $reason;
        return $this;
    }
}
