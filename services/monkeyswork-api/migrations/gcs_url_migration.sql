-- GCS URL Migration
-- Converts all relative file paths to absolute GCS public URLs.
-- Bucket: mw-prod-uploads-monkeyswork
-- Safe to run multiple times (idempotent — skips already-converted URLs).
-- Each statement runs independently so a missing table doesn't roll back others.

-- 1. User avatars
UPDATE "user"
SET avatar_url = 'https://storage.googleapis.com/mw-prod-uploads-monkeyswork' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'https://%'
  AND avatar_url LIKE '/files/%';

-- 2. Attachments (jobs, proposals, milestones, messages, time entries, etc.)
UPDATE "attachment"
SET file_url = 'https://storage.googleapis.com/mw-prod-uploads-monkeyswork' || file_url
WHERE file_url IS NOT NULL
  AND file_url NOT LIKE 'https://%'
  AND file_url LIKE '/files/%';

-- 3. Blog post cover images
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_post') THEN
    EXECUTE '
      UPDATE "blog_post"
      SET cover_image = ''https://storage.googleapis.com/mw-prod-uploads-monkeyswork'' || cover_image
      WHERE cover_image IS NOT NULL
        AND cover_image NOT LIKE ''https://%''
        AND cover_image LIKE ''/files/%''
    ';
    -- 4. Blog post content — inline images
    EXECUTE '
      UPDATE "blog_post"
      SET content = REPLACE(content, ''src="/files/'', ''src="https://storage.googleapis.com/mw-prod-uploads-monkeyswork/files/'')
      WHERE content LIKE ''%src="/files/%''
        AND content NOT LIKE ''%storage.googleapis.com%''
    ';
  END IF;
END $$;

-- 5. Support ticket attachments (JSONB)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket') THEN
    EXECUTE '
      UPDATE "support_ticket"
      SET attachments = (
        SELECT jsonb_agg(
          CASE
            WHEN elem->>''url'' LIKE ''/files/%'' AND elem->>''url'' NOT LIKE ''https://%''
            THEN jsonb_set(elem, ''{url}'',
              to_jsonb(''https://storage.googleapis.com/mw-prod-uploads-monkeyswork'' || (elem->>''url'')))
            ELSE elem
          END
        )
        FROM jsonb_array_elements(attachments) AS elem
      )
      WHERE attachments IS NOT NULL
        AND attachments::text LIKE ''%/files/%''
        AND attachments::text NOT LIKE ''%storage.googleapis.com%''
    ';
  END IF;
END $$;
