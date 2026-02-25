#!/bin/bash
set -euo pipefail

SERVICE="${1:?Usage: deploy-prod.sh <service-name> [image-tag]}"
IMAGE_TAG="${2:-$(git rev-parse --short HEAD)}"
ENV="prod"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

echo "=== PRODUCTION DEPLOY: $SERVICE (tag: $IMAGE_TAG) ==="
echo "⚠️  This will deploy to PRODUCTION. Are you sure? (yes/no)"
read -r confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 1
fi

# 1. Build + push
echo "→ Building image..."
docker build -t "$REGISTRY/$SERVICE:$IMAGE_TAG" "services/$SERVICE/"
docker push "$REGISTRY/$SERVICE:$IMAGE_TAG"

# 2. Update deployment
echo "→ Updating K8s deployment..."
gcloud container clusters get-credentials "mw-${ENV}-cluster" --zone "$ZONE"

NAMESPACE="monkeyswork"
[[ "$SERVICE" == ai-* ]] && NAMESPACE="monkeyswork-ai"

MANIFEST_DIR="infra/k8s/$SERVICE"
if [[ -d "$MANIFEST_DIR" ]]; then
    echo "→ Applying all manifests in $MANIFEST_DIR/"
    for manifest in "$MANIFEST_DIR"/*.yaml; do
        if [[ "$manifest" == *deployment.yaml ]]; then
            # Replace the image tag in deployment manifests
            echo "  • $(basename "$manifest") (with image tag)"
            sed "s|image: .*${SERVICE}:.*|image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}|" "$manifest" \
              | kubectl apply -n "$NAMESPACE" -f -
        else
            # Apply other manifests (cronjobs, services, etc.) as-is
            echo "  • $(basename "$manifest")"
            kubectl apply -n "$NAMESPACE" -f "$manifest"
        fi
    done
else
    kubectl set image "deployment/$SERVICE" \
      "$SERVICE=$REGISTRY/$SERVICE:$IMAGE_TAG" \
      -n "$NAMESPACE"
fi

# 3. Wait for rollout
echo "→ Waiting for rollout..."
kubectl rollout status "deployment/$SERVICE" -n "$NAMESPACE" --timeout=600s

# 4. Verify
echo "→ Verifying health..."
sleep 10
POD=$(kubectl get pod -n "$NAMESPACE" -l "app=$SERVICE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [[ -n "$POD" ]]; then
    kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/healthz || {
        echo "❌ Health check failed! Rolling back..."
        kubectl rollout undo "deployment/$SERVICE" -n "$NAMESPACE"
        exit 1
    }
fi

echo "✅ $SERVICE deployed to PRODUCTION (tag: $IMAGE_TAG)"
