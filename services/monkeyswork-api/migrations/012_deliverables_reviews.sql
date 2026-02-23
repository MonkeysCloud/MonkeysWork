-- deliverables table (for milestone file submissions)
CREATE TABLE IF NOT EXISTS "deliverables" (
    id            UUID PRIMARY KEY,
    milestone_id  UUID NOT NULL REFERENCES "milestone"(id) ON DELETE CASCADE,
    file_url      TEXT NOT NULL DEFAULT '',
    file_name     VARCHAR(255) NOT NULL DEFAULT 'file',
    file_size     BIGINT NOT NULL DEFAULT 0,
    mime_type     VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    notes         TEXT,
    version       INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_milestone ON "deliverables"(milestone_id);

-- review table (for contract reviews)
CREATE TABLE IF NOT EXISTS "review" (
    id                      UUID PRIMARY KEY,
    contract_id             UUID NOT NULL REFERENCES "contract"(id) ON DELETE CASCADE,
    reviewer_id             UUID NOT NULL REFERENCES "user"(id),
    reviewee_id             UUID NOT NULL REFERENCES "user"(id),
    overall_rating          INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    communication_rating    INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    quality_rating          INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    timeliness_rating       INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
    comment                 TEXT,
    response                TEXT,
    response_at             TIMESTAMPTZ,
    is_public               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_contract ON "review"(contract_id);
CREATE INDEX IF NOT EXISTS idx_review_reviewer ON "review"(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_reviewee ON "review"(reviewee_id);
