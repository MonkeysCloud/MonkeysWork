<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'screenshot')]
class Screenshot
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: TimeEntry::class)]
    public string $time_entry_id;

    #[Field(type: 'text')]
    public string $file_url;

    #[Field(type: 'integer', default: 0, comment: 'Mouse clicks since last screenshot')]
    public int $click_count = 0;

    #[Field(type: 'integer', default: 0, comment: 'Keyboard presses since last screenshot')]
    public int $key_count = 0;

    #[Field(type: 'decimal', precision: 5, scale: 2, default: '0.00', comment: '0-100 activity %')]
    public string $activity_percent = '0.00';

    #[Field(type: 'timestamptz', comment: 'When the screenshot was captured')]
    public \DateTimeImmutable $captured_at;

    #[Field(type: 'timestamptz', nullable: true, comment: 'Soft-delete')]
    public ?\DateTimeImmutable $deleted_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getTimeEntryId(): string { return $this->time_entry_id; }
    public function getFileUrl(): string { return $this->file_url; }
    public function getClickCount(): int { return $this->click_count; }
    public function getKeyCount(): int { return $this->key_count; }
    public function getActivityPercent(): string { return $this->activity_percent; }
    public function getCapturedAt(): \DateTimeImmutable { return $this->captured_at; }
    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deleted_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setTimeEntryId(string $v): self { $this->time_entry_id = $v; return $this; }
    public function setFileUrl(string $v): self { $this->file_url = $v; return $this; }
    public function setClickCount(int $v): self { $this->click_count = $v; return $this; }
    public function setKeyCount(int $v): self { $this->key_count = $v; return $this; }
    public function setActivityPercent(string $v): self { $this->activity_percent = $v; return $this; }
    public function setCapturedAt(\DateTimeImmutable $v): self { $this->captured_at = $v; return $this; }
    public function setDeletedAt(?\DateTimeImmutable $v): self { $this->deleted_at = $v; return $this; }

    // ── Domain ──

    public function isDeleted(): bool { return $this->deleted_at !== null; }

    /**
     * Compute activity percentage from click + key counts.
     * Threshold: 100 events per 10-minute interval = 100%.
     */
    public function computeActivity(int $threshold = 100): self
    {
        $total = $this->click_count + $this->key_count;
        $pct = min(100.0, ($total / max(1, $threshold)) * 100);
        $this->activity_percent = number_format($pct, 2, '.', '');
        return $this;
    }

    public function softDelete(): self
    {
        $this->deleted_at = new \DateTimeImmutable();
        return $this;
    }
}
