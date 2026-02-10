<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\InvoiceStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'invoices')]
class Invoice
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'invoices')]
    public string $contract_id;

    #[Field(type: 'string', length: 50, unique: true, comment: 'INV-2026-0001')]
    public string $invoice_number;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $subtotal;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $platform_fee;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $tax_amount;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $total;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'], default: 'draft')]
    public string $status = 'draft';

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $issued_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $due_at;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $paid_at = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $notes = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[OneToMany(targetEntity: InvoiceLine::class, mappedBy: 'invoice')]
    public array $lines = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getInvoiceNumber(): string { return $this->invoice_number; }
    public function getSubtotal(): string { return $this->subtotal; }
    public function getPlatformFee(): string { return $this->platform_fee; }
    public function getTaxAmount(): string { return $this->tax_amount; }
    public function getTotal(): string { return $this->total; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getIssuedAt(): \DateTimeImmutable { return $this->issued_at; }
    public function getDueAt(): \DateTimeImmutable { return $this->due_at; }
    public function getPaidAt(): ?\DateTimeImmutable { return $this->paid_at; }
    public function getNotes(): ?string { return $this->notes; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getLines(): array { return $this->lines; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setInvoiceNumber(string $v): self { $this->invoice_number = $v; return $this; }
    public function setSubtotal(string $v): self { $this->subtotal = $v; return $this; }
    public function setPlatformFee(string $v): self { $this->platform_fee = $v; return $this; }
    public function setTaxAmount(string $v): self { $this->tax_amount = $v; return $this; }
    public function setTotal(string $v): self { $this->total = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setIssuedAt(\DateTimeImmutable $v): self { $this->issued_at = $v; return $this; }
    public function setDueAt(\DateTimeImmutable $v): self { $this->due_at = $v; return $this; }
    public function setPaidAt(?\DateTimeImmutable $v): self { $this->paid_at = $v; return $this; }
    public function setNotes(?string $v): self { $this->notes = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addLine(InvoiceLine $l): self { $this->lines[] = $l; return $this; }
    public function removeLine(InvoiceLine $l): self { $this->lines = array_filter($this->lines, fn($i) => $i !== $l); return $this; }

    // ── Enum helpers ──

    public function getInvoiceStatus(): InvoiceStatus { return InvoiceStatus::from($this->status); }
    public function setInvoiceStatus(InvoiceStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function send(): self { $this->status = 'sent'; return $this; }

    public function markPaid(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'paid';
        $this->paid_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function markOverdue(): self { $this->status = 'overdue'; return $this; }
    public function cancelInvoice(): self { $this->status = 'cancelled'; return $this; }
    public function refund(): self { $this->status = 'refunded'; return $this; }
    public function isOverdue(): bool { return $this->status !== 'paid' && $this->due_at < new \DateTimeImmutable(); }
}
