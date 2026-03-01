#!/bin/bash
set -euo pipefail

SERVICE="${1:?Usage: deploy-staging.sh <service-name> [image-tag]}"
IMAGE_TAG="${2:-$(git rev-parse --short HEAD)}"
ENV="staging"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

echo "=== Deploying $SERVICE to staging (tag: $IMAGE_TAG) ==="

docker build -t "$REGISTRY/$SERVICE:$IMAGE_TAG" "services/$SERVICE/"
docker push "$REGISTRY/$SERVICE:$IMAGE_TAG"

gcloud container clusters get-credentials "mw-${ENV}-cluster" --zone "$ZONE"

NAMESPACE="monkeyswork"
[[ "$SERVICE" == ai-* ]] && NAMESPACE="monkeyswork-ai"

MANIFEST="infra/k8s/$SERVICE/deployment.yaml"
if [[ -f "$MANIFEST" ]]; then
    echo "→ Applying deployment manifest: $MANIFEST"
    sed "s|image: .*${SERVICE}:.*|image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}|" "$MANIFEST" \
      | kubectl apply -n "$NAMESPACE" -f -
else
    kubectl set image "deployment/$SERVICE" \
      "$SERVICE=$REGISTRY/$SERVICE:$IMAGE_TAG" \
      -n "$NAMESPACE"
fi

# Apply CronJobs on API deploy
if [[ "$SERVICE" == "monkeyswork-api" ]] && [[ -f "k8s/services/cron-jobs.yaml" ]]; then
    echo "→ Applying CronJob manifests..."
    kubectl apply -f "k8s/services/cron-jobs.yaml"
fi

kubectl rollout status "deployment/$SERVICE" -n "$NAMESPACE" --timeout=300s

echo "✅ $SERVICE deployed to staging (tag: $IMAGE_TAG)"
