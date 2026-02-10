<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;

#[Entity(table: 'feature_flags')]
class FeatureFlag
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'string', length: 100, unique: true, comment: 'e.g. ai_scope, ai_match_v2')]
    public string $key;

    #[Field(type: 'string', length: 255, nullable: true)]
    public ?string $description = null;

    #[Field(type: 'boolean', default: false)]
    public bool $enabled = false;

    #[Field(type: 'integer', default: 0, comment: '0-100 rollout %')]
    public int $rollout_percent = 0;

    #[Field(type: 'json', nullable: true, comment: 'per-user or per-segment rules')]
    public ?array $rules = null;

    #[Field(type: 'json', nullable: true, comment: 'configuration payload')]
    public ?array $payload = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getKey(): string { return $this->key; }
    public function getDescription(): ?string { return $this->description; }
    public function isEnabled(): bool { return $this->enabled; }
    public function getRolloutPercent(): int { return $this->rollout_percent; }
    public function getRules(): ?array { return $this->rules; }
    public function getPayload(): ?array { return $this->payload; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setKey(string $v): self { $this->key = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setEnabled(bool $v): self { $this->enabled = $v; return $this; }
    public function setRolloutPercent(int $v): self { $this->rollout_percent = $v; return $this; }
    public function setRules(?array $v): self { $this->rules = $v; return $this; }
    public function setPayload(?array $v): self { $this->payload = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Domain methods ──

    public function enable(): self { $this->enabled = true; return $this; }
    public function disable(): self { $this->enabled = false; return $this; }

    public function setFullRollout(): self
    {
        $this->enabled = true;
        $this->rollout_percent = 100;
        return $this;
    }

    public function isActiveForPercent(int $hash): bool
    {
        return $this->enabled && ($hash % 100) < $this->rollout_percent;
    }
}
