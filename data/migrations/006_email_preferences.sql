-- Email preferences table for per-user notification control
CREATE TABLE IF NOT EXISTS email_preference (
    user_id UUID PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    account_emails BOOLEAN NOT NULL DEFAULT true,
    contract_emails BOOLEAN NOT NULL DEFAULT true,
    proposal_emails BOOLEAN NOT NULL DEFAULT true,
    message_digest BOOLEAN NOT NULL DEFAULT true,
    review_emails BOOLEAN NOT NULL DEFAULT true,
    payment_emails BOOLEAN NOT NULL DEFAULT true,
    job_recommendations BOOLEAN NOT NULL DEFAULT true,
    marketing_emails BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
