.PHONY: help bootstrap deploy-dev deploy-staging deploy-prod terraform-plan terraform-apply \
       build-all push-all test-all lint-all migrate seed k8s-apply rollback-model \
       incident-triage logs clean

SHELL := /bin/bash
PROJECT_ID ?= $(shell gcloud config get-value project 2>/dev/null)
REGION ?= us-central1
ZONE ?= us-central1-a
ENV ?= dev
REGISTRY = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/mw-$(ENV)-services
TAG ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")

SERVICES = ai-scope-assistant ai-match-v1 ai-fraud-v1 verification-automation socket-server

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ─── Bootstrap ───
bootstrap: ## Bootstrap dev environment from scratch
	@bash scripts/bootstrap-dev.sh

# ─── Terraform ───
terraform-init: ## Initialize Terraform
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	cd terraform && terraform plan -var-file=environments/$(ENV)/terraform.tfvars -out=tfplan

terraform-apply: ## Apply Terraform changes
	cd terraform && terraform apply tfplan

terraform-destroy: ## Destroy Terraform resources (DANGER)
	cd terraform && terraform destroy -var-file=environments/$(ENV)/terraform.tfvars

# ─── Docker Build ───
build-all: ## Build all service images
	@for svc in $(SERVICES); do \
		echo "Building $$svc..."; \
		docker build -t $(REGISTRY)/$$svc:$(TAG) services/$$svc/; \
	done

build: ## Build a single service: make build SVC=ai-fraud-v1
	docker build -t $(REGISTRY)/$(SVC):$(TAG) services/$(SVC)/

push-all: ## Push all images to Artifact Registry
	@for svc in $(SERVICES); do \
		echo "Pushing $$svc..."; \
		docker push $(REGISTRY)/$$svc:$(TAG); \
	done

push: ## Push a single service: make push SVC=ai-fraud-v1
	docker push $(REGISTRY)/$(SVC):$(TAG)

# ─── Testing ───
test-all: ## Run tests for all services
	@for svc in $(SERVICES); do \
		echo "Testing $$svc..."; \
		cd services/$$svc && \
		if [ -f package.json ]; then npm test; \
		elif [ -f requirements.txt ]; then pytest tests/; \
		fi; \
		cd ../..; \
	done

lint-all: ## Lint all services
	@for svc in $(SERVICES); do \
		echo "Linting $$svc..."; \
		cd services/$$svc && \
		if [ -f package.json ]; then npm run lint; \
		elif [ -f requirements.txt ]; then ruff check src/; \
		fi; \
		cd ../..; \
	done

test: ## Test single service: make test SVC=ai-fraud-v1
	cd services/$(SVC) && if [ -f package.json ]; then npm test; elif [ -f requirements.txt ]; then pytest tests/; fi

# ─── Database ───
migrate: ## Run database migrations
	@bash scripts/run-migrations.sh $(ENV)

seed: ## Seed database with test data
	@bash scripts/seed-data.sh $(ENV)

# ─── Kubernetes ───
k8s-context: ## Set kubectl context
	gcloud container clusters get-credentials mw-$(ENV)-cluster --zone $(ZONE)

k8s-apply: ## Apply all K8s manifests for environment
	kubectl apply -k infra/k8s/overlays/$(ENV)/

k8s-status: ## Show status of all pods
	kubectl get pods -n monkeyswork
	kubectl get pods -n monkeyswork-ai

# ─── Deploy ───
deploy-dev: ENV=dev ## Deploy all to dev
deploy-dev: build-all push-all k8s-apply

deploy-staging: ## Deploy single service to staging
	@bash scripts/deploy-staging.sh $(SVC) $(TAG)

deploy-prod: ## Deploy single service to prod (requires approval)
	@bash scripts/deploy-prod.sh $(SVC) $(TAG)

# ─── ML ───
run-pipeline: ## Run Vertex AI pipeline: make run-pipeline PIPELINE=scope_assistant
	@bash scripts/run-pipeline.sh $(PIPELINE) $(ENV)

rollback-model: ## Rollback model: make rollback-model MODEL=mw-scope-assistant VER=v1.0.0
	@bash scripts/rollback-model.sh $(MODEL) $(VER)

backfill: ## Backfill features: make backfill FEATURES=match-embeddings
	@bash scripts/backfill-features.sh $(FEATURES)

# ─── Operations ───
incident: ## Run incident triage: make incident TYPE=latency-spike
	@bash scripts/incident-triage.sh $(TYPE)

logs: ## Tail logs for service: make logs SVC=ai-fraud-v1
	@NS=monkeyswork; [[ "$(SVC)" == ai-* ]] && NS=monkeyswork-ai; \
	kubectl logs -f -n $$NS -l app=$(SVC) --tail=100

validate-schemas: ## Validate all event schemas
	@python3 data/scripts/validate_schemas.py

clean: ## Clean local Docker images
	@for svc in $(SERVICES); do \
		docker rmi $(REGISTRY)/$$svc:$(TAG) 2>/dev/null || true; \
	done
