<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\UserRole;
use App\Enum\UserStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\OneToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;
use MonkeysLegion\Entity\Attributes\ManyToMany;
use MonkeysLegion\Entity\Attributes\JoinTable;

use MonkeysLegion\Auth\Contract\AuthenticatableInterface;
use MonkeysLegion\Auth\Contract\HasRolesInterface;
use MonkeysLegion\Auth\Contract\HasPermissionsInterface;
use MonkeysLegion\Auth\Trait\AuthenticatableTrait;
use MonkeysLegion\Auth\Trait\HasRolesTrait;
use MonkeysLegion\Auth\Trait\HasPermissionsTrait;

#[Entity(table: 'users')]
class User implements
    AuthenticatableInterface,
    HasRolesInterface,
    HasPermissionsInterface
{
    use AuthenticatableTrait;
    use HasRolesTrait;
    use HasPermissionsTrait;

    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'string', length: 255, unique: true)]
    public string $email;

    #[Field(type: 'string', length: 255)]
    public string $password_hash;

    #[Field(type: 'enum', enumValues: ['client', 'freelancer', 'admin', 'ops'])]
    public string $role;

    #[Field(type: 'enum', enumValues: ['active', 'suspended', 'deactivated', 'pending_verification'], default: 'pending_verification')]
    public string $status;

    #[Field(type: 'string', length: 100)]
    public string $display_name;

    #[Field(type: 'string', length: 80, nullable: true)]
    public ?string $first_name = null;

    #[Field(type: 'string', length: 80, nullable: true)]
    public ?string $last_name = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $avatar_url = null;

    #[Field(type: 'string', length: 30, nullable: true)]
    public ?string $phone = null;

    #[Field(type: 'char', length: 2, nullable: true, comment: 'ISO 3166-1')]
    public ?string $country = null;

    #[Field(type: 'string', length: 50, default: 'UTC')]
    public string $timezone = 'UTC';

    #[Field(type: 'string', length: 10, default: 'en')]
    public string $locale = 'en';

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $email_verified_at = null;

    #[Field(type: 'boolean', default: false)]
    public bool $two_factor_enabled = false;

    #[Field(type: 'string', length: 255, nullable: true, comment: 'encrypted')]
    public ?string $two_factor_secret = null;

    #[Field(type: 'integer', default: 1)]
    public int $token_version = 1;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $last_login_at = null;

    #[Field(type: 'string', length: 45, nullable: true, comment: 'IPv4/v6')]
    public ?string $last_login_ip = null;

    #[Field(type: 'json', default: '{}')]
    public array $metadata = [];

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[Field(type: 'timestamptz', nullable: true, comment: 'soft delete')]
    public ?\DateTimeImmutable $deleted_at = null;

    // ── Relationships ──

    #[OneToOne(targetEntity: FreelancerProfile::class, mappedBy: 'user')]
    public ?FreelancerProfile $freelancerProfile = null;

    #[OneToOne(targetEntity: ClientProfile::class, mappedBy: 'user')]
    public ?ClientProfile $clientProfile = null;

    #[OneToMany(targetEntity: UserSession::class, mappedBy: 'user')]
    public array $sessions = [];

    #[OneToMany(targetEntity: UserOAuth::class, mappedBy: 'user')]
    public array $oauthAccounts = [];

    #[OneToMany(targetEntity: Verification::class, mappedBy: 'user')]
    public array $verifications = [];

    #[OneToMany(targetEntity: PaymentMethod::class, mappedBy: 'user')]
    public array $paymentMethods = [];

    #[OneToMany(targetEntity: Notification::class, mappedBy: 'user')]
    public array $notifications = [];

    #[OneToMany(targetEntity: ActivityLog::class, mappedBy: 'user')]
    public array $activityLogs = [];

    #[ManyToMany(targetEntity: Role::class, inversedBy: 'users')]
    #[JoinTable(name: 'user_roles', joinColumn: 'user_id', inverseColumn: 'role_id')]
    public array $roles = [];

    public array $permissions = [];

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getPasswordHash(): string { return $this->password_hash; }
    public function getRole(): string { return $this->role; }
    public function getStatus(): string { return $this->status; }
    public function getDisplayName(): string { return $this->display_name; }
    public function getFirstName(): ?string { return $this->first_name; }
    public function getLastName(): ?string { return $this->last_name; }
    public function getAvatarUrl(): ?string { return $this->avatar_url; }
    public function getPhone(): ?string { return $this->phone; }
    public function getCountry(): ?string { return $this->country; }
    public function getTimezone(): string { return $this->timezone; }
    public function getLocale(): string { return $this->locale; }
    public function getEmailVerifiedAt(): ?\DateTimeImmutable { return $this->email_verified_at; }
    public function isTwoFactorEnabled(): bool { return $this->two_factor_enabled; }
    public function getTwoFactorSecret(): ?string { return $this->two_factor_secret; }
    public function getTokenVersion(): int { return $this->token_version; }
    public function getLastLoginAt(): ?\DateTimeImmutable { return $this->last_login_at; }
    public function getLastLoginIp(): ?string { return $this->last_login_ip; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deleted_at; }
    public function getFreelancerProfile(): ?FreelancerProfile { return $this->freelancerProfile; }
    public function getClientProfile(): ?ClientProfile { return $this->clientProfile; }
    public function getSessions(): array { return $this->sessions; }
    public function getOauthAccounts(): array { return $this->oauthAccounts; }
    public function getVerifications(): array { return $this->verifications; }
    public function getPaymentMethods(): array { return $this->paymentMethods; }
    public function getNotifications(): array { return $this->notifications; }
    public function getActivityLogs(): array { return $this->activityLogs; }

    // ── Setters ──

    public function setEmail(string $email): self { $this->email = $email; return $this; }
    public function setPasswordHash(string $hash): self { $this->password_hash = $hash; return $this; }
    public function setRole(string $role): self { $this->role = $role; return $this; }
    public function setStatus(string $status): self { $this->status = $status; return $this; }
    public function setDisplayName(string $name): self { $this->display_name = $name; return $this; }
    public function setFirstName(?string $name): self { $this->first_name = $name; return $this; }
    public function setLastName(?string $name): self { $this->last_name = $name; return $this; }
    public function setAvatarUrl(?string $url): self { $this->avatar_url = $url; return $this; }
    public function setPhone(?string $phone): self { $this->phone = $phone; return $this; }
    public function setCountry(?string $country): self { $this->country = $country; return $this; }
    public function setTimezone(string $tz): self { $this->timezone = $tz; return $this; }
    public function setLocale(string $locale): self { $this->locale = $locale; return $this; }
    public function setEmailVerifiedAt(?\DateTimeImmutable $at): self { $this->email_verified_at = $at; return $this; }
    public function setTwoFactorEnabled(bool $enabled): self { $this->two_factor_enabled = $enabled; return $this; }
    public function setTwoFactorSecret(?string $secret): self { $this->two_factor_secret = $secret; return $this; }
    public function setTokenVersion(int $v): self { $this->token_version = $v; return $this; }
    public function setLastLoginAt(?\DateTimeImmutable $at): self { $this->last_login_at = $at; return $this; }
    public function setLastLoginIp(?string $ip): self { $this->last_login_ip = $ip; return $this; }
    public function setMetadata(array $meta): self { $this->metadata = $meta; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }
    public function setFreelancerProfile(?FreelancerProfile $p): self { $this->freelancerProfile = $p; return $this; }
    public function setClientProfile(?ClientProfile $p): self { $this->clientProfile = $p; return $this; }

    // ── Collection mutators ──

    public function addSession(UserSession $s): self { $this->sessions[] = $s; return $this; }
    public function removeSession(UserSession $s): self { $this->sessions = array_filter($this->sessions, fn($i) => $i !== $s); return $this; }

    public function addOauthAccount(UserOAuth $o): self { $this->oauthAccounts[] = $o; return $this; }
    public function removeOauthAccount(UserOAuth $o): self { $this->oauthAccounts = array_filter($this->oauthAccounts, fn($i) => $i !== $o); return $this; }

    public function addVerification(Verification $v): self { $this->verifications[] = $v; return $this; }
    public function removeVerification(Verification $v): self { $this->verifications = array_filter($this->verifications, fn($i) => $i !== $v); return $this; }

    public function addPaymentMethod(PaymentMethod $pm): self { $this->paymentMethods[] = $pm; return $this; }
    public function removePaymentMethod(PaymentMethod $pm): self { $this->paymentMethods = array_filter($this->paymentMethods, fn($i) => $i !== $pm); return $this; }

    public function addNotification(Notification $n): self { $this->notifications[] = $n; return $this; }
    public function removeNotification(Notification $n): self { $this->notifications = array_filter($this->notifications, fn($i) => $i !== $n); return $this; }

    public function addActivityLog(ActivityLog $a): self { $this->activityLogs[] = $a; return $this; }
    public function removeActivityLog(ActivityLog $a): self { $this->activityLogs = array_filter($this->activityLogs, fn($i) => $i !== $a); return $this; }

    // ── Enum helpers ──

    public function getUserRole(): UserRole { return UserRole::from($this->role); }
    public function setUserRole(UserRole $role): self { $this->role = $role->value; return $this; }
    public function getUserStatus(): UserStatus { return UserStatus::from($this->status); }
    public function setUserStatus(UserStatus $status): self { $this->status = $status->value; return $this; }

    // ── Domain methods ──

    public function bumpTokenVersion(): self { $this->token_version++; return $this; }

    public function markEmailVerified(?\DateTimeImmutable $at = null): self
    {
        $this->email_verified_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function softDelete(?\DateTimeImmutable $at = null): self
    {
        $this->deleted_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function restore(): self
    {
        $this->deleted_at = null;
        return $this;
    }

    public function isDeleted(): bool { return $this->deleted_at !== null; }

    // ── AuthenticatableInterface ──

    public function getAuthIdentifier(): int|string { return $this->id; }
    public function getAuthIdentifierName(): string { return 'id'; }
    public function getAuthPassword(): string { return $this->password_hash; }
    public function hasTwoFactorEnabled(): bool { return $this->two_factor_enabled; }
}
