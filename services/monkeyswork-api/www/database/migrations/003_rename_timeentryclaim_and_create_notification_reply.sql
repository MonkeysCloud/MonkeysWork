-- Migration 003: Fix table name mismatch + create missing table
-- 1. Rename timeentryclaim -> time_entry_claim (controller uses underscored name)
-- 2. Create notification_reply table

-- Rename if old name still exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeentryclaim') THEN
        ALTER TABLE "timeentryclaim" RENAME TO "time_entry_claim";
    END IF;
END $$;

-- Create notification_reply
CREATE TABLE IF NOT EXISTS "notification_reply" (
    id               UUID PRIMARY KEY,
    notification_id  UUID NOT NULL REFERENCES "notification"(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    message          TEXT NOT NULL,
    attachment_id    UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_reply_notif ON "notification_reply"(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_reply_user  ON "notification_reply"(user_id);
