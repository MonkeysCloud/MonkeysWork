<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'user_oauth')]
class UserOAuth
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'oauthAccounts')]
    public string $user_id;

    #[Field(type: 'string', length: 30, comment: 'google, github, linkedin')]
    public string $provider;

    #[Field(type: 'string', length: 255)]
    public string $provider_user_id;

    #[Field(type: 'text', nullable: true, comment: 'encrypted')]
    public ?string $access_token = null;

    #[Field(type: 'text', nullable: true, comment: 'encrypted')]
    public ?string $refresh_token = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $expires_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getProvider(): string { return $this->provider; }
    public function getProviderUserId(): string { return $this->provider_user_id; }
    public function getAccessToken(): ?string { return $this->access_token; }
    public function getRefreshToken(): ?string { return $this->refresh_token; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expires_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setUserId(string $id): self { $this->user_id = $id; return $this; }
    public function setProvider(string $provider): self { $this->provider = $provider; return $this; }
    public function setProviderUserId(string $id): self { $this->provider_user_id = $id; return $this; }
    public function setAccessToken(?string $token): self { $this->access_token = $token; return $this; }
    public function setRefreshToken(?string $token): self { $this->refresh_token = $token; return $this; }
    public function setExpiresAt(?\DateTimeImmutable $at): self { $this->expires_at = $at; return $this; }

    // ── Domain methods ──

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at < new \DateTimeImmutable();
    }
}
