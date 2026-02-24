<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\OneToMany;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'company')]
class Company
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid', comment: 'FK→users.id – creator / owner')]
    public string $owner_id;

    #[ManyToOne(targetEntity: User::class)]
    public ?User $owner = null;

    #[Field(type: 'string', length: 200)]
    public string $name;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $website = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $industry = null;

    #[Field(type: 'string', length: 20, nullable: true, comment: 'solo, 2-10, 11-50, 51-200, 201-500, 500+')]
    public ?string $size = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $description = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $logo_url = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $address = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $city = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $state = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $country = null;

    #[Field(type: 'string', length: 20, nullable: true)]
    public ?string $zip_code = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $tax_id = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $phone = null;

    #[Field(type: 'string', length: 255, nullable: true)]
    public ?string $email = null;

    #[Field(type: 'jsonb', default: '{}')]
    public string $metadata = '{}';

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    /** @var User[] */
    #[OneToMany(targetEntity: User::class, mappedBy: 'company')]
    public array $members = [];

    // ── Getters ──

    public function getId(): string
    {
        return $this->id;
    }
    public function getOwnerId(): string
    {
        return $this->owner_id;
    }
    public function getOwner(): ?User
    {
        return $this->owner;
    }
    public function getName(): string
    {
        return $this->name;
    }
    public function getWebsite(): ?string
    {
        return $this->website;
    }
    public function getIndustry(): ?string
    {
        return $this->industry;
    }
    public function getSize(): ?string
    {
        return $this->size;
    }
    public function getDescription(): ?string
    {
        return $this->description;
    }
    public function getLogoUrl(): ?string
    {
        return $this->logo_url;
    }
    public function getAddress(): ?string
    {
        return $this->address;
    }
    public function getCity(): ?string
    {
        return $this->city;
    }
    public function getState(): ?string
    {
        return $this->state;
    }
    public function getCountry(): ?string
    {
        return $this->country;
    }
    public function getZipCode(): ?string
    {
        return $this->zip_code;
    }
    public function getTaxId(): ?string
    {
        return $this->tax_id;
    }
    public function getPhone(): ?string
    {
        return $this->phone;
    }
    public function getEmail(): ?string
    {
        return $this->email;
    }
    public function getMetadata(): array
    {
        return json_decode($this->metadata, true) ?: [];
    }
    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->created_at;
    }
    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updated_at;
    }
    public function getMembers(): array
    {
        return $this->members;
    }

    // ── Setters ──

    public function setOwner(?User $u): self
    {
        $this->owner = $u;
        return $this;
    }
    public function setName(string $v): self
    {
        $this->name = $v;
        return $this;
    }
    public function setWebsite(?string $v): self
    {
        $this->website = $v;
        return $this;
    }
    public function setIndustry(?string $v): self
    {
        $this->industry = $v;
        return $this;
    }
    public function setSize(?string $v): self
    {
        $this->size = $v;
        return $this;
    }
    public function setDescription(?string $v): self
    {
        $this->description = $v;
        return $this;
    }
    public function setLogoUrl(?string $v): self
    {
        $this->logo_url = $v;
        return $this;
    }
    public function setAddress(?string $v): self
    {
        $this->address = $v;
        return $this;
    }
    public function setCity(?string $v): self
    {
        $this->city = $v;
        return $this;
    }
    public function setState(?string $v): self
    {
        $this->state = $v;
        return $this;
    }
    public function setCountry(?string $v): self
    {
        $this->country = $v;
        return $this;
    }
    public function setZipCode(?string $v): self
    {
        $this->zip_code = $v;
        return $this;
    }
    public function setTaxId(?string $v): self
    {
        $this->tax_id = $v;
        return $this;
    }
    public function setPhone(?string $v): self
    {
        $this->phone = $v;
        return $this;
    }
    public function setEmail(?string $v): self
    {
        $this->email = $v;
        return $this;
    }
    public function setMetadata(array $m): self
    {
        $this->metadata = json_encode($m);
        return $this;
    }
    public function setUpdatedAt(\DateTimeImmutable $at): self
    {
        $this->updated_at = $at;
        return $this;
    }

    // ── Collection mutators ──

    public function addMember(User $u): self
    {
        $this->members[] = $u;
        return $this;
    }
    public function removeMember(User $u): self
    {
        $this->members = array_filter($this->members, fn($m) => $m !== $u);
        return $this;
    }
}
