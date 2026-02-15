<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

/**
 * Polymorphic attachment — reusable across jobs, proposals, messages, etc.
 */
#[Entity(table: 'attachment')]
class Attachment
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    /** e.g. 'job', 'proposal', 'message' */
    #[Field(type: 'string', length: 50)]
    public string $entity_type;

    #[Field(type: 'uuid')]
    public string $entity_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $uploaded_by;

    #[Field(type: 'string', length: 255)]
    public string $file_name;

    #[Field(type: 'text')]
    public string $file_path;

    #[Field(type: 'text')]
    public string $file_url;

    #[Field(type: 'bigInt')]
    public int $file_size;

    #[Field(type: 'string', length: 100)]
    public string $mime_type;

    #[Field(type: 'smallInt')]
    public int $sort_order = 0;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getEntityType(): string { return $this->entity_type; }
    public function getEntityId(): string { return $this->entity_id; }
    public function getUploadedBy(): string { return $this->uploaded_by; }
    public function getFileName(): string { return $this->file_name; }
    public function getFilePath(): string { return $this->file_path; }
    public function getFileUrl(): string { return $this->file_url; }
    public function getFileSize(): int { return $this->file_size; }
    public function getMimeType(): string { return $this->mime_type; }
    public function getSortOrder(): int { return $this->sort_order; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'entity_type' => $this->entity_type,
            'entity_id'   => $this->entity_id,
            'uploaded_by' => $this->uploaded_by,
            'file_name'   => $this->file_name,
            'file_url'    => $this->file_url,
            'file_size'   => $this->file_size,
            'mime_type'   => $this->mime_type,
            'sort_order'  => $this->sort_order,
            'created_at'  => $this->created_at->format('c'),
        ];
    }
}
