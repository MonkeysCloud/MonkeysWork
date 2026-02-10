# MonkeysWork — Entity & API Specification

> Complete field-level data model, entity relationships, and REST API routes
> designed for the **MonkeysLegion PHP framework** (PSR-4, PHP 8.4+, `#[Route]` attributes, QueryBuilder, Repository pattern).

---

## Table of Contents

1. [Entity Overview & ER Map](#1-entity-overview--er-map)
2. [Entity Definitions](#2-entity-definitions)
3. [Enums & Value Objects](#3-enums--value-objects)
4. [Entity Relationships](#4-entity-relationships)
5. [API Routes — Full Inventory](#5-api-routes--full-inventory)
6. [MonkeysLegion File Map](#6-monkeyslegion-file-map)
7. [Middleware & Guards](#7-middleware--guards)
8. [Event Bus — Pub/Sub Mapping](#8-event-bus--pubsub-mapping)
9. [AI Integration Points](#9-ai-integration-points)

---

## 1. Entity Overview & ER Map

### 1.1 All Entities (24)

| # | Entity | Table | Domain | ML Entity Class |
|---|--------|-------|--------|-----------------|
| 1 | User | `users` | Auth | `App\Entity\User` |
| 2 | UserSession | `user_sessions` | Auth | `App\Entity\UserSession` |
| 3 | UserOAuth | `user_oauth` | Auth | `App\Entity\UserOAuth` |
| 4 | FreelancerProfile | `freelancer_profiles` | Talent | `App\Entity\FreelancerProfile` |
| 5 | ClientProfile | `client_profiles` | Client | `App\Entity\ClientProfile` |
| 6 | Skill | `skills` | Taxonomy | `App\Entity\Skill` |
| 7 | Category | `categories` | Taxonomy | `App\Entity\Category` |
| 8 | Job | `jobs` | Marketplace | `App\Entity\Job` |
| 9 | JobAttachment | `job_attachments` | Marketplace | `App\Entity\JobAttachment` |
| 10 | Proposal | `proposals` | Marketplace | `App\Entity\Proposal` |
| 11 | Contract | `contracts` | Marketplace | `App\Entity\Contract` |
| 12 | Milestone | `milestones` | Marketplace | `App\Entity\Milestone` |
| 13 | Deliverable | `deliverables` | Marketplace | `App\Entity\Deliverable` |
| 14 | Dispute | `disputes` | Resolution | `App\Entity\Dispute` |
| 15 | DisputeMessage | `dispute_messages` | Resolution | `App\Entity\DisputeMessage` |
| 16 | Review | `reviews` | Reputation | `App\Entity\Review` |
| 17 | EscrowTransaction | `escrow_transactions` | Billing | `App\Entity\EscrowTransaction` |
| 18 | Invoice | `invoices` | Billing | `App\Entity\Invoice` |
| 19 | InvoiceLine | `invoice_lines` | Billing | `App\Entity\InvoiceLine` |
| 20 | PaymentMethod | `payment_methods` | Billing | `App\Entity\PaymentMethod` |
| 21 | Payout | `payouts` | Billing | `App\Entity\Payout` |
| 22 | Verification | `verifications` | Trust | `App\Entity\Verification` |
| 23 | Conversation | `conversations` | Messaging | `App\Entity\Conversation` |
| 24 | Message | `messages` | Messaging | `App\Entity\Message` |
| 25 | Notification | `notifications` | Notification | `App\Entity\Notification` |
| 26 | AiDecisionLog | `ai_decision_log` | AI/Audit | `App\Entity\AiDecisionLog` |
| 27 | FeatureFlag | `feature_flags` | System | `App\Entity\FeatureFlag` |
| 28 | Report | `reports` | Admin | `App\Entity\Report` |
| 29 | ActivityLog | `activity_log` | Audit | `App\Entity\ActivityLog` |
| 30 | Invitation | `invitations` | Marketplace | `App\Entity\Invitation` |

### 1.2 ER Diagram (Mermaid)

```
User 1──* FreelancerProfile
User 1──* ClientProfile
User 1──* UserSession
User 1──* UserOAuth
User 1──* Verification
User 1──* PaymentMethod
User 1──* Notification
User 1──* ActivityLog

FreelancerProfile *──* Skill          (pivot: freelancer_skills)
FreelancerProfile 1──* Proposal
FreelancerProfile 1──* Review         (as reviewee)
FreelancerProfile 1──* Payout

ClientProfile 1──* Job
ClientProfile 1──* Review             (as reviewer)

Job *──* Skill                         (pivot: job_skills)
Job 1──1 Category
Job 1──* JobAttachment
Job 1──* Proposal
Job 1──* Invitation
Job 1──1 Contract

Proposal 1──* Milestone               (proposed)
Proposal 1──0..1 Contract

Contract 1──* Milestone               (active)
Contract 1──* EscrowTransaction
Contract 1──* Invoice
Contract 1──* Dispute
Contract 1──1 Conversation

Milestone 1──* Deliverable
Milestone 0..1──1 EscrowTransaction

Dispute 1──* DisputeMessage

Invoice 1──* InvoiceLine

Conversation 1──* Message

Report *──1 User (reporter)
Report *──0..1 User (reported)
```

---

## 2. Entity Definitions

> Every entity uses `declare(strict_types=1)`, `#[ContentType]` + `#[Field]` attributes,
> and extends `BaseEntity` (provides `id`, `created_at`, `updated_at`, `hydrate()`).

---

### 2.1 User

**Table:** `users`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | `uuid_generate_v4()` | PK | |
| `email` | `string` | `VARCHAR(255)` | NO | — | UNIQUE | |
| `password_hash` | `string` | `VARCHAR(255)` | NO | — | — | bcrypt |
| `role` | `UserRole` | `ENUM` | NO | — | IDX | `client`, `freelancer`, `admin`, `ops` |
| `status` | `UserStatus` | `ENUM` | NO | `pending_verification` | IDX | |
| `display_name` | `string` | `VARCHAR(100)` | NO | — | — | |
| `first_name` | `string` | `VARCHAR(80)` | YES | — | — | |
| `last_name` | `string` | `VARCHAR(80)` | YES | — | — | |
| `avatar_url` | `string` | `TEXT` | YES | — | — | |
| `phone` | `string` | `VARCHAR(30)` | YES | — | — | |
| `country` | `string` | `CHAR(2)` | YES | — | IDX | ISO 3166-1 |
| `timezone` | `string` | `VARCHAR(50)` | NO | `UTC` | — | |
| `locale` | `string` | `VARCHAR(10)` | NO | `en` | — | |
| `email_verified_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `two_factor_enabled` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `two_factor_secret` | `string` | `VARCHAR(255)` | YES | — | — | encrypted |
| `last_login_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `last_login_ip` | `string` | `VARCHAR(45)` | YES | — | — | IPv4/v6 |
| `metadata` | `json` | `JSONB` | NO | `{}` | — | extensible |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `deleted_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | soft delete |

---

### 2.2 UserSession

**Table:** `user_sessions`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | NO | — | FK→users | |
| `token_hash` | `string` | `VARCHAR(64)` | NO | — | UNIQUE | SHA-256 of JWT |
| `refresh_token_hash` | `string` | `VARCHAR(64)` | YES | — | UNIQUE | |
| `ip_address` | `string` | `VARCHAR(45)` | NO | — | — | |
| `user_agent` | `string` | `VARCHAR(500)` | YES | — | — | |
| `device_fingerprint` | `string` | `VARCHAR(64)` | YES | — | IDX | |
| `expires_at` | `datetime` | `TIMESTAMPTZ` | NO | — | IDX | |
| `revoked_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.3 UserOAuth

**Table:** `user_oauth`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | NO | — | FK→users | |
| `provider` | `string` | `VARCHAR(30)` | NO | — | — | `google`, `github`, `linkedin` |
| `provider_user_id` | `string` | `VARCHAR(255)` | NO | — | — | |
| `access_token` | `string` | `TEXT` | YES | — | — | encrypted |
| `refresh_token` | `string` | `TEXT` | YES | — | — | encrypted |
| `expires_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| UNIQUE | | | | | | `(provider, provider_user_id)` |

---

### 2.4 FreelancerProfile

**Table:** `freelancer_profiles`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `user_id` | `string` | `UUID` | NO | — | PK, FK→users | 1:1 |
| `headline` | `string` | `VARCHAR(200)` | YES | — | — | |
| `bio` | `string` | `TEXT` | YES | — | — | |
| `hourly_rate` | `decimal` | `DECIMAL(10,2)` | YES | — | IDX | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `experience_years` | `int` | `INT` | NO | `0` | — | |
| `education` | `json` | `JSONB` | NO | `[]` | — | `[{institution, degree, year}]` |
| `certifications` | `json` | `JSONB` | NO | `[]` | — | `[{name, issuer, year, url}]` |
| `portfolio_urls` | `json` | `JSONB` | NO | `[]` | — | |
| `website_url` | `string` | `VARCHAR(500)` | YES | — | — | |
| `github_url` | `string` | `VARCHAR(500)` | YES | — | — | |
| `linkedin_url` | `string` | `VARCHAR(500)` | YES | — | — | |
| `verification_level` | `VerifLevel` | `ENUM` | NO | `none` | IDX | `none`, `basic`, `verified`, `premium` |
| `availability_status` | `string` | `VARCHAR(20)` | NO | `available` | IDX | `available`, `busy`, `unavailable` |
| `availability_hours_week` | `int` | `INT` | YES | `40` | — | |
| `response_rate` | `decimal` | `DECIMAL(5,2)` | NO | `0` | — | 0-100% |
| `avg_rating` | `decimal` | `DECIMAL(3,2)` | NO | `0` | IDX | 0.00-5.00 |
| `total_reviews` | `int` | `INT` | NO | `0` | — | |
| `total_jobs_completed` | `int` | `INT` | NO | `0` | — | |
| `total_earnings` | `decimal` | `DECIMAL(14,2)` | NO | `0` | — | |
| `total_hours_logged` | `decimal` | `DECIMAL(10,1)` | NO | `0` | — | |
| `success_rate` | `decimal` | `DECIMAL(5,2)` | NO | `0` | — | completed/total % |
| `profile_completeness` | `int` | `INT` | NO | `0` | — | 0-100 score |
| `profile_embedding` | `vector` | `VECTOR(384)` | YES | — | IVFFlat | pgvector for matching |
| `featured` | `bool` | `BOOLEAN` | NO | `false` | — | admin curated |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

**Pivot — `freelancer_skills`:**

| Field | Type | Notes |
|-------|------|-------|
| `freelancer_id` | `UUID` | FK→freelancer_profiles.user_id |
| `skill_id` | `UUID` | FK→skills.id |
| `years_experience` | `INT` | 0-50 |
| `proficiency` | `ENUM` | `beginner`, `intermediate`, `expert` |
| PK | | `(freelancer_id, skill_id)` |

---

### 2.5 ClientProfile

**Table:** `client_profiles`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `user_id` | `string` | `UUID` | NO | — | PK, FK→users | 1:1 |
| `company_name` | `string` | `VARCHAR(200)` | YES | — | — | |
| `company_website` | `string` | `VARCHAR(500)` | YES | — | — | |
| `company_size` | `string` | `VARCHAR(20)` | YES | — | — | `solo`, `2-10`, `11-50`, `51-200`, `201-500`, `500+` |
| `industry` | `string` | `VARCHAR(100)` | YES | — | IDX | |
| `company_description` | `string` | `TEXT` | YES | — | — | |
| `company_logo_url` | `string` | `TEXT` | YES | — | — | |
| `total_jobs_posted` | `int` | `INT` | NO | `0` | — | |
| `total_spent` | `decimal` | `DECIMAL(14,2)` | NO | `0` | — | |
| `avg_rating_given` | `decimal` | `DECIMAL(3,2)` | NO | `0` | — | |
| `total_hires` | `int` | `INT` | NO | `0` | — | |
| `payment_verified` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `verification_level` | `VerifLevel` | `ENUM` | NO | `none` | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.6 Skill

**Table:** `skills`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `name` | `string` | `VARCHAR(100)` | NO | — | UNIQUE | |
| `slug` | `string` | `VARCHAR(120)` | NO | — | UNIQUE | URL-safe |
| `category_id` | `string` | `UUID` | YES | — | FK→categories | |
| `parent_id` | `string` | `UUID` | YES | — | FK→skills | self-ref hierarchy |
| `description` | `string` | `TEXT` | YES | — | — | |
| `icon` | `string` | `VARCHAR(50)` | YES | — | — | icon class name |
| `is_active` | `bool` | `BOOLEAN` | NO | `true` | — | |
| `usage_count` | `int` | `INT` | NO | `0` | IDX DESC | denormalized |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.7 Category

**Table:** `categories`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `name` | `string` | `VARCHAR(100)` | NO | — | UNIQUE | |
| `slug` | `string` | `VARCHAR(120)` | NO | — | UNIQUE | |
| `parent_id` | `string` | `UUID` | YES | — | FK→categories | tree |
| `description` | `string` | `TEXT` | YES | — | — | |
| `icon` | `string` | `VARCHAR(50)` | YES | — | — | |
| `sort_order` | `int` | `INT` | NO | `0` | — | |
| `is_active` | `bool` | `BOOLEAN` | NO | `true` | — | |
| `job_count` | `int` | `INT` | NO | `0` | — | denormalized |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.8 Job

**Table:** `jobs`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `client_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `title` | `string` | `VARCHAR(200)` | NO | — | — | |
| `slug` | `string` | `VARCHAR(250)` | NO | — | UNIQUE | |
| `description` | `string` | `TEXT` | NO | — | — | |
| `description_html` | `string` | `TEXT` | YES | — | — | rendered |
| `category_id` | `string` | `UUID` | NO | — | FK→categories, IDX | |
| `budget_type` | `BudgetType` | `ENUM` | NO | — | — | `fixed`, `hourly` |
| `budget_min` | `decimal` | `DECIMAL(12,2)` | YES | — | — | |
| `budget_max` | `decimal` | `DECIMAL(12,2)` | YES | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `JobStatus` | `ENUM` | NO | `draft` | IDX | |
| `visibility` | `string` | `VARCHAR(20)` | NO | `public` | — | `public`, `invite_only`, `private` |
| `experience_level` | `string` | `VARCHAR(20)` | YES | — | — | `entry`, `intermediate`, `expert` |
| `estimated_duration` | `string` | `VARCHAR(30)` | YES | — | — | `< 1 week`, `1-4 weeks`, `1-3 months`, `3-6 months`, `6+ months` |
| `location_requirement` | `string` | `VARCHAR(20)` | NO | `remote` | — | `remote`, `onsite`, `hybrid` |
| `timezone_preference` | `string` | `VARCHAR(50)` | YES | — | — | |
| `proposals_count` | `int` | `INT` | NO | `0` | — | denormalized |
| `views_count` | `int` | `INT` | NO | `0` | — | |
| `job_embedding` | `vector` | `VECTOR(384)` | YES | — | IVFFlat | pgvector |
| `ai_scope` | `json` | `JSONB` | YES | — | — | AI scope breakdown |
| `ai_scope_model_version` | `string` | `VARCHAR(50)` | YES | — | — | |
| `ai_scope_confidence` | `decimal` | `DECIMAL(5,4)` | YES | — | — | |
| `search_vector` | `tsvector` | `TSVECTOR` | YES | — | GIN | full-text |
| `published_at` | `datetime` | `TIMESTAMPTZ` | YES | — | IDX | |
| `closed_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `expires_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX DESC | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

**Pivot — `job_skills`:**

| Field | Type | Notes |
|-------|------|-------|
| `job_id` | `UUID` | FK→jobs.id |
| `skill_id` | `UUID` | FK→skills.id |
| `is_required` | `BOOLEAN` | required vs nice-to-have |
| PK | | `(job_id, skill_id)` |

---

### 2.9 JobAttachment

**Table:** `job_attachments`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `job_id` | `string` | `UUID` | NO | — | FK→jobs | |
| `file_url` | `string` | `TEXT` | NO | — | — | GCS signed URL |
| `file_name` | `string` | `VARCHAR(255)` | NO | — | — | |
| `file_size` | `int` | `BIGINT` | NO | — | — | bytes |
| `mime_type` | `string` | `VARCHAR(100)` | NO | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.10 Proposal

**Table:** `proposals`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `job_id` | `string` | `UUID` | NO | — | FK→jobs, IDX | |
| `freelancer_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `cover_letter` | `string` | `TEXT` | YES | — | — | |
| `bid_amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `bid_type` | `BudgetType` | `ENUM` | NO | — | — | |
| `estimated_duration_days` | `int` | `INT` | YES | — | — | |
| `status` | `ProposalStatus` | `ENUM` | NO | `submitted` | IDX | |
| `milestones_proposed` | `json` | `JSONB` | NO | `[]` | — | `[{title, amount, days}]` |
| `attachments` | `json` | `JSONB` | NO | `[]` | — | `[{url, name, size}]` |
| `ai_match_score` | `decimal` | `DECIMAL(5,4)` | YES | — | IDX | 0.0000-1.0000 |
| `ai_match_model_version` | `string` | `VARCHAR(50)` | YES | — | — | |
| `ai_match_breakdown` | `json` | `JSONB` | YES | — | — | score components |
| `ai_fraud_score` | `decimal` | `DECIMAL(5,4)` | YES | — | — | |
| `ai_fraud_model_version` | `string` | `VARCHAR(50)` | YES | — | — | |
| `ai_fraud_action` | `string` | `VARCHAR(20)` | YES | — | — | `allow`, `review`, `block` |
| `viewed_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | client first viewed |
| `shortlisted_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| UNIQUE | | | | | | `(job_id, freelancer_id)` |

---

### 2.11 Contract

**Table:** `contracts`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `job_id` | `string` | `UUID` | NO | — | FK→jobs, IDX | |
| `proposal_id` | `string` | `UUID` | NO | — | FK→proposals, UNIQUE | |
| `client_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `freelancer_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `title` | `string` | `VARCHAR(200)` | NO | — | — | |
| `description` | `string` | `TEXT` | YES | — | — | terms |
| `contract_type` | `BudgetType` | `ENUM` | NO | — | — | |
| `total_amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `hourly_rate` | `decimal` | `DECIMAL(10,2)` | YES | — | — | if hourly |
| `weekly_hour_limit` | `int` | `INT` | YES | — | — | if hourly |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `ContractStatus` | `ENUM` | NO | `active` | IDX | |
| `platform_fee_percent` | `decimal` | `DECIMAL(4,2)` | NO | `10.00` | — | MonkeysWork cut |
| `started_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `completed_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `cancelled_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `cancellation_reason` | `string` | `TEXT` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.12 Milestone

**Table:** `milestones`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `contract_id` | `string` | `UUID` | NO | — | FK→contracts, IDX | |
| `title` | `string` | `VARCHAR(200)` | NO | — | — | |
| `description` | `string` | `TEXT` | YES | — | — | |
| `amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `MilestoneStatus` | `ENUM` | NO | `pending` | IDX | |
| `sort_order` | `int` | `INT` | NO | `0` | — | |
| `due_date` | `date` | `DATE` | YES | — | — | |
| `submitted_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `revision_requested_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `revision_notes` | `string` | `TEXT` | YES | — | — | |
| `accepted_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `escrow_funded` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.13 Deliverable

**Table:** `deliverables`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `milestone_id` | `string` | `UUID` | NO | — | FK→milestones | |
| `uploaded_by` | `string` | `UUID` | NO | — | FK→users | |
| `file_url` | `string` | `TEXT` | NO | — | — | |
| `file_name` | `string` | `VARCHAR(255)` | NO | — | — | |
| `file_size` | `int` | `BIGINT` | NO | — | — | |
| `mime_type` | `string` | `VARCHAR(100)` | NO | — | — | |
| `description` | `string` | `TEXT` | YES | — | — | |
| `version` | `int` | `INT` | NO | `1` | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.14 Dispute

**Table:** `disputes`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `contract_id` | `string` | `UUID` | NO | — | FK→contracts, IDX | |
| `milestone_id` | `string` | `UUID` | YES | — | FK→milestones | |
| `opened_by` | `string` | `UUID` | NO | — | FK→users | |
| `against` | `string` | `UUID` | NO | — | FK→users | |
| `reason` | `DisputeReason` | `ENUM` | NO | — | — | |
| `description` | `string` | `TEXT` | NO | — | — | |
| `amount_disputed` | `decimal` | `DECIMAL(12,2)` | YES | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `DisputeStatus` | `ENUM` | NO | `open` | IDX | |
| `evidence_urls` | `json` | `JSONB` | NO | `[]` | — | |
| `resolution` | `string` | `VARCHAR(30)` | YES | — | — | `client_wins`, `freelancer_wins`, `split`, `dismissed` |
| `resolution_notes` | `string` | `TEXT` | YES | — | — | |
| `resolution_amount_client` | `decimal` | `DECIMAL(12,2)` | YES | — | — | |
| `resolution_amount_freelancer` | `decimal` | `DECIMAL(12,2)` | YES | — | — | |
| `resolved_by` | `string` | `UUID` | YES | — | FK→users | admin/ops |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `resolved_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |

---

### 2.15 DisputeMessage

**Table:** `dispute_messages`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `dispute_id` | `string` | `UUID` | NO | — | FK→disputes | |
| `sender_id` | `string` | `UUID` | NO | — | FK→users | |
| `body` | `string` | `TEXT` | NO | — | — | |
| `attachments` | `json` | `JSONB` | NO | `[]` | — | |
| `is_internal` | `bool` | `BOOLEAN` | NO | `false` | — | ops-only |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.16 Review

**Table:** `reviews`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `contract_id` | `string` | `UUID` | NO | — | FK→contracts, IDX | |
| `reviewer_id` | `string` | `UUID` | NO | — | FK→users | |
| `reviewee_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `reviewer_role` | `string` | `VARCHAR(20)` | NO | — | — | `client`, `freelancer` |
| `overall_rating` | `int` | `INT` | NO | — | — | 1-5 |
| `communication_rating` | `int` | `INT` | YES | — | — | 1-5 |
| `quality_rating` | `int` | `INT` | YES | — | — | 1-5 |
| `timeliness_rating` | `int` | `INT` | YES | — | — | 1-5 |
| `professionalism_rating` | `int` | `INT` | YES | — | — | 1-5 |
| `comment` | `string` | `TEXT` | YES | — | — | |
| `is_public` | `bool` | `BOOLEAN` | NO | `true` | — | |
| `response` | `string` | `TEXT` | YES | — | — | reviewee reply |
| `response_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |
| UNIQUE | | | | | | `(contract_id, reviewer_id)` |

---

### 2.17 EscrowTransaction

**Table:** `escrow_transactions`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `contract_id` | `string` | `UUID` | NO | — | FK→contracts, IDX | |
| `milestone_id` | `string` | `UUID` | YES | — | FK→milestones | |
| `payer_id` | `string` | `UUID` | NO | — | FK→users | client |
| `payee_id` | `string` | `UUID` | NO | — | FK→users | freelancer |
| `type` | `EscrowType` | `ENUM` | NO | — | — | `fund`, `release`, `refund`, `dispute_hold`, `platform_fee` |
| `amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `EscrowStatus` | `ENUM` | NO | `pending` | IDX | `pending`, `completed`, `failed`, `reversed` |
| `payment_method_id` | `string` | `UUID` | YES | — | FK→payment_methods | |
| `external_txn_id` | `string` | `VARCHAR(255)` | YES | — | UNIQUE | Stripe/PayPal ref |
| `description` | `string` | `VARCHAR(500)` | YES | — | — | |
| `metadata` | `json` | `JSONB` | NO | `{}` | — | |
| `processed_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |

---

### 2.18 Invoice

**Table:** `invoices`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `invoice_number` | `string` | `VARCHAR(30)` | NO | — | UNIQUE | `MW-2026-000001` |
| `contract_id` | `string` | `UUID` | NO | — | FK→contracts | |
| `from_user_id` | `string` | `UUID` | NO | — | FK→users | freelancer |
| `to_user_id` | `string` | `UUID` | NO | — | FK→users | client |
| `subtotal` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `platform_fee` | `decimal` | `DECIMAL(12,2)` | NO | `0` | — | |
| `tax` | `decimal` | `DECIMAL(12,2)` | NO | `0` | — | |
| `total` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `status` | `InvoiceStatus` | `ENUM` | NO | `draft` | IDX | |
| `due_date` | `date` | `DATE` | YES | — | — | |
| `paid_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `notes` | `string` | `TEXT` | YES | — | — | |
| `pdf_url` | `string` | `TEXT` | YES | — | — | generated PDF |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.19 InvoiceLine

**Table:** `invoice_lines`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `invoice_id` | `string` | `UUID` | NO | — | FK→invoices | |
| `milestone_id` | `string` | `UUID` | YES | — | FK→milestones | |
| `description` | `string` | `VARCHAR(500)` | NO | — | — | |
| `quantity` | `decimal` | `DECIMAL(10,2)` | NO | `1` | — | hours or units |
| `unit_price` | `decimal` | `DECIMAL(10,2)` | NO | — | — | |
| `amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | qty × unit |
| `sort_order` | `int` | `INT` | NO | `0` | — | |

---

### 2.20 PaymentMethod

**Table:** `payment_methods`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `type` | `string` | `VARCHAR(30)` | NO | — | — | `credit_card`, `bank_account`, `paypal`, `crypto` |
| `provider` | `string` | `VARCHAR(30)` | NO | — | — | `stripe`, `paypal` |
| `external_id` | `string` | `VARCHAR(255)` | YES | — | — | Stripe PM id |
| `label` | `string` | `VARCHAR(100)` | NO | — | — | "Visa ****4242" |
| `is_default` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `is_verified` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `expires_at` | `date` | `DATE` | YES | — | — | card expiry |
| `metadata` | `json` | `JSONB` | NO | `{}` | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.21 Payout

**Table:** `payouts`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `freelancer_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `amount` | `decimal` | `DECIMAL(12,2)` | NO | — | — | |
| `currency` | `string` | `CHAR(3)` | NO | `USD` | — | |
| `method` | `string` | `VARCHAR(30)` | NO | — | — | `bank_transfer`, `paypal`, `crypto` |
| `status` | `PayoutStatus` | `ENUM` | NO | `pending` | IDX | `pending`, `processing`, `completed`, `failed` |
| `external_txn_id` | `string` | `VARCHAR(255)` | YES | — | — | |
| `escrow_txn_ids` | `json` | `JSONB` | NO | `[]` | — | linked escrow releases |
| `processed_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `failed_reason` | `string` | `TEXT` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |

---

### 2.22 Verification

**Table:** `verifications`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `type` | `VerifType` | `ENUM` | NO | — | — | `identity`, `skill_assessment`, `portfolio`, `work_history`, `payment_method` |
| `status` | `VerifStatus` | `ENUM` | NO | `pending` | IDX | |
| `confidence_score` | `decimal` | `DECIMAL(5,4)` | YES | — | — | AI confidence |
| `model_version` | `string` | `VARCHAR(50)` | YES | — | — | |
| `evidence` | `json` | `JSONB` | NO | `{}` | — | uploaded docs |
| `decision_audit` | `json` | `JSONB` | NO | `{}` | — | AI explanation |
| `reviewed_by` | `string` | `UUID` | YES | — | FK→users | ops user |
| `rejection_reason` | `string` | `TEXT` | YES | — | — | |
| `expires_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | re-verify |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.23 Conversation

**Table:** `conversations`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `contract_id` | `string` | `UUID` | YES | — | FK→contracts | |
| `job_id` | `string` | `UUID` | YES | — | FK→jobs | pre-contract |
| `subject` | `string` | `VARCHAR(200)` | YES | — | — | |
| `last_message_at` | `datetime` | `TIMESTAMPTZ` | YES | — | IDX DESC | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

**Pivot — `conversation_participants`:**

| Field | Type | Notes |
|-------|------|-------|
| `conversation_id` | `UUID` | FK→conversations |
| `user_id` | `UUID` | FK→users |
| `unread_count` | `INT` | default 0 |
| `last_read_at` | `TIMESTAMPTZ` | |
| PK | | `(conversation_id, user_id)` |

---

### 2.24 Message

**Table:** `messages`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `conversation_id` | `string` | `UUID` | NO | — | FK→conversations, IDX | |
| `sender_id` | `string` | `UUID` | NO | — | FK→users | |
| `body` | `string` | `TEXT` | NO | — | — | |
| `attachments` | `json` | `JSONB` | NO | `[]` | — | |
| `is_system` | `bool` | `BOOLEAN` | NO | `false` | — | auto-generated |
| `edited_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `deleted_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |

---

### 2.25 Notification

**Table:** `notifications`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `type` | `string` | `VARCHAR(60)` | NO | — | IDX | `proposal_received`, `milestone_accepted`, etc. |
| `title` | `string` | `VARCHAR(200)` | NO | — | — | |
| `body` | `string` | `TEXT` | YES | — | — | |
| `data` | `json` | `JSONB` | NO | `{}` | — | `{entity_type, entity_id, url}` |
| `channel` | `string` | `VARCHAR(20)` | NO | `in_app` | — | `in_app`, `email`, `push` |
| `read_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX DESC | |

---

### 2.26 AiDecisionLog

**Table:** `ai_decision_log`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `decision_type` | `string` | `VARCHAR(50)` | NO | — | IDX | `scope`, `match`, `fraud`, `verification` |
| `entity_type` | `string` | `VARCHAR(50)` | NO | — | IDX | `job`, `proposal`, `account` |
| `entity_id` | `string` | `UUID` | NO | — | IDX | |
| `model_name` | `string` | `VARCHAR(100)` | NO | — | — | |
| `model_version` | `string` | `VARCHAR(50)` | NO | — | IDX | |
| `prompt_version` | `string` | `VARCHAR(50)` | YES | — | — | |
| `input_hash` | `string` | `VARCHAR(64)` | YES | — | — | SHA-256 |
| `output` | `json` | `JSONB` | NO | — | — | |
| `confidence_score` | `decimal` | `DECIMAL(5,4)` | YES | — | — | |
| `latency_ms` | `int` | `INT` | YES | — | — | |
| `feature_flags` | `json` | `JSONB` | NO | `{}` | — | |
| `explanation` | `json` | `JSONB` | YES | — | — | |
| `human_override` | `bool` | `BOOLEAN` | NO | `false` | — | |
| `override_by` | `string` | `UUID` | YES | — | FK→users | |
| `override_reason` | `string` | `TEXT` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |

---

### 2.27 FeatureFlag

**Table:** `feature_flags`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `key` | `string` | `VARCHAR(100)` | NO | — | PK | |
| `value` | `json` | `JSONB` | NO | `true` | — | |
| `description` | `string` | `TEXT` | YES | — | — | |
| `updated_by` | `string` | `UUID` | YES | — | FK→users | |
| `updated_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |

---

### 2.28 Report

**Table:** `reports`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `reporter_id` | `string` | `UUID` | NO | — | FK→users | |
| `reported_user_id` | `string` | `UUID` | YES | — | FK→users | |
| `entity_type` | `string` | `VARCHAR(50)` | NO | — | IDX | `job`, `proposal`, `review`, `message`, `user` |
| `entity_id` | `string` | `UUID` | NO | — | — | |
| `reason` | `string` | `VARCHAR(50)` | NO | — | — | `spam`, `fraud`, `harassment`, `inappropriate`, `copyright`, `other` |
| `description` | `string` | `TEXT` | YES | — | — | |
| `evidence_urls` | `json` | `JSONB` | NO | `[]` | — | |
| `status` | `string` | `VARCHAR(20)` | NO | `open` | IDX | `open`, `investigating`, `resolved`, `dismissed` |
| `resolution_notes` | `string` | `TEXT` | YES | — | — | |
| `resolved_by` | `string` | `UUID` | YES | — | FK→users | admin |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX | |
| `resolved_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |

---

### 2.29 ActivityLog

**Table:** `activity_log`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `user_id` | `string` | `UUID` | YES | — | FK→users, IDX | null = system |
| `action` | `string` | `VARCHAR(60)` | NO | — | IDX | `user.login`, `job.created`, `proposal.submitted` |
| `entity_type` | `string` | `VARCHAR(50)` | YES | — | IDX | |
| `entity_id` | `string` | `UUID` | YES | — | — | |
| `changes` | `json` | `JSONB` | YES | — | — | `{before: {}, after: {}}` |
| `ip_address` | `string` | `VARCHAR(45)` | YES | — | — | |
| `user_agent` | `string` | `VARCHAR(500)` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | IDX DESC | |

---

### 2.30 Invitation

**Table:** `invitations`

| Field | Type | DB Type | Null | Default | Index | Notes |
|-------|------|---------|------|---------|-------|-------|
| `id` | `string` | `UUID` | NO | — | PK | |
| `job_id` | `string` | `UUID` | NO | — | FK→jobs, IDX | |
| `client_id` | `string` | `UUID` | NO | — | FK→users | |
| `freelancer_id` | `string` | `UUID` | NO | — | FK→users, IDX | |
| `message` | `string` | `TEXT` | YES | — | — | personal note |
| `status` | `string` | `VARCHAR(20)` | NO | `pending` | — | `pending`, `accepted`, `declined`, `expired` |
| `responded_at` | `datetime` | `TIMESTAMPTZ` | YES | — | — | |
| `created_at` | `datetime` | `TIMESTAMPTZ` | NO | `NOW()` | — | |
| UNIQUE | | | | | | `(job_id, freelancer_id)` |

---

## 3. Enums & Value Objects

```php
// app/Enum/UserRole.php
enum UserRole: string {
    case Client     = 'client';
    case Freelancer = 'freelancer';
    case Admin      = 'admin';
    case Ops        = 'ops';
}

// app/Enum/UserStatus.php
enum UserStatus: string {
    case Active              = 'active';
    case Suspended           = 'suspended';
    case Deactivated         = 'deactivated';
    case PendingVerification = 'pending_verification';
}

// app/Enum/JobStatus.php
enum JobStatus: string {
    case Draft      = 'draft';
    case Open       = 'open';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';
    case Suspended  = 'suspended';
}

// app/Enum/BudgetType.php
enum BudgetType: string {
    case Fixed  = 'fixed';
    case Hourly = 'hourly';
}

// app/Enum/ProposalStatus.php
enum ProposalStatus: string {
    case Submitted   = 'submitted';
    case Viewed      = 'viewed';
    case Shortlisted = 'shortlisted';
    case Accepted    = 'accepted';
    case Rejected    = 'rejected';
    case Withdrawn   = 'withdrawn';
}

// app/Enum/ContractStatus.php
enum ContractStatus: string {
    case Active    = 'active';
    case Paused    = 'paused';
    case Completed = 'completed';
    case Disputed  = 'disputed';
    case Cancelled = 'cancelled';
}

// app/Enum/MilestoneStatus.php
enum MilestoneStatus: string {
    case Pending           = 'pending';
    case InProgress        = 'in_progress';
    case Submitted         = 'submitted';
    case RevisionRequested = 'revision_requested';
    case Accepted          = 'accepted';
    case Disputed          = 'disputed';
}

// app/Enum/DisputeReason.php
enum DisputeReason: string {
    case Quality       = 'quality';
    case NonDelivery   = 'non_delivery';
    case ScopeChange   = 'scope_change';
    case Payment       = 'payment';
    case Communication = 'communication';
    case Other         = 'other';
}

// app/Enum/DisputeStatus.php
enum DisputeStatus: string {
    case Open              = 'open';
    case UnderReview       = 'under_review';
    case ResolvedClient    = 'resolved_client';
    case ResolvedFreelancer = 'resolved_freelancer';
    case ResolvedSplit     = 'resolved_split';
    case Escalated         = 'escalated';
}

// app/Enum/EscrowType.php
enum EscrowType: string {
    case Fund        = 'fund';
    case Release     = 'release';
    case Refund      = 'refund';
    case DisputeHold = 'dispute_hold';
    case PlatformFee = 'platform_fee';
}

// app/Enum/EscrowStatus.php
enum EscrowStatus: string {
    case Pending   = 'pending';
    case Completed = 'completed';
    case Failed    = 'failed';
    case Reversed  = 'reversed';
}

// app/Enum/InvoiceStatus.php
enum InvoiceStatus: string {
    case Draft     = 'draft';
    case Sent      = 'sent';
    case Paid      = 'paid';
    case Overdue   = 'overdue';
    case Cancelled = 'cancelled';
    case Refunded  = 'refunded';
}

// app/Enum/PayoutStatus.php
enum PayoutStatus: string {
    case Pending    = 'pending';
    case Processing = 'processing';
    case Completed  = 'completed';
    case Failed     = 'failed';
}

// app/Enum/VerificationType.php
enum VerificationType: string {
    case Identity       = 'identity';
    case SkillAssessment = 'skill_assessment';
    case Portfolio       = 'portfolio';
    case WorkHistory     = 'work_history';
    case PaymentMethod   = 'payment_method';
}

// app/Enum/VerificationStatus.php
enum VerificationStatus: string {
    case Pending      = 'pending';
    case InReview     = 'in_review';
    case AutoApproved = 'auto_approved';
    case AutoRejected = 'auto_rejected';
    case HumanReview  = 'human_review';
    case Approved     = 'approved';
    case Rejected     = 'rejected';
}

// app/Enum/VerificationLevel.php
enum VerificationLevel: string {
    case None     = 'none';
    case Basic    = 'basic';
    case Verified = 'verified';
    case Premium  = 'premium';
}
```

---

## 4. Entity Relationships

| Relation | Type | FK Column | Cascade |
|----------|------|-----------|---------|
| User → FreelancerProfile | 1:1 | `freelancer_profiles.user_id` | DELETE |
| User → ClientProfile | 1:1 | `client_profiles.user_id` | DELETE |
| User → UserSession[] | 1:N | `user_sessions.user_id` | DELETE |
| User → UserOAuth[] | 1:N | `user_oauth.user_id` | DELETE |
| User → Verification[] | 1:N | `verifications.user_id` | CASCADE |
| User → PaymentMethod[] | 1:N | `payment_methods.user_id` | CASCADE |
| User → Notification[] | 1:N | `notifications.user_id` | CASCADE |
| User → ActivityLog[] | 1:N | `activity_log.user_id` | SET NULL |
| FreelancerProfile ↔ Skill[] | M:N | `freelancer_skills` | CASCADE |
| ClientProfile → Job[] | 1:N | `jobs.client_id` | RESTRICT |
| Job → Category | N:1 | `jobs.category_id` | RESTRICT |
| Job ↔ Skill[] | M:N | `job_skills` | CASCADE |
| Job → JobAttachment[] | 1:N | `job_attachments.job_id` | CASCADE |
| Job → Proposal[] | 1:N | `proposals.job_id` | CASCADE |
| Job → Invitation[] | 1:N | `invitations.job_id` | CASCADE |
| Proposal → Contract | 1:0..1 | `contracts.proposal_id` | RESTRICT |
| Contract → Milestone[] | 1:N | `milestones.contract_id` | CASCADE |
| Contract → EscrowTransaction[] | 1:N | `escrow_transactions.contract_id` | RESTRICT |
| Contract → Invoice[] | 1:N | `invoices.contract_id` | RESTRICT |
| Contract → Dispute[] | 1:N | `disputes.contract_id` | RESTRICT |
| Contract → Conversation | 1:1 | `conversations.contract_id` | CASCADE |
| Milestone → Deliverable[] | 1:N | `deliverables.milestone_id` | CASCADE |
| Dispute → DisputeMessage[] | 1:N | `dispute_messages.dispute_id` | CASCADE |
| Conversation → Message[] | 1:N | `messages.conversation_id` | CASCADE |
| Conversation ↔ User[] | M:N | `conversation_participants` | CASCADE |
| Invoice → InvoiceLine[] | 1:N | `invoice_lines.invoice_id` | CASCADE |
| Contract → Review[] | 1:N | `reviews.contract_id` | RESTRICT |
| FreelancerProfile → Payout[] | 1:N | `payouts.freelancer_id` | RESTRICT |

---

## 5. API Routes — Full Inventory

> MonkeysLegion `#[Route]` attribute format:
> `#[Route('METHOD', '/api/v1/path', name: 'route.name', middleware: ['auth'])]`

### 5.1 Auth (public)

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/auth/register` | `auth.register` | `AuthController@register` | Create account |
| `POST` | `/api/v1/auth/login` | `auth.login` | `AuthController@login` | Get JWT pair |
| `POST` | `/api/v1/auth/refresh` | `auth.refresh` | `AuthController@refresh` | Refresh JWT |
| `POST` | `/api/v1/auth/logout` | `auth.logout` | `AuthController@logout` | Revoke session |
| `POST` | `/api/v1/auth/forgot-password` | `auth.forgot` | `AuthController@forgotPassword` | Send reset email |
| `POST` | `/api/v1/auth/reset-password` | `auth.reset` | `AuthController@resetPassword` | Reset with token |
| `POST` | `/api/v1/auth/verify-email` | `auth.verify` | `AuthController@verifyEmail` | Verify email token |
| `POST` | `/api/v1/auth/oauth/{provider}` | `auth.oauth` | `AuthController@oauthCallback` | OAuth login |
| `POST` | `/api/v1/auth/2fa/enable` | `auth.2fa.enable` | `AuthController@enable2fa` | Enable TOTP |
| `POST` | `/api/v1/auth/2fa/verify` | `auth.2fa.verify` | `AuthController@verify2fa` | Verify TOTP |

### 5.2 Users (auth required)

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/users/me` | `users.me` | `UserController@me` | Current user profile |
| `PATCH` | `/api/v1/users/me` | `users.update` | `UserController@update` | Update profile |
| `PATCH` | `/api/v1/users/me/password` | `users.password` | `UserController@changePassword` | Change password |
| `DELETE` | `/api/v1/users/me` | `users.delete` | `UserController@deactivate` | Soft delete account |
| `GET` | `/api/v1/users/{id}` | `users.show` | `UserController@show` | Public profile |
| `GET` | `/api/v1/users/me/sessions` | `users.sessions` | `UserController@sessions` | Active sessions |
| `DELETE` | `/api/v1/users/me/sessions/{id}` | `users.sessions.revoke` | `UserController@revokeSession` | Revoke session |

### 5.3 Freelancer Profiles

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/freelancers` | `freelancers.index` | `FreelancerController@index` | Search/list |
| `GET` | `/api/v1/freelancers/{id}` | `freelancers.show` | `FreelancerController@show` | Profile detail |
| `PUT` | `/api/v1/freelancers/me` | `freelancers.update` | `FreelancerController@update` | Update own profile |
| `PUT` | `/api/v1/freelancers/me/skills` | `freelancers.skills` | `FreelancerController@updateSkills` | Set skills |
| `GET` | `/api/v1/freelancers/me/stats` | `freelancers.stats` | `FreelancerController@stats` | Earnings/stats |
| `GET` | `/api/v1/freelancers/me/reviews` | `freelancers.reviews` | `FreelancerController@reviews` | Reviews received |
| `GET` | `/api/v1/freelancers/{id}/portfolio` | `freelancers.portfolio` | `FreelancerController@portfolio` | Portfolio items |

### 5.4 Client Profiles

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/clients/{id}` | `clients.show` | `ClientController@show` | Client profile |
| `PUT` | `/api/v1/clients/me` | `clients.update` | `ClientController@update` | Update own profile |
| `GET` | `/api/v1/clients/me/stats` | `clients.stats` | `ClientController@stats` | Spending/stats |

### 5.5 Taxonomy (Skills & Categories)

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/skills` | `skills.index` | `SkillController@index` | All skills |
| `GET` | `/api/v1/skills/search` | `skills.search` | `SkillController@search` | Autocomplete |
| `GET` | `/api/v1/skills/{slug}` | `skills.show` | `SkillController@show` | Skill detail |
| `GET` | `/api/v1/categories` | `categories.index` | `CategoryController@index` | All categories |
| `GET` | `/api/v1/categories/{slug}` | `categories.show` | `CategoryController@show` | Category + skills |

### 5.6 Jobs

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/jobs` | `jobs.index` | `JobController@index` | Search/browse |
| `POST` | `/api/v1/jobs` | `jobs.create` | `JobController@create` | Create job |
| `GET` | `/api/v1/jobs/{id}` | `jobs.show` | `JobController@show` | Job detail |
| `PATCH` | `/api/v1/jobs/{id}` | `jobs.update` | `JobController@update` | Update job |
| `POST` | `/api/v1/jobs/{id}/publish` | `jobs.publish` | `JobController@publish` | Publish draft |
| `POST` | `/api/v1/jobs/{id}/close` | `jobs.close` | `JobController@close` | Close job |
| `DELETE` | `/api/v1/jobs/{id}` | `jobs.delete` | `JobController@delete` | Delete draft |
| `GET` | `/api/v1/jobs/{id}/proposals` | `jobs.proposals` | `JobController@proposals` | List proposals |
| `GET` | `/api/v1/jobs/{id}/matches` | `jobs.matches` | `JobController@matches` | AI-ranked matches |
| `POST` | `/api/v1/jobs/{id}/invite` | `jobs.invite` | `JobController@invite` | Invite freelancer |
| `GET` | `/api/v1/jobs/me` | `jobs.mine` | `JobController@mine` | My posted jobs |

### 5.7 Proposals

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/proposals` | `proposals.create` | `ProposalController@create` | Submit proposal |
| `GET` | `/api/v1/proposals/{id}` | `proposals.show` | `ProposalController@show` | Proposal detail |
| `PATCH` | `/api/v1/proposals/{id}` | `proposals.update` | `ProposalController@update` | Edit (if not viewed) |
| `POST` | `/api/v1/proposals/{id}/withdraw` | `proposals.withdraw` | `ProposalController@withdraw` | Withdraw |
| `POST` | `/api/v1/proposals/{id}/shortlist` | `proposals.shortlist` | `ProposalController@shortlist` | Client shortlists |
| `POST` | `/api/v1/proposals/{id}/accept` | `proposals.accept` | `ProposalController@accept` | Accept → contract |
| `POST` | `/api/v1/proposals/{id}/reject` | `proposals.reject` | `ProposalController@reject` | Reject |
| `GET` | `/api/v1/proposals/me` | `proposals.mine` | `ProposalController@mine` | My proposals |

### 5.8 Contracts

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/contracts` | `contracts.index` | `ContractController@index` | My contracts |
| `GET` | `/api/v1/contracts/{id}` | `contracts.show` | `ContractController@show` | Contract detail |
| `POST` | `/api/v1/contracts/{id}/complete` | `contracts.complete` | `ContractController@complete` | Mark complete |
| `POST` | `/api/v1/contracts/{id}/cancel` | `contracts.cancel` | `ContractController@cancel` | Cancel |
| `GET` | `/api/v1/contracts/{id}/milestones` | `contracts.milestones` | `ContractController@milestones` | List milestones |
| `POST` | `/api/v1/contracts/{id}/milestones` | `contracts.milestones.add` | `ContractController@addMilestone` | Add milestone |
| `GET` | `/api/v1/contracts/{id}/escrow` | `contracts.escrow` | `ContractController@escrow` | Escrow status |

### 5.9 Milestones

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/milestones/{id}` | `milestones.show` | `MilestoneController@show` | Detail |
| `PATCH` | `/api/v1/milestones/{id}` | `milestones.update` | `MilestoneController@update` | Edit |
| `POST` | `/api/v1/milestones/{id}/fund` | `milestones.fund` | `MilestoneController@fund` | Fund escrow |
| `POST` | `/api/v1/milestones/{id}/submit` | `milestones.submit` | `MilestoneController@submit` | Submit work |
| `POST` | `/api/v1/milestones/{id}/accept` | `milestones.accept` | `MilestoneController@accept` | Accept + release |
| `POST` | `/api/v1/milestones/{id}/request-revision` | `milestones.revision` | `MilestoneController@requestRevision` | Request revision |
| `POST` | `/api/v1/milestones/{id}/deliverables` | `milestones.deliverables.upload` | `MilestoneController@uploadDeliverable` | Upload file |
| `GET` | `/api/v1/milestones/{id}/deliverables` | `milestones.deliverables` | `MilestoneController@deliverables` | List files |

### 5.10 Disputes

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/disputes` | `disputes.create` | `DisputeController@create` | Open dispute |
| `GET` | `/api/v1/disputes/{id}` | `disputes.show` | `DisputeController@show` | Detail |
| `POST` | `/api/v1/disputes/{id}/messages` | `disputes.message` | `DisputeController@addMessage` | Add evidence/msg |
| `GET` | `/api/v1/disputes/{id}/messages` | `disputes.messages` | `DisputeController@messages` | Message thread |
| `POST` | `/api/v1/disputes/{id}/resolve` | `disputes.resolve` | `DisputeController@resolve` | Admin resolves |

### 5.11 Reviews

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/reviews` | `reviews.create` | `ReviewController@create` | Leave review |
| `GET` | `/api/v1/reviews/{id}` | `reviews.show` | `ReviewController@show` | Detail |
| `POST` | `/api/v1/reviews/{id}/respond` | `reviews.respond` | `ReviewController@respond` | Reviewee reply |
| `GET` | `/api/v1/users/{id}/reviews` | `users.reviews` | `ReviewController@byUser` | User's reviews |

### 5.12 Billing — Escrow

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/escrow/balance` | `escrow.balance` | `EscrowController@balance` | My escrow balance |
| `GET` | `/api/v1/escrow/transactions` | `escrow.transactions` | `EscrowController@transactions` | My transactions |
| `GET` | `/api/v1/escrow/transactions/{id}` | `escrow.show` | `EscrowController@show` | Transaction detail |

### 5.13 Billing — Invoices

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/invoices` | `invoices.index` | `InvoiceController@index` | My invoices |
| `POST` | `/api/v1/invoices` | `invoices.create` | `InvoiceController@create` | Create invoice |
| `GET` | `/api/v1/invoices/{id}` | `invoices.show` | `InvoiceController@show` | Detail |
| `POST` | `/api/v1/invoices/{id}/send` | `invoices.send` | `InvoiceController@send` | Send to client |
| `GET` | `/api/v1/invoices/{id}/pdf` | `invoices.pdf` | `InvoiceController@pdf` | Download PDF |

### 5.14 Billing — Payment Methods

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/payment-methods` | `pm.index` | `PaymentMethodController@index` | List |
| `POST` | `/api/v1/payment-methods` | `pm.create` | `PaymentMethodController@create` | Add method |
| `DELETE` | `/api/v1/payment-methods/{id}` | `pm.delete` | `PaymentMethodController@delete` | Remove |
| `POST` | `/api/v1/payment-methods/{id}/default` | `pm.default` | `PaymentMethodController@setDefault` | Set default |

### 5.15 Billing — Payouts

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/payouts` | `payouts.index` | `PayoutController@index` | My payouts |
| `POST` | `/api/v1/payouts/request` | `payouts.request` | `PayoutController@request` | Request payout |
| `GET` | `/api/v1/payouts/{id}` | `payouts.show` | `PayoutController@show` | Detail |

### 5.16 Verification

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/verifications` | `verif.create` | `VerificationController@submit` | Submit verification |
| `GET` | `/api/v1/verifications` | `verif.index` | `VerificationController@index` | My verifications |
| `GET` | `/api/v1/verifications/{id}` | `verif.show` | `VerificationController@show` | Detail |

### 5.17 Messaging

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/conversations` | `conv.index` | `ConversationController@index` | My conversations |
| `POST` | `/api/v1/conversations` | `conv.create` | `ConversationController@create` | Start conversation |
| `GET` | `/api/v1/conversations/{id}` | `conv.show` | `ConversationController@show` | Detail + messages |
| `POST` | `/api/v1/conversations/{id}/messages` | `conv.message` | `ConversationController@sendMessage` | Send message |
| `POST` | `/api/v1/conversations/{id}/read` | `conv.read` | `ConversationController@markRead` | Mark read |

### 5.18 Notifications

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/notifications` | `notif.index` | `NotificationController@index` | My notifications |
| `POST` | `/api/v1/notifications/read-all` | `notif.readAll` | `NotificationController@readAll` | Mark all read |
| `POST` | `/api/v1/notifications/{id}/read` | `notif.read` | `NotificationController@read` | Mark single read |
| `GET` | `/api/v1/notifications/unread-count` | `notif.count` | `NotificationController@unreadCount` | Unread count |

### 5.19 AI Endpoints (internal + admin)

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/v1/ai/scope/analyze` | `ai.scope` | `AiScopeController@analyze` | Scope a job |
| `POST` | `/api/v1/ai/match/rank` | `ai.match` | `AiMatchController@rank` | Rank freelancers |
| `POST` | `/api/v1/ai/fraud/check` | `ai.fraud` | `AiFraudController@check` | Score account |
| `GET` | `/api/v1/ai/decisions` | `ai.decisions` | `AiDecisionController@index` | Decision log |
| `GET` | `/api/v1/ai/decisions/{id}` | `ai.decisions.show` | `AiDecisionController@show` | Decision detail |
| `POST` | `/api/v1/ai/decisions/{id}/override` | `ai.override` | `AiDecisionController@override` | Human override |

### 5.20 Admin

| Method | Path | Name | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/v1/admin/users` | `admin.users` | `AdminUserController@index` | All users |
| `PATCH` | `/api/v1/admin/users/{id}/status` | `admin.users.status` | `AdminUserController@updateStatus` | Suspend/activate |
| `GET` | `/api/v1/admin/jobs` | `admin.jobs` | `AdminJobController@index` | All jobs |
| `PATCH` | `/api/v1/admin/jobs/{id}/status` | `admin.jobs.status` | `AdminJobController@updateStatus` | Suspend job |
| `GET` | `/api/v1/admin/reports` | `admin.reports` | `AdminReportController@index` | Content reports |
| `PATCH` | `/api/v1/admin/reports/{id}` | `admin.reports.resolve` | `AdminReportController@resolve` | Resolve report |
| `GET` | `/api/v1/admin/disputes` | `admin.disputes` | `AdminDisputeController@index` | All disputes |
| `GET` | `/api/v1/admin/verifications/queue` | `admin.verif.queue` | `AdminVerifController@queue` | Review queue |
| `POST` | `/api/v1/admin/verifications/{id}/approve` | `admin.verif.approve` | `AdminVerifController@approve` | Approve |
| `POST` | `/api/v1/admin/verifications/{id}/reject` | `admin.verif.reject` | `AdminVerifController@reject` | Reject |
| `GET` | `/api/v1/admin/feature-flags` | `admin.flags` | `AdminFlagController@index` | All flags |
| `PATCH` | `/api/v1/admin/feature-flags/{key}` | `admin.flags.update` | `AdminFlagController@update` | Update flag |
| `GET` | `/api/v1/admin/dashboard` | `admin.dashboard` | `AdminDashboardController@index` | KPIs |
| `GET` | `/api/v1/admin/activity-log` | `admin.activity` | `AdminActivityController@index` | Audit trail |

---

## 6. MonkeysLegion File Map

```
app/
├── Controller/
│   ├── AuthController.php
│   ├── UserController.php
│   ├── FreelancerController.php
│   ├── ClientController.php
│   ├── JobController.php
│   ├── ProposalController.php
│   ├── ContractController.php
│   ├── MilestoneController.php
│   ├── DisputeController.php
│   ├── ReviewController.php
│   ├── EscrowController.php
│   ├── InvoiceController.php
│   ├── PaymentMethodController.php
│   ├── PayoutController.php
│   ├── VerificationController.php
│   ├── ConversationController.php
│   ├── NotificationController.php
│   ├── SkillController.php
│   ├── CategoryController.php
│   ├── Ai/
│   │   ├── AiScopeController.php
│   │   ├── AiMatchController.php
│   │   ├── AiFraudController.php
│   │   └── AiDecisionController.php
│   └── Admin/
│       ├── AdminUserController.php
│       ├── AdminJobController.php
│       ├── AdminReportController.php
│       ├── AdminDisputeController.php
│       ├── AdminVerifController.php
│       ├── AdminFlagController.php
│       ├── AdminDashboardController.php
│       └── AdminActivityController.php
├── Entity/
│   ├── User.php
│   ├── UserSession.php
│   ├── UserOAuth.php
│   ├── FreelancerProfile.php
│   ├── ClientProfile.php
│   ├── Skill.php
│   ├── Category.php
│   ├── Job.php
│   ├── JobAttachment.php
│   ├── Proposal.php
│   ├── Contract.php
│   ├── Milestone.php
│   ├── Deliverable.php
│   ├── Dispute.php
│   ├── DisputeMessage.php
│   ├── Review.php
│   ├── EscrowTransaction.php
│   ├── Invoice.php
│   ├── InvoiceLine.php
│   ├── PaymentMethod.php
│   ├── Payout.php
│   ├── Verification.php
│   ├── Conversation.php
│   ├── Message.php
│   ├── Notification.php
│   ├── AiDecisionLog.php
│   ├── FeatureFlag.php
│   ├── Report.php
│   ├── ActivityLog.php
│   └── Invitation.php
├── Enum/
│   ├── UserRole.php
│   ├── UserStatus.php
│   ├── JobStatus.php
│   ├── BudgetType.php
│   ├── ProposalStatus.php
│   ├── ContractStatus.php
│   ├── MilestoneStatus.php
│   ├── DisputeReason.php
│   ├── DisputeStatus.php
│   ├── EscrowType.php
│   ├── EscrowStatus.php
│   ├── InvoiceStatus.php
│   ├── PayoutStatus.php
│   ├── VerificationType.php
│   ├── VerificationStatus.php
│   └── VerificationLevel.php
├── Repository/
│   ├── UserRepository.php
│   ├── FreelancerRepository.php
│   ├── ClientRepository.php
│   ├── JobRepository.php
│   ├── ProposalRepository.php
│   ├── ContractRepository.php
│   ├── MilestoneRepository.php
│   ├── DisputeRepository.php
│   ├── ReviewRepository.php
│   ├── EscrowRepository.php
│   ├── InvoiceRepository.php
│   ├── PaymentMethodRepository.php
│   ├── PayoutRepository.php
│   ├── VerificationRepository.php
│   ├── ConversationRepository.php
│   ├── MessageRepository.php
│   ├── NotificationRepository.php
│   ├── AiDecisionRepository.php
│   ├── ReportRepository.php
│   └── ActivityLogRepository.php
├── Service/
│   ├── AuthService.php
│   ├── JobService.php
│   ├── ProposalService.php
│   ├── ContractService.php
│   ├── MilestoneService.php
│   ├── EscrowService.php
│   ├── InvoiceService.php
│   ├── PayoutService.php
│   ├── VerificationService.php
│   ├── NotificationService.php
│   ├── SearchService.php
│   ├── Ai/
│   │   ├── ScopeAssistantService.php
│   │   ├── MatchEngineService.php
│   │   ├── FraudDetectionService.php
│   │   └── AiAuditService.php
│   └── Billing/
│       ├── StripeGateway.php
│       ├── PayPalGateway.php
│       └── PaymentGatewayInterface.php
├── Event/
│   ├── JobCreated.php
│   ├── JobPublished.php
│   ├── ProposalSubmitted.php
│   ├── ProposalAccepted.php
│   ├── ContractStarted.php
│   ├── ContractCompleted.php
│   ├── MilestoneSubmitted.php
│   ├── MilestoneAccepted.php
│   ├── EscrowFunded.php
│   ├── EscrowReleased.php
│   ├── DisputeOpened.php
│   ├── DisputeResolved.php
│   ├── ReviewCreated.php
│   ├── VerificationStatusChanged.php
│   ├── FraudScoreComputed.php
│   └── UserRegistered.php
├── Middleware/
│   ├── AuthMiddleware.php
│   ├── RoleGuard.php
│   ├── RateLimitMiddleware.php
│   ├── FraudCheckMiddleware.php
│   └── CorsMiddleware.php
├── Validator/
│   ├── JobValidator.php
│   ├── ProposalValidator.php
│   ├── RegistrationValidator.php
│   └── MilestoneValidator.php
└── config/
    ├── app.mlc
    ├── database.mlc
    ├── routing.mlc
    ├── ai.mlc
    └── billing.mlc
```

---

## 7. Middleware & Guards

| Middleware | Applied To | Logic |
|-----------|-----------|-------|
| `AuthMiddleware` | All `/api/v1/*` except auth routes | JWT validation, attach user to request |
| `RoleGuard('admin')` | All `/api/v1/admin/*` | Check `user.role == admin` |
| `RoleGuard('ops,admin')` | Verification queue, disputes | Either role |
| `RoleGuard('client')` | Job create, proposal accept | Must be client |
| `RoleGuard('freelancer')` | Proposal submit, deliverable upload | Must be freelancer |
| `RateLimitMiddleware` | Global | 100 req/min per IP, 1000/min per user |
| `FraudCheckMiddleware` | Proposal create, account activity | Async fraud scoring |
| `CorsMiddleware` | Global | Allow configured origins |

---

## 8. Event Bus — Pub/Sub Mapping

| MonkeysLegion Event | Pub/Sub Topic | Subscribers |
|--------------------|---------------|-------------|
| `JobCreated` | `job-events` | ai-scope-assistant, ai-match-v1 |
| `JobPublished` | `job-events` | notification-dispatcher |
| `ProposalSubmitted` | `proposal-events` | ai-fraud-v1, notification-dispatcher |
| `ProposalAccepted` | `proposal-events` | contract-creator, notification-dispatcher |
| `ContractStarted` | `milestone-events` | escrow-service |
| `MilestoneSubmitted` | `milestone-events` | notification-dispatcher |
| `MilestoneAccepted` | `milestone-events` | escrow-service (release), invoice-generator |
| `EscrowFunded` | `milestone-events` | notification-dispatcher |
| `EscrowReleased` | `milestone-events` | payout-processor, notification-dispatcher |
| `DisputeOpened` | `milestone-events` | escrow-service (hold), notification-dispatcher |
| `DisputeResolved` | `milestone-events` | escrow-service (release/refund) |
| `VerificationStatusChanged` | `verification-events` | profile-updater, notification-dispatcher |
| `FraudScoreComputed` | `fraud-events` | enforcement-service |
| `ReviewCreated` | `audit-events` | profile-stats-updater |
| `UserRegistered` | `verification-events` | verification-automation, welcome-email |
| **All events** | `audit-events` | audit-sink (BigQuery) |

---

## 9. AI Integration Points

| AI Service | Trigger | Input Entity | Output Entity | Writes To |
|-----------|---------|--------------|---------------|-----------|
| **Scope Assistant** | Job published | Job | Job.ai_scope (JSONB) | `jobs.ai_scope`, `ai_decision_log` |
| **Match Engine** | Job published | Job + FreelancerProfile[] | Proposal.ai_match_score | `proposals.ai_match_*`, `ai_decision_log` |
| **Fraud Detection** | Proposal submitted, Account activity | Proposal + User | Proposal.ai_fraud_score | `proposals.ai_fraud_*`, `ai_decision_log` |
| **Verification Auto** | Verification submitted | Verification | Verification.status | `verifications.*`, `ai_decision_log` |

### AI Service HTTP contracts (internal calls from api-core):

```
POST /api/v1/ai/scope/analyze
  ← { job_id, title, description, category, skills, budget_type, budget_range }
  → { milestones[], total_hours, confidence, complexity_tier, model_version }

POST /api/v1/ai/match/rank
  ← { job_id, limit }
  → { results[{freelancer_id, score, breakdown, explanation}], model_version, ab_group }

POST /api/v1/ai/fraud/check
  ← { account_id, entity_type, entity_id }
  → { fraud_score, risk_tier, recommended_action, risk_factors[], model_version }
```

---

## Summary Counts

| What | Count |
|------|-------|
| Entities | 30 |
| Enums | 16 |
| API Routes | 108 |
| Controllers | 28 |
| Repositories | 20 |
| Services | 16 |
| Events | 16 |
| Pivot Tables | 4 |
