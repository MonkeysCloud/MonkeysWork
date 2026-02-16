<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'saved_job')]
class SavedJob
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $user_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Job::class)]
    public string $job_id;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getJobId(): string { return $this->job_id; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setUserId(string $v): self { $this->user_id = $v; return $this; }
    public function setJobId(string $v): self { $this->job_id = $v; return $this; }
}
