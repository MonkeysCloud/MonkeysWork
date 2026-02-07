#!/bin/bash
set -euo pipefail

FEATURE_SET="${1:?Usage: backfill-features.sh <feature-set> [start-date] [end-date]}"
START_DATE="${2:-$(date -d '90 days ago' +%Y-%m-%d 2>/dev/null || date -v-90d +%Y-%m-%d)}"
END_DATE="${3:-$(date +%Y-%m-%d)}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"

echo "=== Backfilling features: $FEATURE_SET ($START_DATE → $END_DATE) ==="

case "$FEATURE_SET" in
  "match-embeddings")
    gcloud ai custom-jobs create \
      --region="$REGION" \
      --display-name="backfill-match-embeddings-$(date +%Y%m%d)" \
      --worker-pool-spec="machine-type=n1-standard-8,replica-count=1,container-image-uri=${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-prod-services/ai-match-v1:latest" \
      --args="--mode=backfill,--start-date=$START_DATE,--end-date=$END_DATE"
    ;;
  "fraud-features")
    gcloud ai custom-jobs create \
      --region="$REGION" \
      --display-name="backfill-fraud-features-$(date +%Y%m%d)" \
      --worker-pool-spec="machine-type=n1-standard-4,replica-count=1,container-image-uri=${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-prod-services/ai-fraud-v1:latest" \
      --args="--mode=backfill,--start-date=$START_DATE,--end-date=$END_DATE"
    ;;
  *)
    echo "Unknown: $FEATURE_SET (available: match-embeddings, fraud-features)"
    exit 1
    ;;
esac

echo "✅ Backfill submitted"
