#!/bin/bash
set -euo pipefail

echo "=== MonkeysWork Dev Bootstrap ==="

command -v gcloud >/dev/null 2>&1 || { echo "Install gcloud SDK first"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Install terraform first"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "Install kubectl first"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Install docker first"; exit 1; }

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID env var}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
ENV="dev"

echo "→ Authenticating to GCP..."
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud config set compute/region "$REGION"
gcloud config set compute/zone "$ZONE"

echo "→ Creating Terraform state bucket..."
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://monkeyswork-terraform-state" 2>/dev/null || true
gsutil versioning set on "gs://monkeyswork-terraform-state"

echo "→ Applying Terraform..."
cd terraform/
cp terraform.tfvars.example terraform.tfvars
echo "⚠️  Edit terraform/terraform.tfvars with your values, then press Enter"
read -r

terraform init
terraform plan -out=tfplan
echo "Review the plan above. Apply? (y/n)"
read -r confirm
if [[ "$confirm" == "y" ]]; then
    terraform apply tfplan
fi

echo "→ Configuring kubectl..."
gcloud container clusters get-credentials "mw-${ENV}-cluster" --zone "$ZONE"

echo "→ Applying Kubernetes manifests..."
cd ..
kubectl apply -k infra/k8s/overlays/${ENV}/

echo "→ Creating K8s secrets..."
DB_IP=$(cd terraform && terraform output -raw cloudsql_private_ip)

kubectl create secret generic db-credentials \
  --namespace=monkeyswork \
  --from-literal=host="$DB_IP" \
  --from-literal=password="SET_ME" \
  --from-literal=database=monkeyswork \
  --from-literal=user=mw_app \
  --dry-run=client -o yaml | kubectl apply -f -

echo "→ Building and pushing images..."
REGISTRY=$(cd terraform && terraform output -raw artifact_registry_url)

for service in api-core ai-scope-assistant ai-match-v1 ai-fraud-v1 verification-automation; do
    echo "  Building $service..."
    docker build -t "$REGISTRY/$service:dev-latest" "services/$service/"
    docker push "$REGISTRY/$service:dev-latest"
done

echo "=== Bootstrap complete! ==="
echo "Run 'kubectl get pods -A' to verify."
