<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\VerificationLevel;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\OneToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;

#[Entity(table: 'client_profiles')]
class ClientProfile
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid', comment: 'PK = FK→users.id (1:1)')]
    public string $user_id;

    #[OneToOne(targetEntity: User::class, inversedBy: 'clientProfile')]
    public ?User $user = null;

    #[Field(type: 'string', length: 200, nullable: true)]
    public ?string $company_name = null;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $company_website = null;

    #[Field(type: 'string', length: 20, nullable: true, comment: 'solo, 2-10, 11-50, 51-200, 201-500, 500+')]
    public ?string $company_size = null;

    #[Field(type: 'string', length: 100, nullable: true)]
    public ?string $industry = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $company_description = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $company_logo_url = null;

    #[Field(type: 'integer', default: 0)]
    public int $total_jobs_posted = 0;

    #[Field(type: 'decimal', precision: 14, scale: 2, default: 0)]
    public string $total_spent = '0';

    #[Field(type: 'decimal', precision: 3, scale: 2, default: 0)]
    public string $avg_rating_given = '0';

    #[Field(type: 'integer', default: 0)]
    public int $total_hires = 0;

    #[Field(type: 'boolean', default: false)]
    public bool $payment_verified = false;

    #[Field(type: 'enum', enumValues: ['none', 'basic', 'verified', 'premium'], default: 'none')]
    public string $verification_level = 'none';

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    #[OneToMany(targetEntity: Job::class, mappedBy: 'client')]
    public array $jobs = [];

    // ── Getters ──

    public function getUserId(): string { return $this->user_id; }
    public function getUser(): ?User { return $this->user; }
    public function getCompanyName(): ?string { return $this->company_name; }
    public function getCompanyWebsite(): ?string { return $this->company_website; }
    public function getCompanySize(): ?string { return $this->company_size; }
    public function getIndustry(): ?string { return $this->industry; }
    public function getCompanyDescription(): ?string { return $this->company_description; }
    public function getCompanyLogoUrl(): ?string { return $this->company_logo_url; }
    public function getTotalJobsPosted(): int { return $this->total_jobs_posted; }
    public function getTotalSpent(): string { return $this->total_spent; }
    public function getAvgRatingGiven(): string { return $this->avg_rating_given; }
    public function getTotalHires(): int { return $this->total_hires; }
    public function isPaymentVerified(): bool { return $this->payment_verified; }
    public function getVerificationLevelValue(): string { return $this->verification_level; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getJobs(): array { return $this->jobs; }

    // ── Setters ──

    public function setUser(?User $user): self { $this->user = $user; return $this; }
    public function setCompanyName(?string $v): self { $this->company_name = $v; return $this; }
    public function setCompanyWebsite(?string $v): self { $this->company_website = $v; return $this; }
    public function setCompanySize(?string $v): self { $this->company_size = $v; return $this; }
    public function setIndustry(?string $v): self { $this->industry = $v; return $this; }
    public function setCompanyDescription(?string $v): self { $this->company_description = $v; return $this; }
    public function setCompanyLogoUrl(?string $v): self { $this->company_logo_url = $v; return $this; }
    public function setTotalJobsPosted(int $v): self { $this->total_jobs_posted = $v; return $this; }
    public function setTotalSpent(string $v): self { $this->total_spent = $v; return $this; }
    public function setAvgRatingGiven(string $v): self { $this->avg_rating_given = $v; return $this; }
    public function setTotalHires(int $v): self { $this->total_hires = $v; return $this; }
    public function setPaymentVerified(bool $v): self { $this->payment_verified = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addJob(Job $j): self { $this->jobs[] = $j; return $this; }
    public function removeJob(Job $j): self { $this->jobs = array_filter($this->jobs, fn($i) => $i !== $j); return $this; }

    // ── Enum helpers ──

    public function getVerificationLevel(): VerificationLevel { return VerificationLevel::from($this->verification_level); }
    public function setVerificationLevel(VerificationLevel $level): self { $this->verification_level = $level->value; return $this; }
}
