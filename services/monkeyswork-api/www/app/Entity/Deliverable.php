<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'deliverables')]
class Deliverable
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Milestone::class, inversedBy: 'deliverables')]
    public string $milestone_id;

    #[Field(type: 'text')]
    public string $file_url;

    #[Field(type: 'string', length: 255)]
    public string $file_name;

    #[Field(type: 'bigInt')]
    public int $file_size;

    #[Field(type: 'string', length: 100)]
    public string $mime_type;

    #[Field(type: 'text', nullable: true)]
    public ?string $notes = null;

    #[Field(type: 'integer', default: 0, comment: 'submission version')]
    public int $version = 0;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getMilestoneId(): string { return $this->milestone_id; }
    public function getFileUrl(): string { return $this->file_url; }
    public function getFileName(): string { return $this->file_name; }
    public function getFileSize(): int { return $this->file_size; }
    public function getMimeType(): string { return $this->mime_type; }
    public function getNotes(): ?string { return $this->notes; }
    public function getVersion(): int { return $this->version; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setMilestoneId(string $v): self { $this->milestone_id = $v; return $this; }
    public function setFileUrl(string $v): self { $this->file_url = $v; return $this; }
    public function setFileName(string $v): self { $this->file_name = $v; return $this; }
    public function setFileSize(int $v): self { $this->file_size = $v; return $this; }
    public function setMimeType(string $v): self { $this->mime_type = $v; return $this; }
    public function setNotes(?string $v): self { $this->notes = $v; return $this; }
    public function setVersion(int $v): self { $this->version = $v; return $this; }

    // ── Domain methods ──

    public function incrementVersion(): self { $this->version++; return $this; }
}
