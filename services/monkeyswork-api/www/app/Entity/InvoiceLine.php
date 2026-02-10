<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'invoice_lines')]
class InvoiceLine
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Invoice::class, inversedBy: 'lines')]
    public string $invoice_id;

    #[Field(type: 'string', length: 255)]
    public string $description;

    #[Field(type: 'decimal', precision: 10, scale: 2)]
    public string $quantity;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $unit_price;

    #[Field(type: 'decimal', precision: 12, scale: 2)]
    public string $amount;

    #[Field(type: 'uuid', nullable: true, comment: 'optional link to milestone')]
    #[ManyToOne(targetEntity: Milestone::class)]
    public ?string $milestone_id = null;

    #[Field(type: 'integer', default: 0)]
    public int $sort_order = 0;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getInvoiceId(): string { return $this->invoice_id; }
    public function getDescription(): string { return $this->description; }
    public function getQuantity(): string { return $this->quantity; }
    public function getUnitPrice(): string { return $this->unit_price; }
    public function getAmount(): string { return $this->amount; }
    public function getMilestoneId(): ?string { return $this->milestone_id; }
    public function getSortOrder(): int { return $this->sort_order; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setInvoiceId(string $v): self { $this->invoice_id = $v; return $this; }
    public function setDescription(string $v): self { $this->description = $v; return $this; }
    public function setQuantity(string $v): self { $this->quantity = $v; return $this; }
    public function setUnitPrice(string $v): self { $this->unit_price = $v; return $this; }
    public function setAmount(string $v): self { $this->amount = $v; return $this; }
    public function setMilestoneId(?string $v): self { $this->milestone_id = $v; return $this; }
    public function setSortOrder(int $v): self { $this->sort_order = $v; return $this; }
}
