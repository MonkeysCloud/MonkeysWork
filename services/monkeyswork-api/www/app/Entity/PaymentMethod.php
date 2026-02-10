<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'payment_methods')]
class PaymentMethod
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'paymentMethods')]
    public string $user_id;

    #[Field(type: 'string', length: 30, comment: 'card, bank_account, paypal')]
    public string $type;

    #[Field(type: 'string', length: 30, comment: 'visa, mastercard, …')]
    public string $provider;

    #[Field(type: 'string', length: 10, comment: 'last 4 digits')]
    public string $last_four;

    #[Field(type: 'string', length: 255, nullable: true, comment: 'encrypted gateway token')]
    public ?string $token = null;

    #[Field(type: 'boolean', default: false)]
    public bool $is_default = false;

    #[Field(type: 'string', length: 7, nullable: true, comment: 'MM/YYYY')]
    public ?string $expiry = null;

    #[Field(type: 'json', nullable: true)]
    public ?array $metadata = null;

    #[Field(type: 'boolean', default: true)]
    public bool $is_active = true;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getType(): string { return $this->type; }
    public function getProvider(): string { return $this->provider; }
    public function getLastFour(): string { return $this->last_four; }
    public function getToken(): ?string { return $this->token; }
    public function isDefault(): bool { return $this->is_default; }
    public function getExpiry(): ?string { return $this->expiry; }
    public function getMetadata(): ?array { return $this->metadata; }
    public function isActive(): bool { return $this->is_active; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }

    // ── Setters ──

    public function setUserId(string $v): self { $this->user_id = $v; return $this; }
    public function setType(string $v): self { $this->type = $v; return $this; }
    public function setProvider(string $v): self { $this->provider = $v; return $this; }
    public function setLastFour(string $v): self { $this->last_four = $v; return $this; }
    public function setToken(?string $v): self { $this->token = $v; return $this; }
    public function setIsDefault(bool $v): self { $this->is_default = $v; return $this; }
    public function setExpiry(?string $v): self { $this->expiry = $v; return $this; }
    public function setMetadata(?array $v): self { $this->metadata = $v; return $this; }
    public function setIsActive(bool $v): self { $this->is_active = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Domain methods ──

    public function makeDefault(): self { $this->is_default = true; return $this; }
    public function removeDefault(): self { $this->is_default = false; return $this; }
    public function deactivate(): self { $this->is_active = false; return $this; }
    public function activate(): self { $this->is_active = true; return $this; }
}
