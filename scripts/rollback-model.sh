#!/bin/bash
set -euo pipefail

MODEL_NAME="${1:?Usage: rollback-model.sh <model-name> <target-version>}"
TARGET_VERSION="${2:?Provide target version}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ENV="${ENV:-prod}"

echo "=== Rolling back $MODEL_NAME to $TARGET_VERSION ==="

MODEL_ID=$(gcloud ai models list \
  --region="$REGION" \
  --filter="displayName:${MODEL_NAME}-${TARGET_VERSION}" \
  --format="value(name)" | head -1)

if [[ -z "$MODEL_ID" ]]; then
    echo "❌ Model not found. Available:"
    gcloud ai models list --region="$REGION" --filter="displayName~${MODEL_NAME}" --format="table(displayName,createTime)"
    exit 1
fi

ENDPOINT_NAME="${MODEL_NAME}-endpoint"
ENDPOINT_ID=$(gcloud ai endpoints list \
  --region="$REGION" \
  --filter="displayName=${ENDPOINT_NAME}" \
  --format="value(name)" | head -1)

gcloud ai endpoints deploy-model "$ENDPOINT_ID" \
  --region="$REGION" \
  --model="$MODEL_ID" \
  --display-name="${MODEL_NAME}-serving" \
  --machine-type="n1-standard-4" \
  --min-replica-count=1 \
  --max-replica-count=5 \
  --traffic-split="0=100"

echo "✅ $MODEL_NAME rolled back to $TARGET_VERSION"
