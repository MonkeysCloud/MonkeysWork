-- Blog & News Feature
-- Creates tables for blog posts, tags, and the many-to-many junction

BEGIN;

-- ── Blog Tags ─────────────────────────────────────
CREATE TABLE blog_tag (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Blog Posts ────────────────────────────────────
CREATE TABLE blog_post (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(255) NOT NULL UNIQUE,
    excerpt          TEXT,
    content          TEXT NOT NULL DEFAULT '',
    cover_image      VARCHAR(500),
    status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
    author_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    published_at     TIMESTAMP,
    meta_title       VARCHAR(255),
    meta_description TEXT,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blog_post_status      ON blog_post(status);
CREATE INDEX idx_blog_post_slug        ON blog_post(slug);
CREATE INDEX idx_blog_post_author      ON blog_post(author_id);
CREATE INDEX idx_blog_post_published   ON blog_post(published_at DESC)
    WHERE status = 'published';

-- ── Post ↔ Tag junction ──────────────────────────
CREATE TABLE blog_post_tag (
    post_id UUID NOT NULL REFERENCES blog_post(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES blog_tag(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_post_tag_tag ON blog_post_tag(tag_id);

COMMIT;
