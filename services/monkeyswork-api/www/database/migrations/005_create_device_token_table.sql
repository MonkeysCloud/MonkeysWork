-- 005: Add device_token table for push notifications (FCM)

CREATE TABLE IF NOT EXISTS "device_token" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,
    platform    TEXT NOT NULL DEFAULT 'ios',  -- 'ios' or 'android'
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_token_user ON "device_token"(user_id);
CREATE INDEX IF NOT EXISTS idx_device_token_token ON "device_token"(token);
