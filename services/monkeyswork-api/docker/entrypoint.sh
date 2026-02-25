#!/bin/sh
# Fix permissions on volume-mounted directories before starting services.
# The emptyDir volume at /app/www/public/files is owned by root after GCS sync;
# PHP-FPM (www-data, UID 82) needs write access to save uploads.

if [ -d /app/www/public/files ]; then
    chown -R 82:82 /app/www/public/files
    chmod -R 775 /app/www/public/files
fi

# Ensure log directories are writable
if [ -d /app/www/var ]; then
    chown -R 82:82 /app/www/var
    chmod -R 775 /app/www/var
fi

exec "$@"
