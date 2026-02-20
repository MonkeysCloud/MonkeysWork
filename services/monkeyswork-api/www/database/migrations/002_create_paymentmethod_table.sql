-- Migration: Create paymentmethod table + add stripe columns
-- PostgreSQL

-- 1. Add stripe_customer_id column to "user" table (for Stripe integration)
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL;

-- 2. Create paymentmethod table
CREATE TABLE IF NOT EXISTS "paymentmethod" (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                    UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type                       VARCHAR(30)  NOT NULL,                  -- card, us_bank_account, paypal
    provider                   VARCHAR(30)  NOT NULL,                  -- visa, mastercard, paypal, bank name…
    last_four                  VARCHAR(10)  NOT NULL,                  -- last 4 digits
    token                      VARCHAR(255) DEFAULT NULL,              -- encrypted gateway token (legacy)
    stripe_payment_method_id   VARCHAR(255) DEFAULT NULL,              -- Stripe PM id (pm_xxx)
    is_default                 BOOLEAN      NOT NULL DEFAULT FALSE,
    expiry                     VARCHAR(7)   DEFAULT NULL,              -- MM/YYYY
    metadata                   JSONB        DEFAULT NULL,
    is_active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- In case table already exists but is missing stripe_payment_method_id
ALTER TABLE "paymentmethod"
    ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255) DEFAULT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_paymentmethod_user
    ON "paymentmethod" (user_id);

CREATE INDEX IF NOT EXISTS idx_paymentmethod_user_active
    ON "paymentmethod" (user_id, is_active);
