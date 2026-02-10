# MonkeysWork

**Curated, quality-first freelance marketplace with AI-powered matching, scope assistance, and fraud detection.**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GKE Cluster                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ monkeyswork- │  │ ai-scope     │  │ verification-│  │
│  │ api (PHP)    │  │ assistant    │  │ automation   │  │
│  └────┬─────────┘  └──────────────┘  └──────────────┘  │
│       │            ┌──────────────┐  ┌──────────────┐  │
│       │            │ ai-match-v1  │  │ ai-fraud-v1  │  │
│       │            └──────────────┘  └──────────────┘  │
└───────┼─────────────────────────────────────────────────┘
        │
   ┌────┴────┐   ┌──────────┐   ┌──────────────┐
   │ Cloud   │   │ Pub/Sub  │   │ Vertex AI    │
   │ SQL     │   │ Events   │   │ Pipelines    │
   └─────────┘   └──────────┘   └──────────────┘
```

## Quick Start

### Prerequisites

- Google Cloud SDK (`gcloud`)
- Terraform >= 1.6
- kubectl
- Docker
- PHP 8.2+ (for monkeyswork-api)
- Python 3.11+ (for ML services)

### Bootstrap

```bash
export PROJECT_ID=your-gcp-project
make bootstrap
```

### Common Commands

```bash
make help              # Show all targets
make build-all         # Build all Docker images
make test-all          # Run all tests
make deploy-staging SVC=ai-fraud-v1  # Deploy to staging
make k8s-status        # Check pod status
make logs SVC=ai-fraud-v1 # Tail service logs
make incident TYPE=latency-spike  # Run incident playbook
```

## Monorepo Structure

| Directory | Purpose |
|-----------|---------|
| `terraform/` | Infrastructure as Code (GCP resources) |
| `infra/k8s/` | Kubernetes manifests (Kustomize) |
| `infra/vertex/` | Vertex AI pipeline configs |
| `infra/cloudrun/` | Cloud Run service definitions |
| `services/` | Microservice source code |
| `ml/` | ML training pipelines and evaluation |
| `data/` | Schemas, migrations, seeds |
| `scripts/` | Operational runbooks |
| `.github/workflows/` | CI/CD pipelines |
| `docs/` | Architecture docs and ADRs |

## Services

| Service | Language | Purpose |
|---------|----------|---------|
| `monkeyswork-api` | PHP (MonkeysLegion) | Main API service |
| `ai-scope-assistant` | Python | Job scope decomposition |
| `ai-match-v1` | Python | Talent-job matching |
| `ai-fraud-v1` | Python | Fraud detection |
| `verification-automation` | Python | Identity/skill verification |
| `frontend` | Next.js | Web application |

## Environments

| Environment | GKE Cluster | Cloud SQL | Purpose |
|-------------|-------------|-----------|---------|
| dev | `mw-dev-cluster` | `mw-dev-postgres` | Development |
| staging | `mw-staging-cluster` | `mw-staging-postgres` | Pre-production |
| prod | `mw-prod-cluster` | `mw-prod-postgres` | Production |

## Documentation

- [Architecture Blueprint](docs/architecture.md)
- [ADR Index](docs/adr/README.md)
- [Onboarding Guide](docs/onboarding.md)

## License

Proprietary — MonkeysWork © 2026
