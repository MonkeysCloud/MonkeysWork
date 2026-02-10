<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;

#[Entity(table: 'ai_decision_log')]
class AiDecisionLog
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'string', length: 50, comment: 'scope, match, fraud, verification')]
    public string $decision_type;

    #[Field(type: 'string', length: 80)]
    public string $model_name;

    #[Field(type: 'string', length: 50)]
    public string $model_version;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $prompt_version = null;

    #[Field(type: 'text', nullable: true, comment: 'SHA hash of input, for reproducibility')]
    public ?string $input_hash = null;

    #[Field(type: 'json', default: '{}', comment: 'input data')]
    public array $input_data = [];

    #[Field(type: 'json', default: '{}', comment: 'model output')]
    public array $output_data = [];

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true)]
    public ?string $confidence = null;

    #[Field(type: 'string', length: 30, nullable: true, comment: 'accept, review, reject')]
    public ?string $action_taken = null;

    #[Field(type: 'integer', nullable: true, comment: 'milliseconds')]
    public ?int $latency_ms = null;

    #[Field(type: 'uuid', nullable: true, comment: 'job, proposal, contract, etc.')]
    public ?string $entity_id = null;

    #[Field(type: 'string', length: 50, nullable: true, comment: 'entity class')]
    public ?string $entity_type = null;

    #[Field(type: 'boolean', nullable: true, comment: 'human override')]
    public ?bool $human_override = null;

    #[Field(type: 'uuid', nullable: true, comment: 'who overrode')]
    public ?string $override_by = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $override_reason = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getDecisionType(): string { return $this->decision_type; }
    public function getModelName(): string { return $this->model_name; }
    public function getModelVersion(): string { return $this->model_version; }
    public function getPromptVersion(): ?string { return $this->prompt_version; }
    public function getInputHash(): ?string { return $this->input_hash; }
    public function getInputData(): array { return $this->input_data; }
    public function getOutputData(): array { return $this->output_data; }
    public function getConfidence(): ?string { return $this->confidence; }
    public function getActionTaken(): ?string { return $this->action_taken; }
    public function getLatencyMs(): ?int { return $this->latency_ms; }
    public function getEntityId(): ?string { return $this->entity_id; }
    public function getEntityType(): ?string { return $this->entity_type; }
    public function getHumanOverride(): ?bool { return $this->human_override; }
    public function getOverrideBy(): ?string { return $this->override_by; }
    public function getOverrideReason(): ?string { return $this->override_reason; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setDecisionType(string $v): self { $this->decision_type = $v; return $this; }
    public function setModelName(string $v): self { $this->model_name = $v; return $this; }
    public function setModelVersion(string $v): self { $this->model_version = $v; return $this; }
    public function setPromptVersion(?string $v): self { $this->prompt_version = $v; return $this; }
    public function setInputHash(?string $v): self { $this->input_hash = $v; return $this; }
    public function setInputData(array $v): self { $this->input_data = $v; return $this; }
    public function setOutputData(array $v): self { $this->output_data = $v; return $this; }
    public function setConfidence(?string $v): self { $this->confidence = $v; return $this; }
    public function setActionTaken(?string $v): self { $this->action_taken = $v; return $this; }
    public function setLatencyMs(?int $v): self { $this->latency_ms = $v; return $this; }
    public function setEntityId(?string $v): self { $this->entity_id = $v; return $this; }
    public function setEntityType(?string $v): self { $this->entity_type = $v; return $this; }

    // ── Domain methods ──

    public function recordOverride(string $userId, string $reason): self
    {
        $this->human_override = true;
        $this->override_by = $userId;
        $this->override_reason = $reason;
        return $this;
    }

    public function isOverridden(): bool { return $this->human_override === true; }
}
