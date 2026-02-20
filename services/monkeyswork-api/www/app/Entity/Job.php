<?php
declare(strict_types=1);

namespace App\Entity;

use App\Enum\BudgetType;
use App\Enum\JobStatus;

use MonkeysLegion\Entity\Attributes\Entity;
use MonkeysLegion\Entity\Attributes\Id;
use MonkeysLegion\Entity\Attributes\Uuid;
use MonkeysLegion\Entity\Attributes\Field;
use MonkeysLegion\Entity\Attributes\ManyToOne;
use MonkeysLegion\Entity\Attributes\OneToMany;
use MonkeysLegion\Entity\Attributes\OneToOne;
use MonkeysLegion\Entity\Attributes\ManyToMany;
use MonkeysLegion\Entity\Attributes\JoinTable;

#[Entity(table: 'jobs')]
class Job
{
    #[Id]
    #[Uuid]
    #[Field(type: 'uuid')]
    public string $id;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: ClientProfile::class, inversedBy: 'jobs')]
    public string $client_id;

    #[Field(type: 'string', length: 200)]
    public string $title;

    #[Field(type: 'string', length: 250, unique: true)]
    public string $slug;

    #[Field(type: 'text')]
    public string $description;

    #[Field(type: 'text', nullable: true, comment: 'rendered HTML')]
    public ?string $description_html = null;

    #[Field(type: 'uuid')]
    #[ManyToOne(targetEntity: Category::class, inversedBy: 'jobs')]
    public string $category_id;

    #[Field(type: 'enum', enumValues: ['fixed', 'hourly'])]
    public string $budget_type;

    #[Field(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    public ?string $budget_min = null;

    #[Field(type: 'decimal', precision: 12, scale: 2, nullable: true)]
    public ?string $budget_max = null;

    #[Field(type: 'integer', nullable: true, comment: 'Max hours per week for hourly contracts')]
    public ?int $weekly_hours_limit = null;

    #[Field(type: 'char', length: 3, default: 'USD')]
    public string $currency = 'USD';

    #[Field(type: 'enum', enumValues: ['draft', 'pending_review', 'approved', 'rejected', 'revision_requested', 'open', 'in_progress', 'completed', 'cancelled', 'suspended'], default: 'draft')]
    public string $status = 'draft';

    #[Field(type: 'string', length: 20, default: 'public', comment: 'public, invite_only, private')]
    public string $visibility = 'public';

    #[Field(type: 'string', length: 20, nullable: true, comment: 'entry, intermediate, expert')]
    public ?string $experience_level = null;

    #[Field(type: 'string', length: 30, nullable: true)]
    public ?string $estimated_duration = null;

    #[Field(type: 'string', length: 20, default: 'remote', comment: 'remote, onsite, hybrid')]
    public string $location_requirement = 'remote';

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $timezone_preference = null;

    #[Field(type: 'string', length: 20, default: 'worldwide', comment: 'worldwide, regions, countries')]
    public string $location_type = 'worldwide';

    #[Field(type: 'json', default: '[]', comment: 'Region codes e.g. ["north_america","europe"]')]
    public array $location_regions = [];

    #[Field(type: 'json', default: '[]', comment: 'ISO country codes e.g. ["US","CA"]')]
    public array $location_countries = [];

    #[Field(type: 'integer', default: 0)]
    public int $proposals_count = 0;

    #[Field(type: 'integer', default: 0)]
    public int $views_count = 0;

    #[Field(type: 'text', nullable: true, comment: 'VECTOR(384) — pgvector')]
    public ?string $job_embedding = null;

    #[Field(type: 'json', default: '[]', comment: 'Client-defined milestones for fixed-price jobs')]
    public array $milestones_suggested = [];

    #[Field(type: 'json', nullable: true, comment: 'AI scope breakdown')]
    public ?array $ai_scope = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $ai_scope_model_version = null;

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true)]
    public ?string $ai_scope_confidence = null;

    // ── Moderation fields ──

    #[Field(type: 'enum', enumValues: ['none', 'pending', 'auto_approved', 'auto_rejected', 'human_review', 'approved', 'rejected'], default: 'none')]
    public string $moderation_status = 'none';

    #[Field(type: 'json', nullable: true, comment: 'AI content moderation output')]
    public ?array $moderation_ai_result = null;

    #[Field(type: 'decimal', precision: 5, scale: 4, nullable: true)]
    public ?string $moderation_ai_confidence = null;

    #[Field(type: 'string', length: 50, nullable: true)]
    public ?string $moderation_ai_model_version = null;

    #[Field(type: 'uuid', nullable: true)]
    #[ManyToOne(targetEntity: User::class)]
    public ?string $moderation_reviewed_by = null;

    #[Field(type: 'text', nullable: true)]
    public ?string $moderation_reviewer_notes = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $moderation_reviewed_at = null;

    #[Field(type: 'text', nullable: true, comment: 'tsvector for full-text search')]
    public ?string $search_vector = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $published_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $closed_at = null;

    #[Field(type: 'timestamptz', nullable: true)]
    public ?\DateTimeImmutable $expires_at = null;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $created_at;

    #[Field(type: 'timestamptz')]
    public \DateTimeImmutable $updated_at;

    // ── Relationships ──

    #[ManyToMany(targetEntity: Skill::class, inversedBy: 'jobs')]
    #[JoinTable(name: 'job_skills', joinColumn: 'job_id', inverseColumn: 'skill_id')]
    public array $skills = [];

    #[OneToMany(targetEntity: JobAttachment::class, mappedBy: 'job')]
    public array $attachments = [];

    #[OneToMany(targetEntity: Proposal::class, mappedBy: 'job')]
    public array $proposals = [];

    #[OneToMany(targetEntity: Invitation::class, mappedBy: 'job')]
    public array $invitations = [];

    #[OneToOne(targetEntity: Contract::class, mappedBy: 'job')]
    public ?Contract $contract = null;

    // ── Getters ──

    public function getId(): string { return $this->id; }
    public function getClientId(): string { return $this->client_id; }
    public function getTitle(): string { return $this->title; }
    public function getSlug(): string { return $this->slug; }
    public function getDescription(): string { return $this->description; }
    public function getDescriptionHtml(): ?string { return $this->description_html; }
    public function getCategoryId(): string { return $this->category_id; }
    public function getBudgetTypeValue(): string { return $this->budget_type; }
    public function getBudgetMin(): ?string { return $this->budget_min; }
    public function getBudgetMax(): ?string { return $this->budget_max; }
    public function getWeeklyHoursLimit(): ?int { return $this->weekly_hours_limit; }
    public function getCurrency(): string { return $this->currency; }
    public function getStatus(): string { return $this->status; }
    public function getVisibility(): string { return $this->visibility; }
    public function getExperienceLevel(): ?string { return $this->experience_level; }
    public function getEstimatedDuration(): ?string { return $this->estimated_duration; }
    public function getLocationRequirement(): string { return $this->location_requirement; }
    public function getTimezonePreference(): ?string { return $this->timezone_preference; }
    public function getLocationType(): string { return $this->location_type; }
    public function getLocationRegions(): array { return $this->location_regions; }
    public function getLocationCountries(): array { return $this->location_countries; }
    public function getProposalsCount(): int { return $this->proposals_count; }
    public function getViewsCount(): int { return $this->views_count; }
    public function getJobEmbedding(): ?string { return $this->job_embedding; }
    public function getMilestonesSuggested(): array { return $this->milestones_suggested; }
    public function getAiScope(): ?array { return $this->ai_scope; }
    public function getAiScopeModelVersion(): ?string { return $this->ai_scope_model_version; }
    public function getAiScopeConfidence(): ?string { return $this->ai_scope_confidence; }
    public function getModerationStatus(): string { return $this->moderation_status; }
    public function getModerationAiResult(): ?array { return $this->moderation_ai_result; }
    public function getModerationAiConfidence(): ?string { return $this->moderation_ai_confidence; }
    public function getModerationAiModelVersion(): ?string { return $this->moderation_ai_model_version; }
    public function getModerationReviewedBy(): ?string { return $this->moderation_reviewed_by; }
    public function getModerationReviewerNotes(): ?string { return $this->moderation_reviewer_notes; }
    public function getModerationReviewedAt(): ?\DateTimeImmutable { return $this->moderation_reviewed_at; }
    public function getSearchVector(): ?string { return $this->search_vector; }
    public function getPublishedAt(): ?\DateTimeImmutable { return $this->published_at; }
    public function getClosedAt(): ?\DateTimeImmutable { return $this->closed_at; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expires_at; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->created_at; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updated_at; }
    public function getSkills(): array { return $this->skills; }
    public function getAttachments(): array { return $this->attachments; }
    public function getProposals(): array { return $this->proposals; }
    public function getInvitations(): array { return $this->invitations; }
    public function getContract(): ?Contract { return $this->contract; }

    // ── Setters ──

    public function setClientId(string $v): self { $this->client_id = $v; return $this; }
    public function setTitle(string $v): self { $this->title = $v; return $this; }
    public function setSlug(string $v): self { $this->slug = $v; return $this; }
    public function setDescription(string $v): self { $this->description = $v; return $this; }
    public function setDescriptionHtml(?string $v): self { $this->description_html = $v; return $this; }
    public function setCategoryId(string $v): self { $this->category_id = $v; return $this; }
    public function setBudgetTypeValue(string $v): self { $this->budget_type = $v; return $this; }
    public function setBudgetMin(?string $v): self { $this->budget_min = $v; return $this; }
    public function setBudgetMax(?string $v): self { $this->budget_max = $v; return $this; }
    public function setWeeklyHoursLimit(?int $v): self { $this->weekly_hours_limit = $v; return $this; }
    public function setCurrency(string $v): self { $this->currency = $v; return $this; }
    public function setStatusValue(string $v): self { $this->status = $v; return $this; }
    public function setVisibility(string $v): self { $this->visibility = $v; return $this; }
    public function setExperienceLevel(?string $v): self { $this->experience_level = $v; return $this; }
    public function setEstimatedDuration(?string $v): self { $this->estimated_duration = $v; return $this; }
    public function setLocationRequirement(string $v): self { $this->location_requirement = $v; return $this; }
    public function setTimezonePreference(?string $v): self { $this->timezone_preference = $v; return $this; }
    public function setProposalsCount(int $v): self { $this->proposals_count = $v; return $this; }
    public function setViewsCount(int $v): self { $this->views_count = $v; return $this; }
    public function setJobEmbedding(?string $v): self { $this->job_embedding = $v; return $this; }
    public function setMilestonesSuggested(array $v): self { $this->milestones_suggested = $v; return $this; }
    public function setAiScope(?array $v): self { $this->ai_scope = $v; return $this; }
    public function setAiScopeModelVersion(?string $v): self { $this->ai_scope_model_version = $v; return $this; }
    public function setAiScopeConfidence(?string $v): self { $this->ai_scope_confidence = $v; return $this; }
    public function setModerationStatus(string $v): self { $this->moderation_status = $v; return $this; }
    public function setModerationAiResult(?array $v): self { $this->moderation_ai_result = $v; return $this; }
    public function setModerationAiConfidence(?string $v): self { $this->moderation_ai_confidence = $v; return $this; }
    public function setModerationAiModelVersion(?string $v): self { $this->moderation_ai_model_version = $v; return $this; }
    public function setModerationReviewedBy(?string $v): self { $this->moderation_reviewed_by = $v; return $this; }
    public function setModerationReviewerNotes(?string $v): self { $this->moderation_reviewer_notes = $v; return $this; }
    public function setModerationReviewedAt(?\DateTimeImmutable $v): self { $this->moderation_reviewed_at = $v; return $this; }
    public function setSearchVector(?string $v): self { $this->search_vector = $v; return $this; }
    public function setPublishedAt(?\DateTimeImmutable $v): self { $this->published_at = $v; return $this; }
    public function setClosedAt(?\DateTimeImmutable $v): self { $this->closed_at = $v; return $this; }
    public function setExpiresAt(?\DateTimeImmutable $v): self { $this->expires_at = $v; return $this; }
    public function setUpdatedAt(\DateTimeImmutable $at): self { $this->updated_at = $at; return $this; }
    public function setContract(?Contract $c): self { $this->contract = $c; return $this; }

    // ── Collection mutators ──

    public function addSkill(Skill $s): self { $this->skills[] = $s; return $this; }
    public function removeSkill(Skill $s): self { $this->skills = array_filter($this->skills, fn($i) => $i !== $s); return $this; }

    public function addAttachment(JobAttachment $a): self { $this->attachments[] = $a; return $this; }
    public function removeAttachment(JobAttachment $a): self { $this->attachments = array_filter($this->attachments, fn($i) => $i !== $a); return $this; }

    public function addProposal(Proposal $p): self { $this->proposals[] = $p; return $this; }
    public function removeProposal(Proposal $p): self { $this->proposals = array_filter($this->proposals, fn($i) => $i !== $p); return $this; }

    public function addInvitation(Invitation $inv): self { $this->invitations[] = $inv; return $this; }
    public function removeInvitation(Invitation $inv): self { $this->invitations = array_filter($this->invitations, fn($i) => $i !== $inv); return $this; }

    // ── Enum helpers ──

    public function getBudgetType(): BudgetType { return BudgetType::from($this->budget_type); }
    public function setBudgetType(BudgetType $t): self { $this->budget_type = $t->value; return $this; }
    public function getJobStatus(): JobStatus { return JobStatus::from($this->status); }
    public function setJobStatus(JobStatus $s): self { $this->status = $s->value; return $this; }

    // ── Domain methods ──

    public function incrementViewsCount(): self { $this->views_count++; return $this; }
    public function incrementProposalsCount(): self { $this->proposals_count++; return $this; }
    public function decrementProposalsCount(): self { $this->proposals_count = max(0, $this->proposals_count - 1); return $this; }

    public function publish(?\DateTimeImmutable $at = null): self
    {
        $this->status = 'open';
        $this->published_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    public function close(?\DateTimeImmutable $at = null): self
    {
        $this->closed_at = $at ?? new \DateTimeImmutable();
        return $this;
    }

    // ── Moderation domain methods ──

    public function submitForReview(): self
    {
        $this->status = 'pending_review';
        $this->moderation_status = 'pending';
        return $this;
    }

    public function moderationAutoApprove(?array $aiResult = null, ?string $confidence = null): self
    {
        $this->moderation_status = 'auto_approved';
        $this->moderation_ai_result = $aiResult;
        $this->moderation_ai_confidence = $confidence;
        $this->status = 'open';
        $this->published_at = new \DateTimeImmutable();
        return $this;
    }

    public function moderationAutoReject(?array $aiResult = null, ?string $confidence = null): self
    {
        $this->moderation_status = 'auto_rejected';
        $this->moderation_ai_result = $aiResult;
        $this->moderation_ai_confidence = $confidence;
        $this->status = 'rejected';
        return $this;
    }

    public function moderationApprove(string $reviewerId, ?string $notes = null): self
    {
        $this->moderation_status = 'approved';
        $this->moderation_reviewed_by = $reviewerId;
        $this->moderation_reviewer_notes = $notes;
        $this->moderation_reviewed_at = new \DateTimeImmutable();
        $this->status = 'open';
        $this->published_at = new \DateTimeImmutable();
        return $this;
    }

    public function moderationReject(string $reviewerId, ?string $notes = null): self
    {
        $this->moderation_status = 'rejected';
        $this->moderation_reviewed_by = $reviewerId;
        $this->moderation_reviewer_notes = $notes;
        $this->moderation_reviewed_at = new \DateTimeImmutable();
        $this->status = 'rejected';
        return $this;
    }

    public function moderationRequestRevision(string $reviewerId, ?string $notes = null): self
    {
        $this->moderation_status = 'human_review';
        $this->moderation_reviewed_by = $reviewerId;
        $this->moderation_reviewer_notes = $notes;
        $this->moderation_reviewed_at = new \DateTimeImmutable();
        $this->status = 'revision_requested';
        return $this;
    }
}
