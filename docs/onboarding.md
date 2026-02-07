# Developer Onboarding

## Prerequisites
1. Request GCP IAM access from admin
2. Install: gcloud, terraform, kubectl, docker, node 20+, python 3.11+
3. Clone repo: `git clone git@github.com:monkeyswork/monkeyswork.git`

## Setup
```bash
make bootstrap
```

## Daily Workflow
```bash
make test SVC=api-core     # Run tests
make build SVC=api-core    # Build image
make logs SVC=api-core     # Tail logs
make k8s-status            # Check pods
```

## Architecture Decisions
See [ADR Index](adr/README.md)
