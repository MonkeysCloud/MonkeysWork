<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'reports')]
class Report
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $reporter_id;

    #[Field(type: 'uuid')]
    public string $reported_entity_id;

    #[Field(type: 'string', length: 50, comment: 'user, job, proposal, message')]
    public string $reported_entity_type;

    #[Field(type: 'string', length: 50, comment: 'fraud, abuse, spam, inappropriate, other')]
    public string $reason;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'json', default: '[]', comment: '[{url, name}]')]
    public array $evidence_urls = [];

    #[Field(type: 'string', length: 20, default: 'open', comment: 'open, reviewing, resolved, dismissed')]
    public string $status = 'open';

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: User::class)]
    public ?string $reviewed_by = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $resolution_notes = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $resolved_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getReporterId(): string { return $this->reporter_id; }
    public function getReportedEntityId(): string { return $this->reported_entity_id; }
    public function getReportedEntityType(): string { return $this->reported_entity_type; }
    public function getReason(): string { return $this->reason; }
    public function getDescription(): ?string { return $this->description; }
    public function getEvidenceUrls(): array { return $this->evidence_urls; }
    public function getStatus(): string { return $this->status; }
    public function getReviewedBy(): ?string { return $this->reviewed_by; }
    public function getResolutionNotes(): ?string { return $this->resolution_notes; }
    public function getResolvedAt(): ?\DateTimeImmutable { return $this->resolved_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setReporterId(string $v): self { $this->reporter_id = $v; return $this; }
    public function setReportedEntityId(string $v): self { $this->reported_entity_id = $v; return $this; }
    public function setReportedEntityType(string $v): self { $this->reported_entity_type = $v; return $this; }
    public function setReason(string $v): self { $this->reason = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setEvidenceUrls(array $v): self { $this->evidence_urls = $v; return $this; }
    public function setStatus(string $v): self { $this->status = $v; return $this; }
    public function setReviewedBy(?string $v): self { $this->reviewed_by = $v; return $this; }
    public function setResolutionNotes(?string $v): self { $this->resolution_notes = $v; return $this; }
    public function setResolvedAt(?\DateTimeImmutable $v): self { $this->resolved_at = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Domain methods ──

    public function startReview(): self { $this->status = 'reviewing'; return $this; }

    public function resolve(string $reviewerId, ?string $notes = null, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'resolved';
        $this->reviewed_by = $reviewerId;
        $this->resolution_notes = $notes;
        $this->resolved_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function dismiss(string $reviewerId, ?string $notes = null, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'dismissed';
        $this->reviewed_by = $reviewerId;
        $this->resolution_notes = $notes;
        $this->resolved_at = $at ?? new \DateTimeImmutable();
        return $this;
    }
}
