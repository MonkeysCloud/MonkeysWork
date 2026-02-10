# Developer Onboarding

## Prerequisites
1. Request GCP IAM access from admin
2. Install: gcloud, terraform, kubectl, docker, php 8.2+, python 3.11+
3. Clone repo: `git clone git@github.com:monkeyswork/monkeyswork.git`

## Setup
```bash
make bootstrap
```

## Daily Workflow
```bash
make test SVC=ai-fraud-v1     # Run tests
make build SVC=ai-fraud-v1    # Build image
make logs SVC=ai-fraud-v1     # Tail logs
make k8s-status               # Check pods
```

## Architecture Decisions
See [ADR Index](adr/README.md)
