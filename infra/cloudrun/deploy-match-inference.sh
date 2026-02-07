#!/bin/bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ENV="${ENV:-dev}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

gcloud run deploy mw-${ENV}-ai-match-inference \
  --image "${REGISTRY}/ai-match-v1:${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "mw-${ENV}-ai-match@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "FEATURE_FLAG_AI_MATCH=true,MATCH_MODEL_VERSION=v1.0.0" \
  --min-instances 0 \
  --max-instances 20 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 300 \
  --concurrency 20 \
  --ingress internal \
  --vpc-connector "mw-${ENV}-connector" \
  --no-allow-unauthenticated \
  --labels "environment=${ENV},service=ai-match"
