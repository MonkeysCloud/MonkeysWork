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
use MonkeysLegion\Entity\Attributes\ManyToMany;
use MonkeysLegion\Entity\Attributes\JoinTable;

#[Entity(table: 'freelancer_profiles')]
class FreelancerProfile
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid', comment: 'PK = FK→users.id (1:1)')]
    public string $user_id;

    #[OneToOne(targetEntity: User::class, inversedBy: 'freelancerProfile')]
    public ?User $user = null;

    #[Field(type: 'string', length: 200, nullable: true)]
    public ?string $headline = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $bio = null;

    #[Field(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    public ?string $hourly_rate = null;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'integer', default: 0)]
    public int $experience_years = 0;

    #[Field(type: 'json', default: '[]', comment: '[{institution, degree, year}]')]
    public array $education = [];

    #[Field(type: 'json', default: '[]', comment: '[{name, issuer, year, url}]')]
    public array $certifications = [];

    #[Field(type: 'json', default: '[]')]
    public array $portfolio_urls = [];

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $website_url = null;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $github_url = null;

    #[Field(type: 'string', length: 500, nullable: true)]
    public ?string $linkedin_url = null;

    #[Field(type: 'enum', enumValues: ['none', 'basic', 'verified', 'premium'], default: 'none')]
    public string $verification_level = 'none';

    #[Field(type: 'string', length: 20, default: 'available')]
    public string $availability_status = 'available';

    #[Field(type: 'integer', nullable: true, default: 40)]
    public ?int $availability_hours_week = 40;

    #[Field(type: 'decimal', precision: 5, scale: 2, default: 0)]
    public string $response_rate = '0';

    #[Field(type: 'decimal', precision: 3, scale: 2, default: 0)]
    public string $avg_rating = '0';

    #[Field(type: 'integer', default: 0)]
    public int $total_reviews = 0;

    #[Field(type: 'integer', default: 0)]
    public int $total_jobs_completed = 0;

    #[Field(type: 'decimal', precision: 14, scale: 2, default: 0)]
    public string $total_earnings = '0';

    #[Field(type: 'decimal', precision: 10, scale: 1, default: 0)]
    public string $total_hours_logged = '0';

    #[Field(type: 'decimal', precision: 5, scale: 2, default: 0)]
    public string $success_rate = '0';

    #[Field(type: 'integer', default: 0, comment: '0-100 score')]
    public int $profile_completeness = 0;

    #[Field(type: 'text', nullable: true, comment: 'VECTOR(384) — pgvector')]
    public ?string $profile_embedding = null;

    #[Field(type: 'boolean', default: false, comment: 'admin curated')]
    public bool $featured = false;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Relationships ──

    #[ManyToMany(targetEntity: Skill::class, inversedBy: 'freelancers')]
    #[JoinTable(name: 'freelancer_skills', joinColumn: 'freelancer_id', inverseColumn: 'skill_id')]
    public array $skills = [];

    #[OneToMany(targetEntity: Proposal::class, mappedBy: 'freelancer')]
    public array $proposals = [];

    #[OneToMany(targetEntity: Payout::class, mappedBy: 'freelancer')]
    public array $payouts = [];

    // ── Getters ──

    public function getUserId(): string { return $this->user_id; }
    public function getUser(): ?User { return $this->user; }
    public function getHeadline(): ?string { return $this->headline; }
    public function getBio(): ?string { return $this->bio; }
    public function getHourlyRate(): ?string { return $this->hourly_rate; }
    public function getCurrency(): string { return $this->currency; }
    public function getExperienceYears(): int { return $this->experience_years; }
    public function getEducation(): array { return $this->education; }
    public function getCertifications(): array { return $this->certifications; }
    public function getPortfolioUrls(): array { return $this->portfolio_urls; }
    public function getWebsiteUrl(): ?string { return $this->website_url; }
    public function getGithubUrl(): ?string { return $this->github_url; }
    public function getLinkedinUrl(): ?string { return $this->linkedin_url; }
    public function getVerificationLevelValue(): string { return $this->verification_level; }
    public function getAvailabilityStatus(): string { return $this->availability_status; }
    public function getAvailabilityHoursWeek(): ?int { return $this->availability_hours_week; }
    public function getResponseRate(): string { return $this->response_rate; }
    public function getAvgRating(): string { return $this->avg_rating; }
    public function getTotalReviews(): int { return $this->total_reviews; }
    public function getTotalJobsCompleted(): int { return $this->total_jobs_completed; }
    public function getTotalEarnings(): string { return $this->total_earnings; }
    public function getTotalHoursLogged(): string { return $this->total_hours_logged; }
    public function getSuccessRate(): string { return $this->success_rate; }
    public function getProfileCompleteness(): int { return $this->profile_completeness; }
    public function getProfileEmbedding(): ?string { return $this->profile_embedding; }
    public function isFeatured(): bool { return $this->featured; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getSkills(): array { return $this->skills; }
    public function getProposals(): array { return $this->proposals; }
    public function getPayouts(): array { return $this->payouts; }

    // ── Setters ──

    public function setUser(?User $user): self { $this->user = $user; return $this; }
    public function setHeadline(?string $v): self { $this->headline = $v; return $this; }
    public function setBio(?string $v): self { $this->bio = $v; return $this; }
    public function setHourlyRate(?string $v): self { $this->hourly_rate = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setExperienceYears(int $v): self { $this->experience_years = $v; return $this; }
    public function setEducation(array $v): self { $this->education = $v; return $this; }
    public function setCertifications(array $v): self { $this->certifications = $v; return $this; }
    public function setPortfolioUrls(array $v): self { $this->portfolio_urls = $v; return $this; }
    public function setWebsiteUrl(?string $v): self { $this->website_url = $v; return $this; }
    public function setGithubUrl(?string $v): self { $this->github_url = $v; return $this; }
    public function setLinkedinUrl(?string $v): self { $this->linkedin_url = $v; return $this; }
    public function setAvailabilityStatus(string $v): self { $this->availability_status = $v; return $this; }
    public function setAvailabilityHoursWeek(?int $v): self { $this->availability_hours_week = $v; return $this; }
    public function setResponseRate(string $v): self { $this->response_rate = $v; return $this; }
    public function setAvgRating(string $v): self { $this->avg_rating = $v; return $this; }
    public function setTotalReviews(int $v): self { $this->total_reviews = $v; return $this; }
    public function setTotalJobsCompleted(int $v): self { $this->total_jobs_completed = $v; return $this; }
    public function setTotalEarnings(string $v): self { $this->total_earnings = $v; return $this; }
    public function setTotalHoursLogged(string $v): self { $this->total_hours_logged = $v; return $this; }
    public function setSuccessRate(string $v): self { $this->success_rate = $v; return $this; }
    public function setProfileCompleteness(int $v): self { $this->profile_completeness = $v; return $this; }
    public function setProfileEmbedding(?string $v): self { $this->profile_embedding = $v; return $this; }
    public function setFeatured(bool $v): self { $this->featured = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }

    // ── Collection mutators ──

    public function addSkill(Skill $s): self { $this->skills[] = $s; return $this; }
    public function removeSkill(Skill $s): self { $this->skills = array_filter($this->skills, fn($i) => $i !== $s); return $this; }

    public function addProposal(Proposal $p): self { $this->proposals[] = $p; return $this; }
    public function removeProposal(Proposal $p): self { $this->proposals = array_filter($this->proposals, fn($i) => $i !== $p); return $this; }

    public function addPayout(Payout $p): self { $this->payouts[] = $p; return $this; }
    public function removePayout(Payout $p): self { $this->payouts = array_filter($this->payouts, fn($i) => $i !== $p); return $this; }

    // ── Enum helpers ──

    public function getVerificationLevel(): VerificationLevel { return VerificationLevel::from($this->verification_level); }
    public function setVerificationLevel(VerificationLevel $level): self { $this->verification_level = $level->value; return $this; }
}
