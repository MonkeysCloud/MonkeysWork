#!/bin/bash
set -euo pipefail

ENV="${1:-dev}"
echo "=== Running migrations for $ENV ==="

# Get DB connection from terraform or secrets
DB_HOST="${DB_HOST:?Set DB_HOST}"
DB_NAME="${DB_NAME:-monkeyswork}"
DB_USER="${DB_USER:-mw_app}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD}"

for migration in data/migrations/*.sql; do
    echo "→ Applying $(basename $migration)..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
done

echo "✅ All migrations applied"
