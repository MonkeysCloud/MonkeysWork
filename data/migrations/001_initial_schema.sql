-- MonkeysWork Initial Schema
-- Migration: 001_initial_schema
-- Date: 2026-02-06

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings

-- ═══════════════════════════════════════════
-- USERS & AUTH
-- ═══════════════════════════════════════════

CREATE TYPE user_role AS ENUM ('client', 'freelancer', 'admin', 'ops');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated', 'pending_verification');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'pending_verification',
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ═══════════════════════════════════════════
-- FREELANCER PROFILES
-- ═══════════════════════════════════════════

CREATE TYPE verification_level AS ENUM ('none', 'basic', 'verified', 'premium');

CREATE TABLE freelancer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200),
    bio TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    experience_years INTEGER DEFAULT 0,
    verification_level verification_level NOT NULL DEFAULT 'none',
    portfolio_urls TEXT[] DEFAULT '{}',
    availability_status VARCHAR(20) DEFAULT 'available',
    response_rate DECIMAL(5,2) DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    profile_embedding VECTOR(384),  -- for matching
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_freelancer_skills ON freelancer_profiles USING GIN(skills);
CREATE INDEX idx_freelancer_embedding ON freelancer_profiles USING ivfflat (profile_embedding vector_cosine_ops) WITH (lists = 100);

-- ═══════════════════════════════════════════
-- JOBS
-- ═══════════════════════════════════════════

CREATE TYPE job_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'suspended');
CREATE TYPE budget_type AS ENUM ('fixed', 'hourly');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    budget_type budget_type NOT NULL,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status job_status NOT NULL DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    job_embedding VECTOR(384),  -- for matching
    ai_scope JSONB,  -- AI-generated scope breakdown
    ai_scope_model_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (job_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

-- ═══════════════════════════════════════════
-- PROPOSALS
-- ═══════════════════════════════════════════

CREATE TYPE proposal_status AS ENUM ('submitted', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    freelancer_id UUID NOT NULL REFERENCES users(id),
    cover_letter TEXT,
    bid_amount DECIMAL(12,2) NOT NULL,
    bid_type budget_type NOT NULL,
    estimated_duration_days INTEGER,
    status proposal_status NOT NULL DEFAULT 'submitted',
    milestones_proposed JSONB DEFAULT '[]'::jsonb,
    ai_match_score DECIMAL(5,4),
    ai_match_model_version VARCHAR(50),
    ai_fraud_score DECIMAL(5,4),
    ai_fraud_model_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, freelancer_id)
);

CREATE INDEX idx_proposals_job ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- ═══════════════════════════════════════════
-- CONTRACTS & MILESTONES
-- ═══════════════════════════════════════════

CREATE TYPE contract_status AS ENUM ('active', 'completed', 'disputed', 'cancelled');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'submitted', 'revision_requested', 'accepted', 'disputed');

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    client_id UUID NOT NULL REFERENCES users(id),
    freelancer_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status contract_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    status milestone_status NOT NULL DEFAULT 'pending',
    due_date DATE,
    deliverable_urls TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_contract ON milestones(contract_id);

-- ═══════════════════════════════════════════
-- DISPUTES
-- ═══════════════════════════════════════════

CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_client', 'resolved_freelancer', 'resolved_split', 'escalated');
CREATE TYPE dispute_reason AS ENUM ('quality', 'non_delivery', 'scope_change', 'payment', 'communication', 'other');

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    milestone_id UUID REFERENCES milestones(id),
    opened_by UUID NOT NULL REFERENCES users(id),
    against UUID NOT NULL REFERENCES users(id),
    reason dispute_reason NOT NULL,
    description TEXT NOT NULL,
    amount_disputed DECIMAL(12,2),
    status dispute_status NOT NULL DEFAULT 'open',
    evidence_urls TEXT[] DEFAULT '{}',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════
-- VERIFICATIONS
-- ═══════════════════════════════════════════

CREATE TYPE verification_type AS ENUM ('identity', 'skill_assessment', 'portfolio', 'work_history', 'payment_method');
CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'auto_approved', 'auto_rejected', 'human_review', 'approved', 'rejected');

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type verification_type NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(50),
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    decision_audit JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON verifications(user_id);
CREATE INDEX idx_verifications_status ON verifications(status);

-- ═══════════════════════════════════════════
-- AI DECISION AUDIT LOG
-- ═══════════════════════════════════════════

CREATE TABLE ai_decision_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(50) NOT NULL,  -- 'scope', 'match', 'fraud', 'verification'
    entity_type VARCHAR(50) NOT NULL,    -- 'job', 'proposal', 'account'
    entity_id UUID NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(50),
    input_hash VARCHAR(64),              -- SHA-256 of input for reproducibility
    output JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    latency_ms INTEGER,
    feature_flags JSONB DEFAULT '{}'::jsonb,
    explanation JSONB,
    human_override BOOLEAN DEFAULT false,
    override_by UUID REFERENCES users(id),
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_log_type ON ai_decision_log(decision_type, created_at DESC);
CREATE INDEX idx_ai_log_entity ON ai_decision_log(entity_type, entity_id);
CREATE INDEX idx_ai_log_model ON ai_decision_log(model_name, model_version);

-- ═══════════════════════════════════════════
-- FEATURE FLAGS (DB-backed)
-- ═══════════════════════════════════════════

CREATE TABLE feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'true'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (key, value, description) VALUES
    ('ai_scope_enabled', 'true', 'Enable AI scope assistant'),
    ('ai_match_enabled', 'true', 'Enable AI matching engine'),
    ('fraud_scoring_enabled', 'true', 'Enable fraud scoring'),
    ('auto_verification_enabled', 'true', 'Enable auto-verification'),
    ('fraud_enforcement_mode', '"shadow"', 'shadow|log_only|soft_block|enforce'),
    ('ab_test_match_percent', '0', 'Percentage of traffic using AI match (0-100)');

-- ═══════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_verifications_updated_at BEFORE UPDATE ON verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_freelancer_profiles_updated_at BEFORE UPDATE ON freelancer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
