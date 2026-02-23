#!/bin/bash
# ──────────────────────────────────────────────────────
# Sync local uploaded files → GCS production bucket
#
# Usage:
#   ./scripts/sync-files-to-gcs.sh          # sync all files
#   ./scripts/sync-files-to-gcs.sh blog     # sync only blog/
#   ./scripts/sync-files-to-gcs.sh --dry    # preview what would sync
# ──────────────────────────────────────────────────────

set -euo pipefail

GCS_BUCKET="gs://mw-prod-uploads-monkeyswork/files"
LOCAL_DIR="$(cd "$(dirname "$0")/../services/monkeyswork-api/www/public/files" && pwd)"

DRY_RUN=""
SUBDIR=""

for arg in "$@"; do
  case "$arg" in
    --dry|--dry-run) DRY_RUN="-n" ;;
    *) SUBDIR="$arg" ;;
  esac
done

SRC="$LOCAL_DIR"
DST="$GCS_BUCKET"
if [ -n "$SUBDIR" ]; then
  SRC="$LOCAL_DIR/$SUBDIR"
  DST="$GCS_BUCKET/$SUBDIR"
fi

if [ ! -d "$SRC" ]; then
  echo "❌ Source directory not found: $SRC"
  exit 1
fi

FILE_COUNT=$(find "$SRC" -type f | wc -l | tr -d ' ')
echo "📁 Source:      $SRC ($FILE_COUNT files)"
echo "☁️  Destination: $DST"
[ -n "$DRY_RUN" ] && echo "🔍 DRY RUN mode — no changes will be made"
echo ""

gsutil -m rsync -r $DRY_RUN "$SRC/" "$DST/"

echo ""
if [ -n "$DRY_RUN" ]; then
  echo "✅ Dry run complete. Remove --dry to sync for real."
else
  echo "✅ Synced $FILE_COUNT files to GCS."
  echo "   Production pods will pick these up on next restart."
  echo "   To force immediate reload: kubectl rollout restart deployment/monkeyswork-api -n monkeyswork"
fi
