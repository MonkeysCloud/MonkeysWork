-- Companies table (standalone entity, 1:N with users)
CREATE TABLE IF NOT EXISTS company (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    website         VARCHAR(500),
    industry        VARCHAR(100),
    size            VARCHAR(20),          -- solo, 2-10, 11-50, 51-200, 201-500, 500+
    description     TEXT,
    logo_url        TEXT,
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100),
    zip_code        VARCHAR(20),
    tax_id          VARCHAR(100),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    metadata        JSONB DEFAULT '{}',   -- extensible for future features
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_owner ON company(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_name ON company(name);

-- Link users to companies (many users → one company)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_user_company ON "user"(company_id);
