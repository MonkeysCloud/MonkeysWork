-- Support tickets table
CREATE TABLE IF NOT EXISTS support_ticket (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) REFERENCES "user"(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    subject         VARCHAR(500) NOT NULL,
    message         TEXT NOT NULL,
    category        VARCHAR(50) DEFAULT 'general',
    priority        VARCHAR(20) DEFAULT 'normal',
    status          VARCHAR(20) DEFAULT 'open',
    attachments     JSONB DEFAULT '[]',
    assigned_to     VARCHAR(36) REFERENCES "user"(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_status ON support_ticket(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_priority ON support_ticket(priority);
CREATE INDEX IF NOT EXISTS idx_support_ticket_category ON support_ticket(category);
CREATE INDEX IF NOT EXISTS idx_support_ticket_user_id ON support_ticket(user_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_created ON support_ticket(created_at DESC);

-- Support replies table
CREATE TABLE IF NOT EXISTS support_reply (
    id              VARCHAR(36) PRIMARY KEY,
    ticket_id       VARCHAR(36) NOT NULL REFERENCES support_ticket(id) ON DELETE CASCADE,
    user_id         VARCHAR(36) REFERENCES "user"(id) ON DELETE SET NULL,
    message         TEXT NOT NULL,
    is_admin        BOOLEAN DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_reply_ticket ON support_reply(ticket_id);
