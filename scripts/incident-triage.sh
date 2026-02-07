#!/bin/bash
set -euo pipefail

INCIDENT_TYPE="${1:?Usage: incident-triage.sh <latency-spike|error-spike|bad-model-release>}"
ENV="${ENV:-prod}"

echo "=== Incident Triage: $INCIDENT_TYPE (env: $ENV) ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

case "$INCIDENT_TYPE" in
  "latency-spike")
    echo "→ Pod resource usage:"
    kubectl top pods -n monkeyswork --sort-by=cpu 2>/dev/null || echo "  metrics-server not available"
    kubectl top pods -n monkeyswork-ai --sort-by=cpu 2>/dev/null || echo "  metrics-server not available"
    echo ""
    echo "→ Non-running pods:"
    kubectl get pods -n monkeyswork --field-selector=status.phase!=Running
    kubectl get pods -n monkeyswork-ai --field-selector=status.phase!=Running
    echo ""
    echo "→ HPA status:"
    kubectl get hpa -n monkeyswork
    kubectl get hpa -n monkeyswork-ai
    ;;

  "error-spike")
    echo "→ Pod restart counts:"
    kubectl get pods -n monkeyswork -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount --sort-by=.status.containerStatuses[0].restartCount
    echo ""
    echo "→ Recent events:"
    kubectl get events -n monkeyswork --sort-by='.lastTimestamp' | tail -20
    ;;

  "bad-model-release")
    echo "→ EMERGENCY: Kill-switch AI features:"
    echo "   kubectl set env deployment/ai-scope-assistant FEATURE_FLAG_AI_SCOPE=false -n monkeyswork-ai"
    echo "   kubectl set env deployment/ai-match-v1 FEATURE_FLAG_AI_MATCH=false -n monkeyswork-ai"
    echo "   kubectl set env deployment/ai-fraud-v1 FEATURE_FLAG_FRAUD_SCORING=false -n monkeyswork-ai"
    echo ""
    echo "→ Rollback model: ./scripts/rollback-model.sh <model-name> <version>"
    ;;

  *)
    echo "Unknown: $INCIDENT_TYPE"
    echo "Available: latency-spike, error-spike, bad-model-release"
    exit 1
    ;;
esac

echo ""
echo "=== Console Links ==="
echo "Logs:  https://console.cloud.google.com/logs"
echo "GKE:   https://console.cloud.google.com/kubernetes"
