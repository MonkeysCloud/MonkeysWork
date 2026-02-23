-- GCS URL Migration
-- Run this AFTER deploying the new code and syncing existing files to GCS bucket.
-- This converts relative paths to absolute GCS URLs.
--
-- Bucket: mw-prod-uploads-monkeyswork
-- Base URL: https://storage.googleapis.com/mw-prod-uploads-monkeyswork
--
-- Step 1: First sync existing local files to GCS:
--   gsutil -m rsync -r /app/www/public/files/ gs://mw-prod-uploads-monkeyswork/
--
-- Step 2: Run this migration:

BEGIN;

-- Avatars
UPDATE "user"
SET avatar_url = 'https://storage.googleapis.com/mw-prod-uploads-monkeyswork' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'https://%'
  AND avatar_url LIKE '/files/%';

-- Attachments
UPDATE "attachment"
SET file_url = 'https://storage.googleapis.com/mw-prod-uploads-monkeyswork' || file_url
WHERE file_url IS NOT NULL
  AND file_url NOT LIKE 'https://%'
  AND file_url LIKE '/files/%';

-- Blog post images (stored in content as HTML img src)
-- Note: Blog images in post content need manual review or a script
-- to update <img src="/files/blog/..."> references.

COMMIT;
