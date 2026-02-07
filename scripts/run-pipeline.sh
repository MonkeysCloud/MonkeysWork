#!/bin/bash
set -euo pipefail

PIPELINE="${1:?Usage: run-pipeline.sh <pipeline-name> [env]}"
ENV="${2:-dev}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"

echo "=== Running Vertex AI Pipeline: $PIPELINE ($ENV) ==="

cd ml/${PIPELINE}

# Compile pipeline
python pipeline.py

# Submit to Vertex AI
gcloud ai pipelines runs create \
  --region="$REGION" \
  --display-name="${PIPELINE}-$(date +%Y%m%d-%H%M%S)" \
  --pipeline-spec="${PIPELINE}_pipeline.json" \
  --parameter-values="project_id=$PROJECT_ID,region=$REGION"

echo "✅ Pipeline submitted. Monitor at:"
echo "   https://console.cloud.google.com/vertex-ai/pipelines?project=$PROJECT_ID"
