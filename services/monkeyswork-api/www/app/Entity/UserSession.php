<?php
declare(strict_types=1);

namespace App\Entity;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;

#[Entity(table: 'user_sessions')]
class UserSession
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: User::class, inversedBy: 'sessions')]
    public string $user_id;

    #[Field(type: 'string', length: 64, unique: true, comment: 'SHA-256 of JWT')]
    public string $token_hash;

    #[Field(type: 'string', length: 64, unique: true, nullable: true)]
    public ?string $refresh_token_hash = null;

    #[Field(type: 'string', length: 45)]
    public string $ip_address;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $user_agent = null;

    #[Field(type: 'string', length: 64, nullable: true)]
    public ?string $device_fingerprint = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $expires_at;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $revoked_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->user_id; }
    public function getTokenHash(): string { return $this->token_hash; }
    public function getRefreshTokenHash(): ?string { return $this->refresh_token_hash; }
    public function getIpAddress(): string { return $this->ip_address; }
    public function getUserAgent(): ?string { return $this->user_agent; }
    public function getDeviceFingerprint(): ?string { return $this->device_fingerprint; }
    public function getExpiresAt(): \DateTimeImmutable { return $this->expires_at; }
    public function getRevokedAt(): ?\DateTimeImmutable { return $this->revoked_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }

    // ── Setters ──

    public function setUserId(string $id): self { $this->user_id = $id; return $this; }
    public function setTokenHash(string $hash): self { $this->token_hash = $hash; return $this; }
    public function setRefreshTokenHash(?string $hash): self { $this->refresh_token_hash = $hash; return $this; }
    public function setIpAddress(string $ip): self { $this->ip_address = $ip; return $this; }
    public function setUserAgent(?string $ua): self { $this->user_agent = $ua; return $this; }
    public function setDeviceFingerprint(?string $fp): self { $this->device_fingerprint = $fp; return $this; }
    public function setExpiresAt(\DateTimeImmutable $at): self { $this->expires_at = $at; return $this; }
    public function setRevokedAt(?\DateTimeImmutable $at): self { $this->revoked_at = $at; return $this; }

    // ── Domain methods ──

    public function isExpired(): bool { return $this->expires_at < new \DateTimeImmutable(); }
    public function isRevoked(): bool { return $this->revoked_at !== null; }
    public function isValid(): bool { return !$this->isExpired() && !$this->isRevoked(); }

    public function revoke(?\DateTimeImmutable $at = null): self
    {
        $this->revoked_at = $at ?? new \DateTimeImmutable();
        return $this;
    }
}
