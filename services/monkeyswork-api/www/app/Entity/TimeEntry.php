<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\TimeEntryStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'time_entries')]
class TimeEntry
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'timeEntries')]
    public string $contract_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $freelancer_id;

    #[Field(type: 'uuid', nullable: true, comment: 'Optional link to milestone')]
    #[ManyToOne(targetEntity: Milestone::class)]
    public ?string $milestone_id = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $started_at;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $ended_at = null;

    #[Field(type: 'integer', default: 0, comment: 'Duration in minutes, computed on stop')]
    public int $duration_minutes = 0;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'string', length: 200, nullable: true, comment: 'Category/task tag')]
    public ?string $task_label = null;

    #[Field(type: 'boolean', default: false, comment: 'false=live tracker, true=manual')]
    public bool $is_manual = false;

    #[Field(type: 'boolean', default: true)]
    public bool $is_billable = true;

    #[Field(type: 'decimal', precision: 10, scale: 2, comment: 'Snapshot from contract at log time')]
    public string $hourly_rate;

    #[Field(type: 'decimal', precision: 12, scale: 2, default: '0.00', comment: 'duration/60 × rate')]
    public string $amount = '0.00';

    #[Field(type: 'json', default: '[]', comment: 'Periodic screenshots from tracker')]
    public string $screenshot_urls = '[]';

    #[Field(type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '0-100 activity %')]
    public ?string $activity_score = null;

    #[Field(type: 'enum', enumValues: ['running', 'logged', 'approved', 'disputed', 'rejected'], default: 'running')]
    public string $status = 'running';

    #[Field(type: 'uuid', nullable: true, comment: 'Client who approved')]
    public ?string $approved_by = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $approved_at = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $rejected_reason = null;

    #[Field(type: 'uuid', nullable: true, comment: 'FK→invoice_lines once invoiced')]
    public ?string $invoice_line_id = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getFreelancerId(): string { return $this->freelancer_id; }
    public function getMilestoneId(): ?string { return $this->milestone_id; }
    public function getStartedAt(): \DateTimeImmutable { return $this->started_at; }
    public function getEndedAt(): ?\DateTimeImmutable { return $this->ended_at; }
    public function getDurationMinutes(): int { return $this->duration_minutes; }
    public function getDescription(): ?string { return $this->description; }
    public function getTaskLabel(): ?string { return $this->task_label; }
    public function isManual(): bool { return $this->is_manual; }
    public function isBillable(): bool { return $this->is_billable; }
    public function getHourlyRate(): string { return $this->hourly_rate; }
    public function getAmount(): string { return $this->amount; }
    public function getScreenshotUrls(): string { return $this->screenshot_urls; }
    public function getActivityScore(): ?string { return $this->activity_score; }
    public function getStatus(): string { return $this->status; }
    public function getApprovedBy(): ?string { return $this->approved_by; }
    public function getApprovedAt(): ?\DateTimeImmutable { return $this->approved_at; }
    public function getRejectedReason(): ?string { return $this->rejected_reason; }
    public function getInvoiceLineId(): ?string { return $this->invoice_line_id; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setFreelancerId(string $v): self { $this->freelancer_id = $v; return $this; }
    public function setMilestoneId(?string $v): self { $this->milestone_id = $v; return $this; }
    public function setStartedAt(\DateTimeImmutable $v): self { $this->started_at = $v; return $this; }
    public function setEndedAt(?\DateTimeImmutable $v): self { $this->ended_at = $v; return $this; }
    public function setDurationMinutes(int $v): self { $this->duration_minutes = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setTaskLabel(?string $v): self { $this->task_label = $v; return $this; }
    public function setIsManual(bool $v): self { $this->is_manual = $v; return $this; }
    public function setIsBillable(bool $v): self { $this->is_billable = $v; return $this; }
    public function setHourlyRate(string $v): self { $this->hourly_rate = $v; return $this; }
    public function setAmount(string $v): self { $this->amount = $v; return $this; }
    public function setScreenshotUrls(string $v): self { $this->screenshot_urls = $v; return $this; }
    public function setActivityScore(?string $v): self { $this->activity_score = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setApprovedBy(?string $v): self { $this->approved_by = $v; return $this; }
    public function setApprovedAt(?\DateTimeImmutable $v): self { $this->approved_at = $v; return $this; }
    public function setRejectedReason(?string $v): self { $this->rejected_reason = $v; return $this; }
    public function setInvoiceLineId(?string $v): self { $this->invoice_line_id = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Enum helpers ──

    public function getTimeEntryStatus(): TimeEntryStatus { return TimeEntryStatus::from($this->status); }
    public function setTimeEntryStatus(TimeEntryStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function isRunning(): bool { return $this->status === 'running'; }

    public function stop(?\DateTimeImmutable $at = null): self
    {
        $end = $at ?? new \DateTimeImmutable();
        $this->ended_at = $end;
        $this->duration_minutes = (int) round(($end->getTimestamp() - $this->started_at->getTimestamp()) / 60);
        $this->computeAmount();
        $this->status = 'logged';
        return $this;
    }

    public function computeAmount(): self
    {
        if ($this->is_billable && $this->duration_minutes > 0) {
            $hours = $this->duration_minutes / 60;
            $this->amount = number_format($hours * (float) $this->hourly_rate, 2, '.', '');
        } else {
            $this->amount = '0.00';
        }
        return $this;
    }

    public function approve(string $clientId, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'approved';
        $this->approved_by = $clientId;
        $this->approved_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function reject(string $reason): self
    {
        $this->status = 'rejected';
        $this->rejected_reason = $reason;
        return $this;
    }

    public function dispute(): self
    {
        $this->status = 'disputed';
        return $this;
    }

    public function getDurationFormatted(): string
    {
        $h = intdiv($this->duration_minutes, 60);
        $m = $this->duration_minutes % 60;
        return sprintf('%dh %02dm', $h, $m);
    }
}
