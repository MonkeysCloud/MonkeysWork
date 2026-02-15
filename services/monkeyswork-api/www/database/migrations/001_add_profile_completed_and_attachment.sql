-- Migration: Add profile_completed to users table + create attachment table
-- Run against your PostgreSQL database

-- 1. Add profile_completed column to "user" table
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create attachment table (polymorphic, reusable across entities)
CREATE TABLE IF NOT EXISTS attachment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50)  NOT NULL,
    entity_id       UUID         NOT NULL,
    uploaded_by     UUID         NOT NULL REFERENCES "user"(id),
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT         NOT NULL,
    file_url        TEXT         NOT NULL,
    file_size       BIGINT       NOT NULL DEFAULT 0,
    mime_type       VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for polymorphic lookups
CREATE INDEX IF NOT EXISTS idx_attachment_entity
    ON attachment (entity_type, entity_id);

-- Index for user's uploads
CREATE INDEX IF NOT EXISTS idx_attachment_uploaded_by
    ON attachment (uploaded_by);
