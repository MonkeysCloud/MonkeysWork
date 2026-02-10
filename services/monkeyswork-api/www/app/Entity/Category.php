<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'categories')]
class Category
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'string', length: 100, unique: true)]
    public string $name;

    #[Field(type: 'string', length: 120, unique: true)]
    public string $slug;

    #[Field(type: 'uuid', nullable: true, comment: 'parent tree')]
    #[ManyToOne(targetEntity: self::class)]
    public ?string $parent_id = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $icon = null;

    #[Field(type: 'integer', default: 0)]
    public int $sort_order = 0;

    #[Field(type: 'boolean', default: true)]
    public bool $is_active = true;

    #[Field(type: 'integer', default: 0, comment: 'denormalized')]
    public int $job_count = 0;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[OneToMany(targetEntity: Job::class, mappedBy: 'category')]
    public array $jobs = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getParentId(): ?string { return $this->parent_id; }
    public function getDescription(): ?string { return $this->description; }
    public function getIcon(): ?string { return $this->icon; }
    public function getSortOrder(): int { return $this->sort_order; }
    public function isActive(): bool { return $this->is_active; }
    public function getJobCount(): int { return $this->job_count; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getJobs(): array { return $this->jobs; }

    // ── Setters ──

    public function setName(string $v): self { $this->name = $v; return $this; }
    public function setSlug(string $v): self { $this->slug = $v; return $this; }
    public function setParentId(?string $v): self { $this->parent_id = $v; return $this; }
    public function setDescription(?string $v): self { $this->description = $v; return $this; }
    public function setIcon(?string $v): self { $this->icon = $v; return $this; }
    public function setSortOrder(int $v): self { $this->sort_order = $v; return $this; }
    public function setIsActive(bool $v): self { $this->is_active = $v; return $this; }
    public function setJobCount(int $v): self { $this->job_count = $v; return $this; }

    // ── Collection mutators ──

    public function addJob(Job $j): self { $this->jobs[] = $j; return $this; }
    public function removeJob(Job $j): self { $this->jobs = array_filter($this->jobs, fn($i) => $i !== $j); return $this; }
}
