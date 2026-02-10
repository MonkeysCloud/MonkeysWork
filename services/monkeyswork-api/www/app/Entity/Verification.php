<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\VerificationType;
use App\Enum\VerificationStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'verifications')]
class Verification
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'verifications')]
    public string $user_id;

    #[Field(type: 'enum', enumValues: ['identity', 'skill_assessment', 'portfolio', 'work_history', 'payment_method'])]
    public string $type;

    #[Field(type: 'enum', enumValues: ['pending', 'in_review', 'auto_approved', 'auto_rejected', 'human_review', 'approved', 'rejected'], default: 'pending')]
    public string $status = 'pending';

    #[Field(type: 'json', default: '{}', comment: 'submitted data & evidence')]
    public array $data = [];

    #[Field(type: 'json', nullable: true, comment: 'AI confidence scores')]
    public ?array $ai_result = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $ai_model_version = null;

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true)]
    public ?string $ai_confidence = null;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: User::class)]
    public ?string $reviewed_by = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $reviewer_notes = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $reviewed_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $expires_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getType(): string { return $this->type; }
    public function getStatus(): string { return $this->status; }
    public function getData(): array { return $this->data; }
    public function getAiResult(): ?array { return $this->ai_result; }
    public function getAiModelVersion(): ?string { return $this->ai_model_version; }
    public function getAiConfidence(): ?string { return $this->ai_confidence; }
    public function getReviewedBy(): ?string { return $this->reviewed_by; }
    public function getReviewerNotes(): ?string { return $this->reviewer_notes; }
    public function getReviewedAt(): ?\DateTimeImmutable { return $this->reviewed_at; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expires_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setUserId(string $v): self { $this->user_id = $v; return $this; }
    public function setTypeValue(string $v): self { $this->type = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setData(array $v): self { $this->data = $v; return $this; }
    public function setAiResult(?array $v): self { $this->ai_result = $v; return $this; }
    public function setAiModelVersion(?string $v): self { $this->ai_model_version = $v; return $this; }
    public function setAiConfidence(?string $v): self { $this->ai_confidence = $v; return $this; }
    public function setReviewedBy(?string $v): self { $this->reviewed_by = $v; return $this; }
    public function setReviewerNotes(?string $v): self { $this->reviewer_notes = $v; return $this; }
    public function setReviewedAt(?\DateTimeImmutable $v): self { $this->reviewed_at = $v; return $this; }
    public function setExpiresAt(?\DateTimeImmutable $v): self { $this->expires_at = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Enum helpers ──

    public function getVerificationType(): VerificationType { return VerificationType::from($this->type); }
    public function setVerificationType(VerificationType $t): self { $this->type = $t->value; return $this; }
    public function getVerificationStatus(): VerificationStatus { return VerificationStatus::from($this->status); }
    public function setVerificationStatus(VerificationStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function approve(string $reviewerId, ?string $notes = null, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'approved';
        $this->reviewed_by = $reviewerId;
        $this->reviewer_notes = $notes;
        $this->reviewed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function reject(string $reviewerId, ?string $notes = null, ?\DateTimeImmutable $at = null): self
    {
        $this->status = 'rejected';
        $this->reviewed_by = $reviewerId;
        $this->reviewer_notes = $notes;
        $this->reviewed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function autoApprove(?array $aiResult = null, ?string $confidence = null): self
    {
        $this->status = 'auto_approved';
        $this->ai_result = $aiResult;
        $this->ai_confidence = $confidence;
        return $this;
    }

    public function autoReject(?array $aiResult = null, ?string $confidence = null): self
    {
        $this->status = 'auto_rejected';
        $this->ai_result = $aiResult;
        $this->ai_confidence = $confidence;
        return $this;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at < new \DateTimeImmutable();
    }
}
