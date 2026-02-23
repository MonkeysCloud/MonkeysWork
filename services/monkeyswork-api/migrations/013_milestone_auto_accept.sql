-- Add auto_accept_at column for 14-day auto-acceptance of submitted milestones
ALTER TABLE "milestone" ADD COLUMN IF NOT EXISTS auto_accept_at TIMESTAMPTZ;
