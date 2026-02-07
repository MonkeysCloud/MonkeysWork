#!/bin/bash
# ─────────────────────────────────────────────────────────
# Setup Workload Identity Federation for GitHub Actions
# Run this once to enable GitHub Actions → GCP authentication
# ─────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="monkeyswork"
GITHUB_REPO="MonkeysCloud/MonkeysWork"
POOL_ID="mw-github-pool"
PROVIDER_ID="github-provider"
REGION="us-central1"

echo "=== Setting up WIF for project: $PROJECT_ID ==="
echo "=== GitHub repo: $GITHUB_REPO ==="
echo ""

# 1. Get project number (needed for WIF provider path)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
echo "Project number: $PROJECT_NUMBER"

# 2. Enable required APIs
echo ""
echo "=== Enabling required APIs ==="
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

# 3. Create Workload Identity Pool
echo ""
echo "=== Creating Workload Identity Pool ==="
gcloud iam workload-identity-pools create "$POOL_ID" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  2>/dev/null || echo "Pool already exists, skipping..."

# 4. Create OIDC Provider
echo ""
echo "=== Creating OIDC Provider ==="
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_ID" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  2>/dev/null || echo "Provider already exists, skipping..."

# 5. Create Service Accounts
echo ""
echo "=== Creating Service Accounts ==="

# Deploy SA (for cd-prod.yaml and cd-staging.yaml)
gcloud iam service-accounts create "mw-github-deploy" \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions Deploy" \
  2>/dev/null || echo "SA mw-github-deploy already exists, skipping..."

# Terraform SA (for terraform.yaml)
gcloud iam service-accounts create "mw-github-terraform" \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions Terraform" \
  2>/dev/null || echo "SA mw-github-terraform already exists, skipping..."

# Vertex SA (for ml-pipeline.yaml)
gcloud iam service-accounts create "mw-github-vertex" \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions Vertex AI" \
  2>/dev/null || echo "SA mw-github-vertex already exists, skipping..."

DEPLOY_SA="mw-github-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
TERRAFORM_SA="mw-github-terraform@${PROJECT_ID}.iam.gserviceaccount.com"
VERTEX_SA="mw-github-vertex@${PROJECT_ID}.iam.gserviceaccount.com"

# 6. Grant WIF access to SAs (allow GitHub to impersonate)
echo ""
echo "=== Granting WIF bindings ==="
WIF_PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}"

for SA_EMAIL in "$DEPLOY_SA" "$TERRAFORM_SA" "$VERTEX_SA"; do
  echo "  Binding $SA_EMAIL..."
  gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="$WIF_PRINCIPAL" \
    --quiet
done

# 7. Grant IAM roles to Deploy SA
echo ""
echo "=== Granting roles to Deploy SA ==="
for ROLE in "roles/container.developer" "roles/artifactregistry.writer"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOY_SA" \
    --role="$ROLE" \
    --quiet
done

# 8. Grant IAM roles to Terraform SA
echo ""
echo "=== Granting roles to Terraform SA ==="
for ROLE in "roles/editor" "roles/resourcemanager.projectIamAdmin"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$TERRAFORM_SA" \
    --role="$ROLE" \
    --quiet
done

# 9. Grant IAM roles to Vertex SA
echo ""
echo "=== Granting roles to Vertex SA ==="
for ROLE in "roles/aiplatform.user" "roles/storage.objectAdmin"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$VERTEX_SA" \
    --role="$ROLE" \
    --quiet
done

# 10. Print the values for GitHub Secrets
WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo ""
echo "=============================================="
echo "  SETUP COMPLETE! Add these GitHub Secrets:"
echo "=============================================="
echo ""
echo "Go to: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "  Secret Name          │ Value"
echo "  ─────────────────────┼──────────────────────────────────────"
echo "  GCP_WIF_PROVIDER     │ $WIF_PROVIDER"
echo "  GCP_DEPLOY_SA        │ $DEPLOY_SA"
echo "  GCP_TERRAFORM_SA     │ $TERRAFORM_SA"
echo "  GCP_VERTEX_SA        │ $VERTEX_SA"
echo ""
echo "=============================================="
