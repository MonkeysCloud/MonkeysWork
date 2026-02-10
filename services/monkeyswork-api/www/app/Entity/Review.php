<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'reviews')]
class Review
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Contract::class, inversedBy: 'reviews')]
    public string $contract_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $reviewer_id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class)]
    public string $reviewee_id;

    #[Field(type: 'decimal', precision: 2, scale: 1, comment: '1.0-5.0')]
    public string $overall_rating;

    #[Field(type: 'decimal', precision: 2, scale: 1, nullable: true)]
    public ?string $communication_rating = null;

    #[Field(type: 'decimal', precision: 2, scale: 1, nullable: true)]
    public ?string $quality_rating = null;

    #[Field(type: 'decimal', precision: 2, scale: 1, nullable: true)]
    public ?string $timeliness_rating = null;

    #[Field(type: 'decimal', precision: 2, scale: 1, nullable: true)]
    public ?string $professionalism_rating = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $comment = null;

    #[Field(type: 'text', nullable: true, comment: 'reply from reviewee')]
    public ?string $response = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $response_at = null;

    #[Field(type: 'boolean', default: true)]
    public bool $is_public = true;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getContractId(): string { return $this->contract_id; }
    public function getReviewerId(): string { return $this->reviewer_id; }
    public function getRevieweeId(): string { return $this->reviewee_id; }
    public function getOverallRating(): string { return $this->overall_rating; }
    public function getCommunicationRating(): ?string { return $this->communication_rating; }
    public function getQualityRating(): ?string { return $this->quality_rating; }
    public function getTimelinessRating(): ?string { return $this->timeliness_rating; }
    public function getProfessionalismRating(): ?string { return $this->professionalism_rating; }
    public function getComment(): ?string { return $this->comment; }
    public function getResponse(): ?string { return $this->response; }
    public function getResponseAt(): ?\DateTimeImmutable { return $this->response_at; }
    public function isPublic(): bool { return $this->is_public; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setContractId(string $v): self { $this->contract_id = $v; return $this; }
    public function setReviewerId(string $v): self { $this->reviewer_id = $v; return $this; }
    public function setRevieweeId(string $v): self { $this->reviewee_id = $v; return $this; }
    public function setOverallRating(string $v): self { $this->overall_rating = $v; return $this; }
    public function setCommunicationRating(?string $v): self { $this->communication_rating = $v; return $this; }
    public function setQualityRating(?string $v): self { $this->quality_rating = $v; return $this; }
    public function setTimelinessRating(?string $v): self { $this->timeliness_rating = $v; return $this; }
    public function setProfessionalismRating(?string $v): self { $this->professionalism_rating = $v; return $this; }
    public function setComment(?string $v): self { $this->comment = $v; return $this; }
    public function setIsPublic(bool $v): self { $this->is_public = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Domain methods ──

    public function addResponse(string $text, ?\DateTimeImmutable $at = null): self
    {
        $this->response = $text;
        $this->response_at = $at ?? new \DateTimeImmutable();
        return $this;
    }
}
