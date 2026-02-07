#!/bin/bash
set -euo pipefail

ENV="${1:-dev}"
echo "=== Seeding data for $ENV ==="

DB_HOST="${DB_HOST:?Set DB_HOST}"
DB_NAME="${DB_NAME:-monkeyswork}"
DB_USER="${DB_USER:-mw_app}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD}"

for seed in data/seeds/*.sql; do
    echo "→ Seeding $(basename $seed)..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$seed"
done

echo "✅ Seeding complete"
