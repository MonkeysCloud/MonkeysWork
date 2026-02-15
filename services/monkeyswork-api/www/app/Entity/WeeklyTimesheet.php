<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\TimesheetStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'weekly_timesheets')]
class WeeklyTimesheet
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'timesheets')]
    public string $contract_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $freelancer_id;

    #[Field(type: 'date', comment: 'Monday of the week')]
    public \DateTimeImmutable $week_start;

    #[Field(type: 'date', comment: 'Sunday of the week')]
    public \DateTimeImmutable $week_end;

    #[Field(type: 'integer', default: 0, comment: 'Sum of all entry minutes')]
    public int $total_minutes = 0;

    #[Field(type: 'integer', default: 0, comment: 'Only billable entries')]
    public int $billable_minutes = 0;

    #[Field(type: 'decimal', precision: 12, scale: 2, default: '0.00')]
    public string $total_amount = '0.00';

    #[Field(type: 'decimal', precision: 10, scale: 2, comment: 'Rate in effect')]
    public string $hourly_rate;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['pending', 'submitted', 'approved', 'disputed', 'paid'], default: 'pending')]
    public string $status = 'pending';

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $submitted_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $approved_at = null;

    #[Field(type: 'uuid', nullable: true, comment: 'Client who approved')]
    public ?string $approved_by = null;

    #[Field(type: 'text', nullable: true, comment: 'Freelancer notes')]
    public ?string $notes = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $client_feedback = null;

    #[Field(type: 'uuid', nullable: true, comment: 'FK→invoices once invoiced')]
    #[ManyToOne(targetEntity: Invoice::class)]
    public ?string $invoice_id = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // UNIQUE: (contract_id, week_start)

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getWeekStart(): \DateTimeImmutable { return $this->week_start; }
    public function getWeekEnd(): \DateTimeImmutable { return $this->week_end; }
    public function getTotalMinutes(): int { return $this->total_minutes; }
    public function getBillableMinutes(): int { return $this->billable_minutes; }
    public function getTotalAmount(): string { return $this->total_amount; }
    public function getHourlyRate(): string { return $this->hourly_rate; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getSubmittedAt(): ?\DateTimeImmutable { return $this->submitted_at; }
    public function getApprovedAt(): ?\DateTimeImmutable { return $this->approved_at; }
    public function getApprovedBy(): ?string { return $this->approved_by; }
    public function getNotes(): ?string { return $this->notes; }
    public function getClientFeedback(): ?string { return $this->client_feedback; }
    public function getInvoiceId(): ?string { return $this->invoice_id; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setWeekStart(\DateTimeImmutable $v): self { $this->week_start = $v; return $this; }
    public function setWeekEnd(\DateTimeImmutable $v): self { $this->week_end = $v; return $this; }
    public function setTotalMinutes(int $v): self { $this->total_minutes = $v; return $this; }
    public function setBillableMinutes(int $v): self { $this->billable_minutes = $v; return $this; }
    public function setTotalAmount(string $v): self { $this->total_amount = $v; return $this; }
    public function setHourlyRate(string $v): self { $this->hourly_rate = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setSubmittedAt(?\DateTimeImmutable $v): self { $this->submitted_at = $v; return $this; }
    public function setApprovedAt(?\DateTimeImmutable $v): self { $this->approved_at = $v; return $this; }
    public function setApprovedBy(?string $v): self { $this->approved_by = $v; return $this; }
    public function setNotes(?string $v): self { $this->notes = $v; return $this; }
    public function setClientFeedback(?string $v): self { $this->client_feedback = $v; return $this; }
    public function setInvoiceId(?string $v): self { $this->invoice_id = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Enum helpers ──

    public function getTimesheetStatus(): TimesheetStatus { return TimesheetStatus::from($this->status); }
    public function setTimesheetStatus(TimesheetStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function submit(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'submitted';
        $this->submitted_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function approve(string $clientId, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'approved';
        $this->approved_by = $clientId;
        $this->approved_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function dispute(string $feedback): self
    {
        $this->status = 'disputed';
        $this->client_feedback = $feedback;
        return $this;
    }

    public function markPaid(): self
    {
        $this->status = 'paid';
        return $this;
    }

    public function recalculate(int $totalMin, int $billableMin): self
    {
        $this->total_minutes    = $totalMin;
        $this->billable_minutes = $billableMin;
        $hours = $billableMin / 60;
        $this->total_amount = number_format($hours * (float) $this->hourly_rate, 2, '.', '');
        return $this;
    }

    public function getTotalFormatted(): string
    {
        $h = intdiv($this->total_minutes, 60);
        $m = $this->total_minutes % 60;
        return sprintf('%dh %02dm', $h, $m);
    }

    public function getBillableFormatted(): string
    {
        $h = intdiv($this->billable_minutes, 60);
        $m = $this->billable_minutes % 60;
        return sprintf('%dh %02dm', $h, $m);
    }
}
