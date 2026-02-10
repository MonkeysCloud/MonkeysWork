<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\ManyToMany;

#[Entity(table: 'skills')]
class Skill
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'string', length: 100, unique: true)]
    public string $name;

    #[Field(type: 'string', length: 120, unique: true, comment: 'URL-safe')]
    public string $slug;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: Category::class)]
    public ?string $category_id = null;

    #[Field(type: 'uuid', nullable: true, comment: 'self-ref hierarchy')]
    #[ManyToOne(targetEntity: self::class)]
    public ?string $parent_id = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'string', length: 50, nullable: true, comment: 'icon class name')]
    public ?string $icon = null;

    #[Field(type: 'boolean', default: true)]
    public bool $is_active = true;

    #[Field(type: 'integer', default: 0, comment: 'denormalized usage count')]
    public int $usage_count = 0;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[ManyToMany(targetEntity: FreelancerProfile::class, mappedBy: 'skills')]
    public array $freelancers = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getCategoryId(): ?string { return $this->category_id; }
    public function getParentId(): ?string { return $this->parent_id; }
    public function getDescription(): ?string { return $this->description; }
    public function getIcon(): ?string { return $this->icon; }
    public function isActive(): bool { return $this->is_active; }
    public function getUsageCount(): int { return $this->usage_count; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getFreelancers(): array { return $this->freelancers; }

    // ── Setters ──

    public function setName(string $v): self { $this->name = $v; return $this; }
    public function setSlug(string $v): self { $this->slug = $v; return $this; }
    public function setCategoryId(?string $v): self { $this->category_id = $v; return $this; }
    public function setParentId(?string $v): self { $this->parent_id = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setIcon(?string $v): self { $this->icon = $v; return $this; }
    public function setIsActive(bool $v): self { $this->is_active = $v; return $this; }
    public function setUsageCount(int $v): self { $this->usage_count = $v; return $this; }

    // ── Collection mutators ──

    public function addFreelancer(FreelancerProfile $f): self { $this->freelancers[] = $f; return $this; }
    public function removeFreelancer(FreelancerProfile $f): self { $this->freelancers = array_filter($this->freelancers, fn($i) => $i !== $f); return $this; }

    // ── Domain methods ──

    public function incrementUsageCount(): self { $this->usage_count++; return $this; }
    public function decrementUsageCount(): self { $this->usage_count = max(0, $this->usage_count - 1); return $this; }
}
