-- Migration: Create invitations table
-- PostgreSQL

CREATE TABLE IF NOT EXISTS "invitations" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID         NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
    client_id       UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    freelancer_id   UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    message         TEXT         DEFAULT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    responded_at    TIMESTAMPTZ  DEFAULT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_freelancer
    ON "invitations" (freelancer_id, status);

CREATE INDEX IF NOT EXISTS idx_invitations_client
    ON "invitations" (client_id);

CREATE INDEX IF NOT EXISTS idx_invitations_job
    ON "invitations" (job_id);

-- Prevent duplicate invitations for same job+freelancer
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_job_freelancer
    ON "invitations" (job_id, freelancer_id);
