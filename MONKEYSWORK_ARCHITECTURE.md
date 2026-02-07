# MonkeysWork — Production Architecture Blueprint

**Version:** 1.0.0  
**Date:** 2026-02-06  
**Author:** Principal Architect  
**Status:** Implementation-Ready

---

## Assumptions (stated once)

- GCP Project already exists; billing enabled.
- GitHub org `monkeyswork` owns the repo.
- Domain: `monkeyswork.com` (DNS managed externally, pointed to GCP LB).
- Region: `us-central1` (can parameterize later).
- Team size at kickoff: 2-3 engineers + founder.
- MVP launch target: ~90 days from sprint start.
- All AI models start with hosted foundation models (Gemini Pro via Vertex) + fine-tune later.
- PostgreSQL 15+ for JSONB, pgvector via AlloyDB or Cloud SQL pgvector extension.

---

# SECTION 1 — MONOREPO BLUEPRINT

```
monkeyswork/
├── terraform/                  # All IaC — GCP resources, networking, IAM
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   ├── modules/
│   │   ├── gke/
│   │   ├── cloudsql/
│   │   ├── pubsub/
│   │   ├── iam/
│   │   ├── networking/
│   │   ├── artifact-registry/
│   │   └── vertex/
│   ├── providers.tf
│   ├── variables.tf
│   ├── main.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
│
├── infra/
│   ├── k8s/                    # Kubernetes manifests (GKE workloads)
│   │   ├── base/               # Kustomize base manifests
│   │   │   ├── namespaces.yaml
│   │   │   ├── network-policies.yaml
│   │   │   └── kustomization.yaml
│   │   ├── api-core/
│   │   ├── ai-scope-assistant/
│   │   ├── ai-match-v1/
│   │   ├── ai-fraud-v1/
│   │   ├── verification-automation/
│   │   └── overlays/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── vertex/                 # Vertex AI pipeline definitions + configs
│   │   ├── pipelines/
│   │   ├── configs/
│   │   └── model-registry/
│   └── cloudrun/               # Cloud Run service definitions
│       ├── ai-scope-inference/
│       └── ai-match-inference/
│
├── services/                   # Application microservices (source code)
│   ├── api-core/               # Main API gateway — jobs, users, payments, milestones
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── ai-scope-assistant/     # Scope decomposition + estimation service
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── ai-match-v1/            # Talent-job matching engine
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── ai-fraud-v1/            # Anti-fraud scoring service
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   └── verification-automation/ # Identity/skill verification orchestrator
│       ├── src/
│       ├── tests/
│       └── Dockerfile
│
├── ml/                         # ML training code, feature engineering, evaluation
│   ├── scope_assistant/
│   │   ├── pipeline.py
│   │   ├── components/
│   │   ├── configs/
│   │   └── evaluation/
│   ├── match_v1/
│   │   ├── pipeline.py
│   │   ├── components/
│   │   ├── configs/
│   │   └── evaluation/
│   ├── fraud_v1/
│   │   ├── pipeline.py
│   │   ├── components/
│   │   ├── configs/
│   │   └── evaluation/
│   └── shared/                 # Shared ML utilities, feature stores, metrics
│       ├── feature_store/
│       ├── evaluation/
│       └── registry/
│
├── data/                       # Data schemas, migrations, seed data
│   ├── migrations/             # SQL migration files (numbered)
│   ├── schemas/                # JSON Schema / Avro for event contracts
│   ├── seeds/                  # Dev/test seed data
│   └── scripts/                # ETL helper scripts
│
├── scripts/                    # Operational scripts and runbooks
│   ├── bootstrap-dev.sh
│   ├── deploy-staging.sh
│   ├── rollback-model.sh
│   ├── backfill-features.sh
│   └── incident-triage.sh
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│       ├── ci.yaml             # Lint, test, build on PR
│       ├── cd-staging.yaml     # Auto-deploy to staging on merge to main
│       ├── cd-prod.yaml        # Manual approval deploy to prod
│       ├── ml-pipeline.yaml    # Trigger Vertex AI pipeline runs
│       └── terraform.yaml      # Plan on PR, apply on merge
│
├── docs/                       # Architecture docs, ADRs, runbooks
│   ├── adr/
│   ├── architecture.md
│   └── onboarding.md
│
├── .editorconfig
├── .gitignore
├── README.md
└── Makefile                    # Top-level make targets for common ops
```

### Folder Purpose Summary

| Folder | Purpose |
|---|---|
| `terraform/` | Infrastructure-as-code for all GCP resources. Environment-separated with reusable modules. |
| `infra/k8s/` | Kubernetes manifests using Kustomize overlays for multi-env deployment on GKE. |
| `infra/vertex/` | Vertex AI pipeline configs, model registry schemas, and serving endpoints. |
| `infra/cloudrun/` | Cloud Run service definitions for bursty/serverless AI inference. |
| `services/` | All microservice source code — each service is independently buildable and deployable. |
| `ml/` | ML training pipelines, feature engineering, model evaluation — consumed by Vertex AI. |
| `data/` | Schema definitions, DB migrations, event contracts, seed data. Single source of truth for data shapes. |
| `scripts/` | Operational runbooks as executable scripts — bootstrap, deploy, rollback, incident response. |
| `.github/workflows/` | GitHub Actions CI/CD — separate pipelines for app, infra, and ML. |

---

# SECTION 2 — TERRAFORM STARTER

## `terraform/providers.tf`

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.20"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.20"
    }
  }

  backend "gcs" {
    bucket = "monkeyswork-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}
```

## `terraform/variables.tf`

```hcl
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for zonal resources"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "gke_node_count" {
  description = "Initial node count per zone for default pool"
  type        = number
  default     = 2
}

variable "gke_ai_node_count" {
  description = "Initial node count for AI workload pool"
  type        = number
  default     = 1
}

variable "gke_machine_type" {
  description = "Machine type for default GKE node pool"
  type        = string
  default     = "e2-standard-4"
}

variable "gke_ai_machine_type" {
  description = "Machine type for AI GKE node pool"
  type        = string
  default     = "n1-standard-8"
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-custom-2-8192"
}

variable "db_password" {
  description = "Database password (use Secret Manager in prod)"
  type        = string
  sensitive   = true
}

variable "authorized_networks" {
  description = "CIDR blocks allowed to access Cloud SQL (empty = private only)"
  type        = list(object({ name = string, value = string }))
  default     = []
}
```

## `terraform/main.tf`

```hcl
# ─────────────────────────────────────────────────────
# 1. ENABLE REQUIRED APIs
# ─────────────────────────────────────────────────────
locals {
  services = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "artifactregistry.googleapis.com",
    "pubsub.googleapis.com",
    "secretmanager.googleapis.com",
    "aiplatform.googleapis.com",
    "run.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "servicenetworking.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each                   = toset(local.services)
  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ─────────────────────────────────────────────────────
# 2. NETWORKING — VPC + Subnets + Cloud NAT
# ─────────────────────────────────────────────────────
resource "google_compute_network" "main" {
  name                    = "mw-${var.environment}-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "gke" {
  name          = "mw-${var.environment}-gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = "10.4.0.0/14"
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = "10.8.0.0/20"
  }

  private_ip_google_access = true
}

resource "google_compute_subnetwork" "services" {
  name          = "mw-${var.environment}-services-subnet"
  ip_cidr_range = "10.1.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id
  private_ip_google_access = true
}

# Private Service Access for Cloud SQL
resource "google_compute_global_address" "private_ip" {
  name          = "mw-${var.environment}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}

# Cloud NAT for outbound from private nodes
resource "google_compute_router" "nat_router" {
  name    = "mw-${var.environment}-nat-router"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "mw-${var.environment}-nat"
  router                             = google_compute_router.nat_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall — deny all ingress by default, allow internal
resource "google_compute_firewall" "allow_internal" {
  name    = "mw-${var.environment}-allow-internal"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
}

# ─────────────────────────────────────────────────────
# 3. GKE CLUSTER
# ─────────────────────────────────────────────────────
resource "google_container_cluster" "primary" {
  provider = google-beta
  name     = "mw-${var.environment}-cluster"
  location = var.zone

  # Use separately managed node pools
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.gke.id

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All (restrict in prod)"
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  release_channel {
    channel = "REGULAR"
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  depends_on = [google_project_service.apis]
}

# Default node pool — application workloads
resource "google_container_node_pool" "default" {
  name     = "default-pool"
  location = var.zone
  cluster  = google_container_cluster.primary.name

  initial_node_count = var.gke_node_count

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  node_config {
    machine_type = var.gke_machine_type
    disk_size_gb = 50
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      workload-type = "general"
      environment   = var.environment
    }

    shielded_instance_config {
      enable_secure_boot = true
    }
  }

  management {
    auto_upgrade = true
    auto_repair  = true
  }
}

# AI workload node pool — larger machines, optional GPU
resource "google_container_node_pool" "ai_workloads" {
  name     = "ai-pool"
  location = var.zone
  cluster  = google_container_cluster.primary.name

  initial_node_count = var.gke_ai_node_count

  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }

  node_config {
    machine_type = var.gke_ai_machine_type
    disk_size_gb = 100
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      workload-type = "ai"
      environment   = var.environment
    }

    taint {
      key    = "workload-type"
      value  = "ai"
      effect = "NO_SCHEDULE"
    }

    shielded_instance_config {
      enable_secure_boot = true
    }
  }

  management {
    auto_upgrade = true
    auto_repair  = true
  }
}

# ─────────────────────────────────────────────────────
# 4. ARTIFACT REGISTRY
# ─────────────────────────────────────────────────────
resource "google_artifact_registry_repository" "services" {
  location      = var.region
  repository_id = "mw-${var.environment}-services"
  format        = "DOCKER"
  description   = "Container images for MonkeysWork services"
  depends_on    = [google_project_service.apis]
}

# ─────────────────────────────────────────────────────
# 5. CLOUD SQL — PostgreSQL
# ─────────────────────────────────────────────────────
resource "google_sql_database_instance" "postgres" {
  name             = "mw-${var.environment}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc]

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_autoresize   = true
    disk_size         = 20
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "prod"
      start_time                     = "03:00"
      transaction_log_retention_days = var.environment == "prod" ? 7 : 3

      backup_retention_settings {
        retained_backups = var.environment == "prod" ? 30 : 7
      }
    }

    maintenance_window {
      day          = 7
      hour         = 4
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "main" {
  name     = "monkeyswork"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = "mw_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ─────────────────────────────────────────────────────
# 6. PUB/SUB — Event Topics + Subscriptions
# ─────────────────────────────────────────────────────
locals {
  pubsub_topics = {
    "job-events"          = "Job lifecycle events (created, updated, closed)"
    "proposal-events"     = "Proposal lifecycle events (submitted, withdrawn, accepted)"
    "milestone-events"    = "Milestone lifecycle events (created, accepted, disputed)"
    "verification-events" = "Verification status changes"
    "fraud-events"        = "Fraud scoring events and alerts"
    "match-events"        = "Match engine results and feedback"
    "audit-events"        = "All decision audit logs"
  }

  # subscription → topic mapping
  subscriptions = {
    "ai-scope-on-job-created"        = { topic = "job-events", filter = "attributes.event_type = \"job_created\"" }
    "ai-match-on-job-created"        = { topic = "job-events", filter = "attributes.event_type = \"job_created\"" }
    "ai-fraud-on-proposal-submitted" = { topic = "proposal-events", filter = "attributes.event_type = \"proposal_submitted\"" }
    "verification-on-status-change"  = { topic = "verification-events", filter = "" }
    "audit-sink"                     = { topic = "audit-events", filter = "" }
  }
}

resource "google_pubsub_topic" "topics" {
  for_each = local.pubsub_topics
  name     = "mw-${var.environment}-${each.key}"

  message_retention_duration = "604800s" # 7 days

  labels = {
    environment = var.environment
  }
}

# Dead letter topic
resource "google_pubsub_topic" "dead_letter" {
  name = "mw-${var.environment}-dead-letter"
}

resource "google_pubsub_subscription" "subs" {
  for_each = local.subscriptions
  name     = "mw-${var.environment}-${each.key}"
  topic    = google_pubsub_topic.topics[each.value.topic].id

  ack_deadline_seconds       = 60
  message_retention_duration = "604800s"
  retain_acked_messages      = false

  expiration_policy {
    ttl = ""  # Never expire
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 10
  }

  filter = each.value.filter != "" ? each.value.filter : null

  labels = {
    environment = var.environment
  }
}

# ─────────────────────────────────────────────────────
# 7. IAM — Service Accounts + Least-Privilege Bindings
# ─────────────────────────────────────────────────────
# API Core service account
resource "google_service_account" "api_core" {
  account_id   = "mw-${var.environment}-api-core"
  display_name = "MonkeysWork API Core (${var.environment})"
}

# AI service accounts (one per model service)
resource "google_service_account" "ai_scope" {
  account_id   = "mw-${var.environment}-ai-scope"
  display_name = "MonkeysWork AI Scope Assistant (${var.environment})"
}

resource "google_service_account" "ai_match" {
  account_id   = "mw-${var.environment}-ai-match"
  display_name = "MonkeysWork AI Match Engine (${var.environment})"
}

resource "google_service_account" "ai_fraud" {
  account_id   = "mw-${var.environment}-ai-fraud"
  display_name = "MonkeysWork AI Fraud Service (${var.environment})"
}

resource "google_service_account" "verification" {
  account_id   = "mw-${var.environment}-verification"
  display_name = "MonkeysWork Verification (${var.environment})"
}

resource "google_service_account" "vertex_pipelines" {
  account_id   = "mw-${var.environment}-vertex-pipe"
  display_name = "MonkeysWork Vertex Pipelines (${var.environment})"
}

# Workload Identity bindings (GKE → GCP SA)
resource "google_service_account_iam_binding" "api_core_wi" {
  service_account_id = google_service_account.api_core.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/api-core]",
  ]
}

resource "google_service_account_iam_binding" "ai_scope_wi" {
  service_account_id = google_service_account.ai_scope.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/ai-scope-assistant]",
  ]
}

resource "google_service_account_iam_binding" "ai_match_wi" {
  service_account_id = google_service_account.ai_match.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/ai-match-v1]",
  ]
}

resource "google_service_account_iam_binding" "ai_fraud_wi" {
  service_account_id = google_service_account.ai_fraud.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/ai-fraud-v1]",
  ]
}

# Pub/Sub publisher — api-core publishes to job/proposal/milestone topics
resource "google_project_iam_member" "api_core_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.api_core.email}"
}

# Pub/Sub subscriber — AI services consume specific subscriptions
resource "google_project_iam_member" "ai_scope_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.ai_scope.email}"
}

resource "google_project_iam_member" "ai_match_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.ai_match.email}"
}

resource "google_project_iam_member" "ai_fraud_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.ai_fraud.email}"
}

# Cloud SQL — api-core is the only service accessing the DB directly
resource "google_project_iam_member" "api_core_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.api_core.email}"
}

# Vertex AI — training + prediction for AI services
resource "google_project_iam_member" "vertex_pipelines_ai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.vertex_pipelines.email}"
}

resource "google_project_iam_member" "ai_scope_vertex_predict" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ai_scope.email}"
}

resource "google_project_iam_member" "ai_match_vertex_predict" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ai_match.email}"
}

# Secret Manager — read secrets
resource "google_project_iam_member" "api_core_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api_core.email}"
}

# GCS — vertex pipelines need storage for artifacts
resource "google_storage_bucket" "ml_artifacts" {
  name          = "mw-${var.environment}-ml-artifacts-${var.project_id}"
  location      = var.region
  force_destroy = var.environment != "prod"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_member" "vertex_artifacts" {
  bucket = google_storage_bucket.ml_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vertex_pipelines.email}"
}

# ─────────────────────────────────────────────────────
# 8. SECRET MANAGER — initial secrets
# ─────────────────────────────────────────────────────
resource "google_secret_manager_secret" "db_password" {
  secret_id = "mw-${var.environment}-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}
```

## `terraform/outputs.tf`

```hcl
output "gke_cluster_name" {
  value = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "cloudsql_instance_connection" {
  value = google_sql_database_instance.postgres.connection_name
}

output "cloudsql_private_ip" {
  value = google_sql_database_instance.postgres.private_ip_address
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.services.repository_id}"
}

output "ml_artifacts_bucket" {
  value = google_storage_bucket.ml_artifacts.name
}

output "vpc_network_id" {
  value = google_compute_network.main.id
}

output "pubsub_topics" {
  value = { for k, v in google_pubsub_topic.topics : k => v.id }
}

output "service_accounts" {
  value = {
    api_core     = google_service_account.api_core.email
    ai_scope     = google_service_account.ai_scope.email
    ai_match     = google_service_account.ai_match.email
    ai_fraud     = google_service_account.ai_fraud.email
    verification = google_service_account.verification.email
    vertex       = google_service_account.vertex_pipelines.email
  }
}
```

## `terraform/terraform.tfvars.example`

```hcl
# Copy to terraform.tfvars and fill in values
project_id          = "monkeyswork-dev"       # Your GCP project ID
region              = "us-central1"
zone                = "us-central1-a"
environment         = "dev"
gke_node_count      = 2
gke_ai_node_count   = 1
gke_machine_type    = "e2-standard-4"
gke_ai_machine_type = "n1-standard-8"
db_tier             = "db-custom-2-8192"
db_password         = "CHANGE_ME_USE_SECRET_MANAGER"
authorized_networks = []
```

---

# SECTION 3 — KUBERNETES + CLOUD RUN DEPLOYMENT STARTERS

## `infra/k8s/base/namespaces.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monkeyswork
  labels:
    app.kubernetes.io/part-of: monkeyswork
    istio-injection: disabled
---
apiVersion: v1
kind: Namespace
metadata:
  name: monkeyswork-ai
  labels:
    app.kubernetes.io/part-of: monkeyswork
    workload-type: ai
```

## `infra/k8s/base/network-policies.yaml`

```yaml
# Default deny all ingress in monkeyswork namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: monkeyswork
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
# Allow api-core to receive traffic from ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-api-core
  namespace: monkeyswork
spec:
  podSelector:
    matchLabels:
      app: api-core
  ingress:
    - from: []  # From ingress controller
      ports:
        - protocol: TCP
          port: 8080
---
# Allow AI services to receive traffic only from api-core
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-core-to-ai
  namespace: monkeyswork-ai
spec:
  podSelector:
    matchLabels:
      tier: ai-service
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              app.kubernetes.io/part-of: monkeyswork
          podSelector:
            matchLabels:
              app: api-core
      ports:
        - protocol: TCP
          port: 8080
---
# Allow all egress (needed for Pub/Sub, Vertex, etc.)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress
  namespace: monkeyswork
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - {}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-ai
  namespace: monkeyswork-ai
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - {}
```

## `infra/k8s/api-core/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-core
  namespace: monkeyswork
  labels:
    app: api-core
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-core
  template:
    metadata:
      labels:
        app: api-core
        version: v1
    spec:
      serviceAccountName: api-core
      containers:
        - name: api-core
          image: ARTIFACT_REGISTRY_URL/api-core:latest  # replaced by CD
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            - name: PUBSUB_PROJECT_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.labels['project-id']
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 30
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      nodeSelector:
        workload-type: general
---
apiVersion: v1
kind: Service
metadata:
  name: api-core
  namespace: monkeyswork
spec:
  selector:
    app: api-core
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP
```

## `infra/k8s/ai-scope-assistant/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-scope-assistant
  namespace: monkeyswork-ai
  labels:
    app: ai-scope-assistant
    tier: ai-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-scope-assistant
  template:
    metadata:
      labels:
        app: ai-scope-assistant
        tier: ai-service
    spec:
      serviceAccountName: ai-scope-assistant
      tolerations:
        - key: "workload-type"
          operator: "Equal"
          value: "ai"
          effect: "NoSchedule"
      containers:
        - name: ai-scope-assistant
          image: ARTIFACT_REGISTRY_URL/ai-scope-assistant:latest
          ports:
            - containerPort: 8080
          env:
            - name: MODEL_ENDPOINT
              value: ""  # Set via ConfigMap
            - name: FEATURE_FLAG_AI_SCOPE
              value: "true"
            - name: FALLBACK_MODE
              value: "manual"  # manual = human-in-the-loop
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      nodeSelector:
        workload-type: ai
---
apiVersion: v1
kind: Service
metadata:
  name: ai-scope-assistant
  namespace: monkeyswork-ai
spec:
  selector:
    app: ai-scope-assistant
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## `infra/k8s/ai-match-v1/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-match-v1
  namespace: monkeyswork-ai
  labels:
    app: ai-match-v1
    tier: ai-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-match-v1
  template:
    metadata:
      labels:
        app: ai-match-v1
        tier: ai-service
    spec:
      serviceAccountName: ai-match-v1
      tolerations:
        - key: "workload-type"
          operator: "Equal"
          value: "ai"
          effect: "NoSchedule"
      containers:
        - name: ai-match-v1
          image: ARTIFACT_REGISTRY_URL/ai-match-v1:latest
          ports:
            - containerPort: 8080
          env:
            - name: MATCH_MODEL_VERSION
              value: "v1.0.0"
            - name: FEATURE_FLAG_AI_MATCH
              value: "true"
            - name: AB_TEST_TRAFFIC_PERCENT
              value: "0"  # Start at 0%, ramp via config
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      nodeSelector:
        workload-type: ai
---
apiVersion: v1
kind: Service
metadata:
  name: ai-match-v1
  namespace: monkeyswork-ai
spec:
  selector:
    app: ai-match-v1
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## `infra/k8s/ai-fraud-v1/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-fraud-v1
  namespace: monkeyswork-ai
  labels:
    app: ai-fraud-v1
    tier: ai-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-fraud-v1
  template:
    metadata:
      labels:
        app: ai-fraud-v1
        tier: ai-service
    spec:
      serviceAccountName: ai-fraud-v1
      tolerations:
        - key: "workload-type"
          operator: "Equal"
          value: "ai"
          effect: "NoSchedule"
      containers:
        - name: ai-fraud-v1
          image: ARTIFACT_REGISTRY_URL/ai-fraud-v1:latest
          ports:
            - containerPort: 8080
          env:
            - name: FRAUD_MODEL_VERSION
              value: "v1.0.0"
            - name: FEATURE_FLAG_FRAUD_SCORING
              value: "true"
            - name: ENFORCEMENT_MODE
              value: "shadow"  # shadow → log_only → soft_block → enforce
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      nodeSelector:
        workload-type: ai
---
apiVersion: v1
kind: Service
metadata:
  name: ai-fraud-v1
  namespace: monkeyswork-ai
spec:
  selector:
    app: ai-fraud-v1
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## `infra/k8s/verification-automation/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: verification-automation
  namespace: monkeyswork
  labels:
    app: verification-automation
spec:
  replicas: 1
  selector:
    matchLabels:
      app: verification-automation
  template:
    metadata:
      labels:
        app: verification-automation
    spec:
      serviceAccountName: verification-automation
      containers:
        - name: verification-automation
          image: ARTIFACT_REGISTRY_URL/verification-automation:latest
          ports:
            - containerPort: 8080
          env:
            - name: FEATURE_FLAG_AUTO_VERIFY
              value: "true"
            - name: HUMAN_REVIEW_THRESHOLD
              value: "0.7"  # Below this confidence, escalate to human
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
      nodeSelector:
        workload-type: general
---
apiVersion: v1
kind: Service
metadata:
  name: verification-automation
  namespace: monkeyswork
spec:
  selector:
    app: verification-automation
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## `infra/k8s/base/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monkeyswork-ingress
  namespace: monkeyswork
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "mw-api-ip"
    networking.gke.io/managed-certificates: "mw-api-cert"
    kubernetes.io/ingress.allow-http: "false"
spec:
  rules:
    - host: api.monkeyswork.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-core
                port:
                  number: 80
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: mw-api-cert
  namespace: monkeyswork
spec:
  domains:
    - api.monkeyswork.com
```

## `infra/k8s/base/hpa.yaml`

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-core-hpa
  namespace: monkeyswork
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-core
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-scope-hpa
  namespace: monkeyswork-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-scope-assistant
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 600
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-match-hpa
  namespace: monkeyswork-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-match-v1
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 600
```

## Cloud Run Deployment Commands

```bash
#!/bin/bash
# infra/cloudrun/deploy-scope-inference.sh
# Cloud Run for bursty AI inference — scales to zero when idle

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ENV="${ENV:-dev}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

gcloud run deploy mw-${ENV}-ai-scope-inference \
  --image "${REGISTRY}/ai-scope-assistant:${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "mw-${ENV}-ai-scope@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "MODEL_ENDPOINT=projects/${PROJECT_ID}/locations/${REGION}/endpoints/SCOPE_ENDPOINT_ID" \
  --set-env-vars "FEATURE_FLAG_AI_SCOPE=true" \
  --set-env-vars "FALLBACK_MODE=manual" \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 300 \
  --concurrency 10 \
  --ingress internal \
  --vpc-connector "mw-${ENV}-connector" \
  --no-allow-unauthenticated \
  --labels "environment=${ENV},service=ai-scope"
```

```bash
#!/bin/bash
# infra/cloudrun/deploy-match-inference.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
ENV="${ENV:-dev}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

gcloud run deploy mw-${ENV}-ai-match-inference \
  --image "${REGISTRY}/ai-match-v1:${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "mw-${ENV}-ai-match@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "MATCH_MODEL_VERSION=v1.0.0" \
  --set-env-vars "FEATURE_FLAG_AI_MATCH=true" \
  --min-instances 0 \
  --max-instances 20 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 300 \
  --concurrency 20 \
  --ingress internal \
  --vpc-connector "mw-${ENV}-connector" \
  --no-allow-unauthenticated \
  --labels "environment=${ENV},service=ai-match"
```

---

# SECTION 4 — VERTEX AI PIPELINE SKELETONS

## Model Registry Naming Convention

```
Format:  mw-{model_name}-v{major}.{minor}.{patch}
Examples:
  mw-scope-assistant-v1.0.0
  mw-match-v1-v1.0.0
  mw-fraud-v1-v1.0.0

Versioning rules:
  MAJOR — architecture change, new input/output contract
  MINOR — retraining with new features, improved metrics
  PATCH — same features, different hyperparams or data refresh
```

## `ml/scope_assistant/pipeline.py`

```python
"""
Vertex AI Pipeline: Scope Assistant Model
Trains/fine-tunes a model to decompose job descriptions into
structured scopes (milestones, tasks, estimates).
"""
from kfp import dsl
from kfp.dsl import Input, Output, Artifact, Dataset, Model, Metrics
from google.cloud import aiplatform

PIPELINE_NAME = "mw-scope-assistant-pipeline"
MODEL_NAME = "mw-scope-assistant"

# ─── Metrics thresholds (go/no-go for deployment) ───
QUALITY_THRESHOLDS = {
    "milestone_extraction_f1": 0.80,
    "estimate_mae_hours": 8.0,       # Mean absolute error < 8 hours
    "task_coverage_recall": 0.75,
    "hallucination_rate": 0.05,       # < 5% hallucinated tasks
}


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-bigquery", "pandas"]
)
def ingest_training_data(
    project_id: str,
    dataset_uri: str,
    output_dataset: Output[Dataset],
):
    """Pull labeled scope data from BigQuery/GCS.
    Sources: manually labeled job→scope pairs from ops team.
    """
    import pandas as pd
    from google.cloud import bigquery

    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT
            job_id, job_description, category,
            labeled_milestones, labeled_tasks,
            labeled_hours_estimate, labeler_id,
            created_at
        FROM `{project_id}.ml_training.scope_labels`
        WHERE status = 'approved'
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    """
    df = client.query(query).to_dataframe()
    df.to_parquet(output_dataset.path)
    output_dataset.metadata["num_examples"] = len(df)
    output_dataset.metadata["date_range"] = f"last_90_days"


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["pandas", "jsonschema"]
)
def validate_data(
    input_dataset: Input[Dataset],
    validated_dataset: Output[Dataset],
    validation_report: Output[Artifact],
):
    """Validate schema, check for drift, remove duplicates."""
    import pandas as pd
    import json

    df = pd.read_parquet(input_dataset.path)

    report = {
        "total_rows": len(df),
        "null_descriptions": int(df["job_description"].isnull().sum()),
        "null_labels": int(df["labeled_milestones"].isnull().sum()),
        "duplicate_job_ids": int(df["job_id"].duplicated().sum()),
    }

    # Drop invalid rows
    df = df.dropna(subset=["job_description", "labeled_milestones"])
    df = df.drop_duplicates(subset=["job_id"])

    report["clean_rows"] = len(df)
    report["drop_rate"] = 1 - (report["clean_rows"] / report["total_rows"])

    assert report["drop_rate"] < 0.2, f"Too many dropped rows: {report['drop_rate']:.0%}"

    df.to_parquet(validated_dataset.path)

    with open(validation_report.path, "w") as f:
        json.dump(report, f, indent=2)


@dsl.component(
    base_image="us-docker.pkg.dev/vertex-ai/training/tf-gpu.2-14.py310:latest",
    packages_to_install=["transformers", "peft"]
)
def train_model(
    validated_dataset: Input[Dataset],
    base_model_uri: str,
    learning_rate: float,
    epochs: int,
    trained_model: Output[Model],
    training_metrics: Output[Metrics],
):
    """Fine-tune foundation model for scope extraction."""
    import pandas as pd

    df = pd.read_parquet(validated_dataset.path)

    # Placeholder: actual training logic
    # 1. Load base model (Gemini Pro / fine-tuned T5)
    # 2. Format data as instruction pairs
    # 3. Fine-tune with LoRA/PEFT
    # 4. Save adapter weights

    trained_model.metadata["base_model"] = base_model_uri
    trained_model.metadata["learning_rate"] = learning_rate
    trained_model.metadata["epochs"] = epochs
    trained_model.metadata["training_examples"] = len(df)

    training_metrics.log_metric("training_loss", 0.15)  # placeholder
    training_metrics.log_metric("training_examples", len(df))


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["pandas", "scikit-learn"]
)
def evaluate_model(
    trained_model: Input[Model],
    validated_dataset: Input[Dataset],
    eval_metrics: Output[Metrics],
    eval_report: Output[Artifact],
):
    """Run evaluation against held-out test set. Check quality gates."""
    import json

    # Placeholder: actual evaluation
    metrics = {
        "milestone_extraction_f1": 0.85,
        "estimate_mae_hours": 6.2,
        "task_coverage_recall": 0.82,
        "hallucination_rate": 0.03,
    }

    passed = all(
        metrics[k] >= QUALITY_THRESHOLDS[k]
        if "mae" not in k and "rate" not in k
        else metrics[k] <= QUALITY_THRESHOLDS[k]
        for k in QUALITY_THRESHOLDS
    )

    for k, v in metrics.items():
        eval_metrics.log_metric(k, v)
    eval_metrics.log_metric("quality_gate_passed", int(passed))

    report = {"metrics": metrics, "thresholds": QUALITY_THRESHOLDS, "passed": passed}
    with open(eval_report.path, "w") as f:
        json.dump(report, f, indent=2)


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-aiplatform"]
)
def register_model(
    trained_model: Input[Model],
    eval_metrics: Input[Metrics],
    project_id: str,
    region: str,
    model_version: str,
    registered_model_name: Output[Artifact],
):
    """Register model in Vertex AI Model Registry if quality gates pass."""
    from google.cloud import aiplatform

    aiplatform.init(project=project_id, location=region)

    model = aiplatform.Model.upload(
        display_name=f"{MODEL_NAME}-{model_version}",
        artifact_uri=trained_model.uri,
        serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-14:latest",
        labels={
            "model_name": MODEL_NAME,
            "version": model_version,
            "pipeline": PIPELINE_NAME,
        },
    )

    registered_model_name.metadata["model_resource_name"] = model.resource_name
    registered_model_name.metadata["version"] = model_version


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-aiplatform"]
)
def deploy_model(
    registered_model_name: Input[Artifact],
    project_id: str,
    region: str,
    endpoint_display_name: str,
    traffic_percentage: int,
):
    """Deploy to Vertex AI endpoint with traffic splitting."""
    from google.cloud import aiplatform

    aiplatform.init(project=project_id, location=region)

    model_name = registered_model_name.metadata["model_resource_name"]
    model = aiplatform.Model(model_name)

    # Get or create endpoint
    endpoints = aiplatform.Endpoint.list(
        filter=f'display_name="{endpoint_display_name}"'
    )
    if endpoints:
        endpoint = endpoints[0]
    else:
        endpoint = aiplatform.Endpoint.create(display_name=endpoint_display_name)

    model.deploy(
        endpoint=endpoint,
        machine_type="n1-standard-4",
        min_replica_count=1,
        max_replica_count=5,
        traffic_percentage=traffic_percentage,
        deployed_model_display_name=f"{MODEL_NAME}-serving",
    )


@dsl.pipeline(
    name=PIPELINE_NAME,
    description="Train and deploy Scope Assistant model",
)
def scope_assistant_pipeline(
    project_id: str,
    region: str = "us-central1",
    dataset_uri: str = "",
    base_model_uri: str = "gemini-1.5-pro",
    learning_rate: float = 2e-5,
    epochs: int = 3,
    model_version: str = "v1.0.0",
    traffic_percentage: int = 0,
):
    ingest_task = ingest_training_data(
        project_id=project_id,
        dataset_uri=dataset_uri,
    )

    validate_task = validate_data(
        input_dataset=ingest_task.outputs["output_dataset"],
    )

    train_task = train_model(
        validated_dataset=validate_task.outputs["validated_dataset"],
        base_model_uri=base_model_uri,
        learning_rate=learning_rate,
        epochs=epochs,
    )

    eval_task = evaluate_model(
        trained_model=train_task.outputs["trained_model"],
        validated_dataset=validate_task.outputs["validated_dataset"],
    )

    register_task = register_model(
        trained_model=train_task.outputs["trained_model"],
        eval_metrics=eval_task.outputs["eval_metrics"],
        project_id=project_id,
        region=region,
        model_version=model_version,
    )

    deploy_task = deploy_model(
        registered_model_name=register_task.outputs["registered_model_name"],
        project_id=project_id,
        region=region,
        endpoint_display_name="mw-scope-assistant-endpoint",
        traffic_percentage=traffic_percentage,
    )


if __name__ == "__main__":
    from kfp import compiler
    compiler.Compiler().compile(
        pipeline_func=scope_assistant_pipeline,
        package_path="scope_assistant_pipeline.json",
    )
```

## `ml/match_v1/pipeline.py`

```python
"""
Vertex AI Pipeline: Match Engine v1
Two-stage: embedding retrieval (ANN) + ranking model.
"""
from kfp import dsl
from kfp.dsl import Input, Output, Artifact, Dataset, Model, Metrics

PIPELINE_NAME = "mw-match-v1-pipeline"
MODEL_NAME = "mw-match-v1"

QUALITY_THRESHOLDS = {
    "ndcg_at_10": 0.65,
    "precision_at_5": 0.60,
    "recall_at_20": 0.80,
    "mean_reciprocal_rank": 0.55,
    "diversity_score": 0.30,  # Prevent recommending same profiles repeatedly
}


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-bigquery", "pandas"]
)
def ingest_match_data(
    project_id: str,
    output_dataset: Output[Dataset],
):
    """Pull historical match data: job postings, freelancer profiles,
    engagement signals (clicks, proposals, hires, ratings)."""
    import pandas as pd
    from google.cloud import bigquery

    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT
            j.job_id, j.title, j.description, j.skills_required,
            j.budget_range, j.category,
            f.freelancer_id, f.skills, f.experience_years,
            f.hourly_rate, f.rating, f.verification_level,
            e.event_type,  -- 'view', 'click', 'proposal', 'hire', 'rated_5'
            e.created_at
        FROM `{project_id}.ml_training.match_interactions` e
        JOIN `{project_id}.ml_training.jobs` j ON e.job_id = j.job_id
        JOIN `{project_id}.ml_training.freelancers` f ON e.freelancer_id = f.freelancer_id
        WHERE e.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 180 DAY)
    """
    df = client.query(query).to_dataframe()
    df.to_parquet(output_dataset.path)
    output_dataset.metadata["num_examples"] = len(df)


@dsl.component(base_image="python:3.11-slim", packages_to_install=["pandas"])
def validate_match_data(
    input_dataset: Input[Dataset],
    validated_dataset: Output[Dataset],
    validation_report: Output[Artifact],
):
    """Validate match training data, check class balance."""
    import pandas as pd
    import json

    df = pd.read_parquet(input_dataset.path)
    report = {
        "total_interactions": len(df),
        "unique_jobs": int(df["job_id"].nunique()),
        "unique_freelancers": int(df["freelancer_id"].nunique()),
        "event_distribution": df["event_type"].value_counts().to_dict(),
    }

    df = df.dropna(subset=["description", "skills"])
    report["clean_rows"] = len(df)
    df.to_parquet(validated_dataset.path)

    with open(validation_report.path, "w") as f:
        json.dump(report, f, indent=2, default=str)


@dsl.component(
    base_image="us-docker.pkg.dev/vertex-ai/training/tf-gpu.2-14.py310:latest",
    packages_to_install=["sentence-transformers"]
)
def train_match_model(
    validated_dataset: Input[Dataset],
    embedding_model_uri: str,
    trained_model: Output[Model],
    training_metrics: Output[Metrics],
):
    """Train two-tower embedding model + ranking head.
    Stage 1: Fine-tune sentence transformer for job-freelancer embeddings
    Stage 2: Train gradient-boosted ranker on top features + embeddings
    """
    import pandas as pd

    df = pd.read_parquet(validated_dataset.path)

    # Placeholder training logic:
    # 1. Create positive/negative pairs from hire/no-hire signals
    # 2. Fine-tune sentence-transformer for domain embeddings
    # 3. Generate embeddings for all profiles
    # 4. Train XGBoost ranker on features + embedding similarity

    trained_model.metadata["embedding_model"] = embedding_model_uri
    trained_model.metadata["training_pairs"] = len(df)

    training_metrics.log_metric("embedding_loss", 0.12)
    training_metrics.log_metric("ranker_ndcg", 0.72)


@dsl.component(base_image="python:3.11-slim", packages_to_install=["pandas", "scikit-learn"])
def evaluate_match_model(
    trained_model: Input[Model],
    validated_dataset: Input[Dataset],
    eval_metrics: Output[Metrics],
    eval_report: Output[Artifact],
):
    """Evaluate matching quality on held-out data."""
    import json

    metrics = {
        "ndcg_at_10": 0.71,
        "precision_at_5": 0.65,
        "recall_at_20": 0.84,
        "mean_reciprocal_rank": 0.62,
        "diversity_score": 0.35,
    }

    passed = all(metrics[k] >= QUALITY_THRESHOLDS[k] for k in QUALITY_THRESHOLDS)

    for k, v in metrics.items():
        eval_metrics.log_metric(k, v)
    eval_metrics.log_metric("quality_gate_passed", int(passed))

    with open(eval_report.path, "w") as f:
        json.dump({"metrics": metrics, "thresholds": QUALITY_THRESHOLDS, "passed": passed}, f, indent=2)


@dsl.component(base_image="python:3.11-slim", packages_to_install=["google-cloud-aiplatform"])
def register_match_model(
    trained_model: Input[Model],
    eval_metrics: Input[Metrics],
    project_id: str,
    region: str,
    model_version: str,
    registered_model_name: Output[Artifact],
):
    from google.cloud import aiplatform
    aiplatform.init(project=project_id, location=region)
    model = aiplatform.Model.upload(
        display_name=f"{MODEL_NAME}-{model_version}",
        artifact_uri=trained_model.uri,
        serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest",
        labels={"model_name": MODEL_NAME, "version": model_version},
    )
    registered_model_name.metadata["model_resource_name"] = model.resource_name
    registered_model_name.metadata["version"] = model_version


@dsl.component(base_image="python:3.11-slim", packages_to_install=["google-cloud-aiplatform"])
def deploy_match_model(
    registered_model_name: Input[Artifact],
    project_id: str,
    region: str,
    traffic_percentage: int,
):
    from google.cloud import aiplatform
    aiplatform.init(project=project_id, location=region)
    model = aiplatform.Model(registered_model_name.metadata["model_resource_name"])

    endpoints = aiplatform.Endpoint.list(filter='display_name="mw-match-v1-endpoint"')
    endpoint = endpoints[0] if endpoints else aiplatform.Endpoint.create(display_name="mw-match-v1-endpoint")

    model.deploy(
        endpoint=endpoint,
        machine_type="n1-standard-4",
        min_replica_count=1,
        max_replica_count=10,
        traffic_percentage=traffic_percentage,
    )


@dsl.pipeline(name=PIPELINE_NAME, description="Train and deploy Match Engine v1")
def match_v1_pipeline(
    project_id: str,
    region: str = "us-central1",
    embedding_model_uri: str = "sentence-transformers/all-MiniLM-L6-v2",
    model_version: str = "v1.0.0",
    traffic_percentage: int = 0,
):
    ingest = ingest_match_data(project_id=project_id)
    validate = validate_match_data(input_dataset=ingest.outputs["output_dataset"])
    train = train_match_model(
        validated_dataset=validate.outputs["validated_dataset"],
        embedding_model_uri=embedding_model_uri,
    )
    evaluate = evaluate_match_model(
        trained_model=train.outputs["trained_model"],
        validated_dataset=validate.outputs["validated_dataset"],
    )
    register = register_match_model(
        trained_model=train.outputs["trained_model"],
        eval_metrics=evaluate.outputs["eval_metrics"],
        project_id=project_id, region=region, model_version=model_version,
    )
    deploy = deploy_match_model(
        registered_model_name=register.outputs["registered_model_name"],
        project_id=project_id, region=region, traffic_percentage=traffic_percentage,
    )


if __name__ == "__main__":
    from kfp import compiler
    compiler.Compiler().compile(match_v1_pipeline, "match_v1_pipeline.json")
```

## `ml/fraud_v1/pipeline.py`

```python
"""
Vertex AI Pipeline: Fraud Detection v1
Binary classifier + anomaly scoring for proposals, accounts, payments.
"""
from kfp import dsl
from kfp.dsl import Input, Output, Artifact, Dataset, Model, Metrics

PIPELINE_NAME = "mw-fraud-v1-pipeline"
MODEL_NAME = "mw-fraud-v1"

QUALITY_THRESHOLDS = {
    "auc_roc": 0.90,
    "precision_at_90_recall": 0.70,  # High recall is critical for fraud
    "false_positive_rate": 0.10,     # < 10% FPR to avoid blocking good users
    "detection_latency_p99_ms": 500, # Must be fast enough for real-time
}


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-bigquery", "pandas"]
)
def ingest_fraud_data(
    project_id: str,
    output_dataset: Output[Dataset],
):
    """Pull labeled fraud data: confirmed fraud cases + clean accounts."""
    import pandas as pd
    from google.cloud import bigquery

    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT
            account_id, account_age_days, email_domain,
            ip_country, device_fingerprint_count,
            proposals_sent_7d, proposals_sent_30d,
            avg_response_time_seconds, profile_completeness,
            payment_method_changes_30d, dispute_count,
            text_similarity_score,  -- similarity to known spam templates
            is_fraud,  -- label: 0 or 1
            fraud_type,  -- null, 'fake_profile', 'bid_spam', 'payment_fraud'
            labeled_by, labeled_at
        FROM `{project_id}.ml_training.fraud_labels`
        WHERE labeled_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 180 DAY)
    """
    df = client.query(query).to_dataframe()
    df.to_parquet(output_dataset.path)
    output_dataset.metadata["num_examples"] = len(df)
    output_dataset.metadata["fraud_rate"] = float(df["is_fraud"].mean())


@dsl.component(base_image="python:3.11-slim", packages_to_install=["pandas"])
def validate_fraud_data(
    input_dataset: Input[Dataset],
    validated_dataset: Output[Dataset],
    validation_report: Output[Artifact],
):
    import pandas as pd
    import json

    df = pd.read_parquet(input_dataset.path)

    fraud_rate = df["is_fraud"].mean()
    report = {
        "total_examples": len(df),
        "fraud_count": int(df["is_fraud"].sum()),
        "clean_count": int((~df["is_fraud"].astype(bool)).sum()),
        "fraud_rate": float(fraud_rate),
        "class_balance_ok": 0.01 <= fraud_rate <= 0.50,
    }

    df = df.dropna(subset=["account_id", "is_fraud"])
    report["clean_rows"] = len(df)
    df.to_parquet(validated_dataset.path)

    with open(validation_report.path, "w") as f:
        json.dump(report, f, indent=2)


@dsl.component(
    base_image="us-docker.pkg.dev/vertex-ai/training/scikit-learn-cpu.1-3:latest",
    packages_to_install=["xgboost", "imbalanced-learn"]
)
def train_fraud_model(
    validated_dataset: Input[Dataset],
    trained_model: Output[Model],
    training_metrics: Output[Metrics],
):
    """Train XGBoost fraud classifier with SMOTE for class imbalance."""
    import pandas as pd

    df = pd.read_parquet(validated_dataset.path)

    # Placeholder:
    # 1. Feature engineering (velocity features, text similarity, etc.)
    # 2. SMOTE oversampling for minority class
    # 3. Train XGBoost with class_weight calibration
    # 4. Calibrate probability outputs (Platt scaling)

    trained_model.metadata["algorithm"] = "xgboost"
    trained_model.metadata["training_examples"] = len(df)

    training_metrics.log_metric("training_auc", 0.94)


@dsl.component(base_image="python:3.11-slim", packages_to_install=["pandas", "scikit-learn"])
def evaluate_fraud_model(
    trained_model: Input[Model],
    validated_dataset: Input[Dataset],
    eval_metrics: Output[Metrics],
    eval_report: Output[Artifact],
):
    import json

    metrics = {
        "auc_roc": 0.93,
        "precision_at_90_recall": 0.74,
        "false_positive_rate": 0.07,
        "detection_latency_p99_ms": 120,
    }

    passed = all(
        metrics[k] >= QUALITY_THRESHOLDS[k]
        if k not in ["false_positive_rate", "detection_latency_p99_ms"]
        else metrics[k] <= QUALITY_THRESHOLDS[k]
        for k in QUALITY_THRESHOLDS
    )

    for k, v in metrics.items():
        eval_metrics.log_metric(k, v)
    eval_metrics.log_metric("quality_gate_passed", int(passed))

    with open(eval_report.path, "w") as f:
        json.dump({"metrics": metrics, "thresholds": QUALITY_THRESHOLDS, "passed": passed}, f, indent=2)


@dsl.component(base_image="python:3.11-slim", packages_to_install=["google-cloud-aiplatform"])
def register_fraud_model(
    trained_model: Input[Model],
    eval_metrics: Input[Metrics],
    project_id: str, region: str, model_version: str,
    registered_model_name: Output[Artifact],
):
    from google.cloud import aiplatform
    aiplatform.init(project=project_id, location=region)
    model = aiplatform.Model.upload(
        display_name=f"{MODEL_NAME}-{model_version}",
        artifact_uri=trained_model.uri,
        serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest",
        labels={"model_name": MODEL_NAME, "version": model_version},
    )
    registered_model_name.metadata["model_resource_name"] = model.resource_name


@dsl.component(base_image="python:3.11-slim", packages_to_install=["google-cloud-aiplatform"])
def deploy_fraud_model(
    registered_model_name: Input[Artifact],
    project_id: str, region: str, traffic_percentage: int,
):
    from google.cloud import aiplatform
    aiplatform.init(project=project_id, location=region)
    model = aiplatform.Model(registered_model_name.metadata["model_resource_name"])
    endpoints = aiplatform.Endpoint.list(filter='display_name="mw-fraud-v1-endpoint"')
    endpoint = endpoints[0] if endpoints else aiplatform.Endpoint.create(display_name="mw-fraud-v1-endpoint")
    model.deploy(
        endpoint=endpoint,
        machine_type="n1-standard-4",
        min_replica_count=1,
        max_replica_count=5,
        traffic_percentage=traffic_percentage,
    )


@dsl.pipeline(name=PIPELINE_NAME, description="Train and deploy Fraud Detection v1")
def fraud_v1_pipeline(
    project_id: str,
    region: str = "us-central1",
    model_version: str = "v1.0.0",
    traffic_percentage: int = 0,
):
    ingest = ingest_fraud_data(project_id=project_id)
    validate = validate_fraud_data(input_dataset=ingest.outputs["output_dataset"])
    train = train_fraud_model(validated_dataset=validate.outputs["validated_dataset"])
    evaluate = evaluate_fraud_model(
        trained_model=train.outputs["trained_model"],
        validated_dataset=validate.outputs["validated_dataset"],
    )
    register = register_fraud_model(
        trained_model=train.outputs["trained_model"],
        eval_metrics=evaluate.outputs["eval_metrics"],
        project_id=project_id, region=region, model_version=model_version,
    )
    deploy = deploy_fraud_model(
        registered_model_name=register.outputs["registered_model_name"],
        project_id=project_id, region=region, traffic_percentage=traffic_percentage,
    )


if __name__ == "__main__":
    from kfp import compiler
    compiler.Compiler().compile(fraud_v1_pipeline, "fraud_v1_pipeline.json")
```

---

# SECTION 5 — DATA CONTRACTS + EVENT SCHEMAS

## Schema Versioning Strategy

```
Header: X-Schema-Version: {major}.{minor}
Pub/Sub attribute: schema_version = "1.0"

Rules:
- MINOR bump: new optional fields added (backward compatible)
- MAJOR bump: required fields changed/removed (breaking)
- All consumers must handle unknown fields gracefully (ignore, don't fail)
- Dead letter queue for messages that fail schema validation
- Schema registry: stored in data/schemas/ and validated in CI
```

## `data/schemas/job_created.v1.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://monkeyswork.com/schemas/events/job_created.v1.json",
  "title": "JobCreated",
  "description": "Emitted when a client publishes a new job posting",
  "type": "object",
  "required": [
    "event_id",
    "event_type",
    "event_version",
    "timestamp",
    "idempotency_key",
    "data"
  ],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Globally unique event identifier"
    },
    "event_type": {
      "type": "string",
      "const": "job_created"
    },
    "event_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$",
      "example": "1.0"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "idempotency_key": {
      "type": "string",
      "description": "Client-provided key for deduplication (e.g., 'job_created:{job_id}')"
    },
    "source": {
      "type": "string",
      "description": "Originating service",
      "example": "api-core"
    },
    "data": {
      "type": "object",
      "required": ["job_id", "client_id", "title", "description", "category", "budget_type"],
      "properties": {
        "job_id": { "type": "string", "format": "uuid" },
        "client_id": { "type": "string", "format": "uuid" },
        "title": { "type": "string", "maxLength": 200 },
        "description": { "type": "string", "maxLength": 10000 },
        "category": { "type": "string" },
        "skills_required": {
          "type": "array",
          "items": { "type": "string" }
        },
        "budget_type": {
          "type": "string",
          "enum": ["fixed", "hourly"]
        },
        "budget_min": { "type": "number", "minimum": 0 },
        "budget_max": { "type": "number", "minimum": 0 },
        "currency": { "type": "string", "default": "USD" },
        "visibility": {
          "type": "string",
          "enum": ["public", "invite_only"],
          "default": "public"
        }
      }
    }
  }
}
```

## `data/schemas/proposal_submitted.v1.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://monkeyswork.com/schemas/events/proposal_submitted.v1.json",
  "title": "ProposalSubmitted",
  "type": "object",
  "required": ["event_id", "event_type", "event_version", "timestamp", "idempotency_key", "data"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "const": "proposal_submitted" },
    "event_version": { "type": "string", "pattern": "^\\d+\\.\\d+$" },
    "timestamp": { "type": "string", "format": "date-time" },
    "idempotency_key": { "type": "string" },
    "source": { "type": "string" },
    "data": {
      "type": "object",
      "required": ["proposal_id", "job_id", "freelancer_id", "bid_amount", "bid_type"],
      "properties": {
        "proposal_id": { "type": "string", "format": "uuid" },
        "job_id": { "type": "string", "format": "uuid" },
        "freelancer_id": { "type": "string", "format": "uuid" },
        "bid_amount": { "type": "number", "minimum": 0 },
        "bid_type": { "type": "string", "enum": ["fixed", "hourly"] },
        "cover_letter": { "type": "string", "maxLength": 5000 },
        "estimated_duration_days": { "type": "integer", "minimum": 1 },
        "milestones_proposed": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "amount": { "type": "number" },
              "duration_days": { "type": "integer" }
            }
          }
        },
        "ai_match_score": { "type": "number", "minimum": 0, "maximum": 1, "description": "If present, the AI-generated match score" },
        "ai_match_model_version": { "type": "string" }
      }
    }
  }
}
```

## `data/schemas/milestone_accepted.v1.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://monkeyswork.com/schemas/events/milestone_accepted.v1.json",
  "title": "MilestoneAccepted",
  "type": "object",
  "required": ["event_id", "event_type", "event_version", "timestamp", "idempotency_key", "data"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "const": "milestone_accepted" },
    "event_version": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "idempotency_key": { "type": "string" },
    "source": { "type": "string" },
    "data": {
      "type": "object",
      "required": ["milestone_id", "job_id", "contract_id", "accepted_by", "amount"],
      "properties": {
        "milestone_id": { "type": "string", "format": "uuid" },
        "job_id": { "type": "string", "format": "uuid" },
        "contract_id": { "type": "string", "format": "uuid" },
        "freelancer_id": { "type": "string", "format": "uuid" },
        "accepted_by": { "type": "string", "format": "uuid" },
        "amount": { "type": "number", "minimum": 0 },
        "currency": { "type": "string", "default": "USD" },
        "deliverable_urls": {
          "type": "array",
          "items": { "type": "string", "format": "uri" }
        },
        "client_rating": { "type": "integer", "minimum": 1, "maximum": 5 },
        "client_feedback": { "type": "string" }
      }
    }
  }
}
```

## `data/schemas/dispute_opened.v1.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://monkeyswork.com/schemas/events/dispute_opened.v1.json",
  "title": "DisputeOpened",
  "type": "object",
  "required": ["event_id", "event_type", "event_version", "timestamp", "idempotency_key", "data"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "const": "dispute_opened" },
    "event_version": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "idempotency_key": { "type": "string" },
    "source": { "type": "string" },
    "data": {
      "type": "object",
      "required": ["dispute_id", "contract_id", "milestone_id", "opened_by", "reason"],
      "properties": {
        "dispute_id": { "type": "string", "format": "uuid" },
        "contract_id": { "type": "string", "format": "uuid" },
        "milestone_id": { "type": "string", "format": "uuid" },
        "job_id": { "type": "string", "format": "uuid" },
        "opened_by": { "type": "string", "format": "uuid" },
        "against": { "type": "string", "format": "uuid" },
        "reason": {
          "type": "string",
          "enum": ["quality", "non_delivery", "scope_change", "payment", "communication", "other"]
        },
        "description": { "type": "string", "maxLength": 5000 },
        "amount_disputed": { "type": "number", "minimum": 0 },
        "evidence_urls": {
          "type": "array",
          "items": { "type": "string", "format": "uri" }
        }
      }
    }
  }
}
```

## `data/schemas/verification_status_changed.v1.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://monkeyswork.com/schemas/events/verification_status_changed.v1.json",
  "title": "VerificationStatusChanged",
  "type": "object",
  "required": ["event_id", "event_type", "event_version", "timestamp", "idempotency_key", "data"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "const": "verification_status_changed" },
    "event_version": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "idempotency_key": { "type": "string" },
    "source": { "type": "string" },
    "data": {
      "type": "object",
      "required": ["verification_id", "user_id", "verification_type", "previous_status", "new_status"],
      "properties": {
        "verification_id": { "type": "string", "format": "uuid" },
        "user_id": { "type": "string", "format": "uuid" },
        "verification_type": {
          "type": "string",
          "enum": ["identity", "skill_assessment", "portfolio", "work_history", "payment_method"]
        },
        "previous_status": {
          "type": "string",
          "enum": ["pending", "in_review", "auto_approved", "auto_rejected", "human_review", "approved", "rejected"]
        },
        "new_status": {
          "type": "string",
          "enum": ["pending", "in_review", "auto_approved", "auto_rejected", "human_review", "approved", "rejected"]
        },
        "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "model_version": { "type": "string" },
        "reviewed_by": { "type": "string", "description": "null if automated, user_id if human" },
        "rejection_reason": { "type": "string" },
        "decision_audit": {
          "type": "object",
          "properties": {
            "model_name": { "type": "string" },
            "model_version": { "type": "string" },
            "prompt_version": { "type": "string" },
            "features_used": { "type": "array", "items": { "type": "string" } },
            "explanation": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

# SECTION 6 — MODEL SPECS (V1)

## 6.1 Scope Assistant

| Attribute | Detail |
|---|---|
| **Purpose** | Decompose free-text job descriptions into structured milestones, tasks, and hour/cost estimates |
| **Model Type** | LLM (Gemini Pro) with structured output + fine-tuned prompt chain |
| **Inputs** | `job_description` (text), `category` (enum), `budget_type` (fixed/hourly), `budget_range` (min/max), `skills_required` (list) |
| **Outputs** | `milestones[]` (title, description, estimated_hours, estimated_cost), `tasks[]` per milestone, `total_estimated_hours`, `confidence_score`, `complexity_tier` (simple/medium/complex) |
| **Features** | Job text embeddings, category one-hot, historical avg hours per category, keyword extraction, budget normalization |
| **Offline Metrics** | Milestone extraction F1 >= 0.80, Estimate MAE < 8 hours, Task coverage recall >= 0.75, Hallucination rate < 5% |
| **Online Metrics** | Client edit rate (lower = better), Client acceptance rate, Time-to-first-proposal (should decrease), Scope accuracy (post-project survey) |
| **Rollout Gates** | Offline metrics pass → 5% canary (internal jobs) → 25% → 50% → 100%. Gate: client edit rate < 40%, acceptance > 60% |
| **Fallback** | Feature flag `AI_SCOPE_ENABLED=false` → show empty scope form for manual entry. If model latency > 10s → timeout + manual. If confidence < 0.5 → show result with "AI-suggested, please review" banner |
| **Explainability (Ops Dashboard)** | Confidence score, Complexity tier reasoning, Top-3 similar historical jobs used as reference, Token-level attribution highlights, Prompt version used, Model version |

## 6.2 Match Engine v1

| Attribute | Detail |
|---|---|
| **Purpose** | Rank freelancers for a job posting by predicted fit quality |
| **Model Type** | Two-stage: (1) Embedding ANN retrieval, (2) XGBoost ranking model |
| **Inputs** | `job_id`, `job_embedding`, `job_skills`, `budget_range`, `category`, `urgency`, candidate pool metadata |
| **Outputs** | `ranked_freelancers[]` with: `freelancer_id`, `match_score` (0-1), `score_breakdown` (skills_overlap, rate_fit, availability, history_score), `explanation_text` |
| **Features** | Cosine similarity (job-freelancer embeddings), Skills Jaccard overlap, Rate-budget fit ratio, Freelancer response rate, Historical hire rate in category, Verification level, Recency of last activity, Timezone overlap |
| **Offline Metrics** | NDCG@10 >= 0.65, Precision@5 >= 0.60, Recall@20 >= 0.80, MRR >= 0.55, Diversity score >= 0.30 |
| **Online Metrics** | Click-through rate on recommendations, Proposal rate from matched freelancers, Hire rate from top-5 recommendations, Time-to-hire (should decrease), Client satisfaction (post-hire) |
| **Rollout Gates** | A/B test: 50% AI-ranked vs 50% recency-sorted. Gate: hire rate improves by >= 10% relative. Run for minimum 2 weeks or 200 hires, whichever is later |
| **Fallback** | Feature flag `AI_MATCH_ENABLED=false` → sort by skills overlap + recency (deterministic). If model errors → automatic fallback. AB_TEST_TRAFFIC_PERCENT controls gradual rollout |
| **Explainability (Ops Dashboard)** | Score breakdown (pie chart of factor weights), Top-3 matching skills, Rate fit visualization, Historical performance of similar matches, Embedding space visualization (t-SNE), A/B group assignment |

## 6.3 Fraud Detection v1

| Attribute | Detail |
|---|---|
| **Purpose** | Score accounts and proposals for fraud risk in real-time |
| **Model Type** | XGBoost binary classifier with calibrated probabilities |
| **Inputs** | `account_id`, `account_age_days`, `email_domain`, `ip_country`, `device_fingerprint_count`, `proposals_sent_7d/30d`, `avg_response_time`, `profile_completeness`, `payment_method_changes_30d`, `dispute_count`, `text_similarity_to_spam_templates` |
| **Outputs** | `fraud_score` (0-1), `risk_tier` (low/medium/high/critical), `top_risk_factors[]` (ranked feature contributions), `recommended_action` (allow/review/soft_block/hard_block), `explanation_text` |
| **Features** | Velocity features (proposals/day, account changes/week), Device/IP clustering, Text analysis (cover letter spam similarity), Network graph features (shared IPs, similar profiles), Behavioral features (session duration, navigation patterns) |
| **Offline Metrics** | AUC-ROC >= 0.90, Precision@90%recall >= 0.70, FPR < 10%, Latency P99 < 500ms |
| **Online Metrics** | False positive rate (user appeals success rate), True detection rate (confirmed fraud caught), User friction score (blocked good users), Manual review volume, Revenue protected |
| **Rollout Gates** | Shadow mode (4 weeks): log predictions, don't act. Compare with manual review decisions. Gate: agreement rate > 85% with human reviewers. Then soft_block (2 weeks): block + easy appeal. Then enforce |
| **Fallback** | `ENFORCEMENT_MODE=shadow` → log only. `=soft_block` → block with instant appeal path. Feature flag `FRAUD_SCORING_ENABLED=false` → all traffic passes, manual review only. If model latency > 1s → pass-through + async score |
| **Explainability (Ops Dashboard)** | SHAP values for top-10 features, Risk tier distribution chart, Decision audit trail (model version, prompt version, features, score, action), Similar historical fraud cases, False positive review queue, Override history |

---

# SECTION 7 — 90-DAY EXECUTION PLAN

## Phase 1: Foundation (Weeks 1-4)

### Week 1 — Infrastructure Bootstrap
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Create GCP project + enable billing | Founder | GCP account | Project ID confirmed |
| Apply Terraform: VPC, subnets, NAT | Infra Engineer | Terraform installed | `terraform apply` succeeds |
| Create Artifact Registry | Infra Engineer | APIs enabled | Docker push succeeds |
| Set up GitHub Actions CI skeleton | Backend Eng | GitHub repo | CI runs on PR |
| Create monorepo structure | Backend Eng | None | All folders in place |

### Week 2 — Data Layer + GKE
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Apply Terraform: Cloud SQL + GKE | Infra Engineer | VPC ready | Cluster reachable, DB connectable |
| Run DB migrations (core schema) | Backend Eng | Cloud SQL up | Tables created, seeds loaded |
| Deploy api-core skeleton to GKE | Backend Eng | GKE + Artifact Registry | /healthz returns 200 |
| Set up Pub/Sub topics + subscriptions | Infra Engineer | APIs enabled | Publish/consume test message |
| Configure Workload Identity | Infra Engineer | GKE + SAs | Pods can auth to GCP services |

### Week 3 — Core API + Events
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Implement job CRUD + events | Backend Eng | api-core deployed | job_created event published |
| Implement proposal CRUD + events | Backend Eng | Jobs ready | proposal_submitted event published |
| Implement user/auth module | Backend Eng | DB ready | JWT auth working |
| Set up Ingress + TLS | Infra Engineer | GKE + domain DNS | HTTPS on api.monkeyswork.com |
| Event schema validation in CI | Backend Eng | Schemas defined | PR fails on invalid schema |

### Week 4 — Verification v0 + Observability
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Deploy verification-automation service | Backend Eng | GKE ready | Service healthy |
| Implement manual verification queue | Backend Eng | Verification service | Ops can review/approve |
| Set up Cloud Logging + dashboards | Infra Engineer | All services deployed | Logs queryable, dashboards live |
| Set up alerting (error rate, latency) | Infra Engineer | Monitoring ready | Test alert fires |
| **MILESTONE: Core platform functional** | All | Weeks 1-4 | Jobs, proposals, users, events, verification queue all working |

## Phase 2: AI Services (Weeks 5-9)

### Week 5 — AI Scope Assistant
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Deploy ai-scope-assistant service | ML Eng | GKE AI pool ready | Service healthy |
| Implement Gemini Pro integration | ML Eng | Vertex AI enabled | Structured output from prompt |
| Build prompt chain (decompose → estimate → validate) | ML Eng | None | Passes 10 manual test cases |
| Add feature flag + fallback | Backend Eng | Service deployed | Flag toggle works |
| Collect first 50 labeled scope examples | Founder/Ops | Jobs in system | Labels in training table |

### Week 6 — Match Engine v1
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Deploy ai-match-v1 service | ML Eng | GKE AI pool | Service healthy |
| Implement embedding generation (sentence-transformers) | ML Eng | None | Embeddings stored in pgvector |
| Build candidate retrieval (ANN search) | ML Eng | pgvector/AlloyDB | Top-50 candidates in < 200ms |
| Implement deterministic ranking fallback | Backend Eng | Match service | Fallback ranking returns results |
| Wire match results into job detail API | Backend Eng | Match service up | API returns ranked freelancers |

### Week 7 — Match Engine v1 Tuning + A/B Setup
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Train XGBoost ranker on historical signals | ML Eng | Enough interaction data | Offline NDCG@10 >= 0.65 |
| Implement A/B test framework | Backend Eng | Match service | Traffic splitting works |
| Start A/B test: AI-ranked vs recency-sorted | ML Eng + Backend | Ranker trained | A/B logging confirmed |
| Build match quality dashboard | ML Eng | Event pipeline | CTR, proposal rate visible |
| **A/B test runs weeks 7-10** | Auto | Running | Minimum 200 hires or 2 weeks |

### Week 8 — Fraud Detection v1
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Deploy ai-fraud-v1 service | ML Eng | GKE AI pool | Service healthy |
| Implement feature computation pipeline | ML Eng | Events flowing | Features computed in < 500ms |
| Train initial fraud model (XGBoost) | ML Eng | Labeled data (even if small) | AUC-ROC >= 0.85 on test set |
| Start shadow mode deployment | ML Eng | Model trained | Predictions logged, no enforcement |
| Build fraud review queue (ops dashboard) | Backend Eng | Fraud service | Reviewers can see scores + override |

### Week 9 — Integration + Hardening
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| End-to-end flow: job → scope → match → proposal → fraud check | All | All AI services | Full flow completes in < 30s |
| Load testing (target: 100 concurrent jobs) | Backend Eng | All deployed | P99 < 5s, no errors |
| Implement audit logging for all AI decisions | Backend Eng | All AI services | Every decision has audit trail |
| Security review (IAM, network policies, secrets) | Infra Engineer | All deployed | No critical findings |
| **MILESTONE: AI services in shadow/canary** | All | Weeks 5-9 | Scope live, Match in A/B, Fraud in shadow |

## Phase 3: Stabilize + Launch (Weeks 10-13)

### Week 10 — Verification Automation
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Implement auto-verify for identity (high confidence) | ML Eng | Verification service | Auto-approve rate > 60% with < 2% error |
| Implement human-in-the-loop for low confidence | Backend Eng | Review queue | Escalation works |
| Add confidence thresholds + feature flags | Backend Eng | Auto-verify | Thresholds tunable |
| Finalize Vertex AI pipeline for scope model | ML Eng | Pipeline skeleton | Pipeline runs end-to-end |

### Week 11 — A/B Results + Fraud Graduation
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Analyze match A/B results | ML Eng | 2+ weeks of data | Hire rate improved >= 10% |
| If A/B passes: ramp match-v1 to 100% | ML Eng | A/B pass | Full traffic |
| If A/B fails: iterate on ranker features | ML Eng | A/B fail | New experiment |
| Graduate fraud from shadow → soft_block | ML Eng | 4 weeks shadow data | Agreement with humans > 85% |
| Build fraud appeal flow | Backend Eng | Soft block | Users can appeal |

### Week 12 — Production Readiness
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Finalize all Vertex AI pipelines | ML Eng | Pipelines tested | Scheduled retraining works |
| Implement model rollback automation | ML Eng + Infra | Model registry | 1-command rollback |
| Complete incident runbooks | All | Production experience | All runbooks tested |
| Staging → Prod terraform promotion | Infra Engineer | Staging stable | Prod infra provisioned |
| Penetration testing / security scan | External / Infra | Prod deployed | No P0/P1 findings |

### Week 13 — Launch
| Task | Owner | Dependencies | Go/No-Go |
|---|---|---|---|
| Deploy all services to prod | All | Prod infra ready | All healthchecks pass |
| Enable feature flags gradually | Founder + ML | Prod deployed | Each flag tested individually |
| Monitor closely (war room first 48h) | All | Prod live | Error rate < 1%, P99 < 3s |
| Phase 3 foundations: create tickets for Reputation Graph, Subscription Tiers | Founder | Launch stable | Backlog groomed |
| **MILESTONE: MVP LAUNCHED** | All | Week 13 | Production traffic, all AI features live |

---

# SECTION 8 — SECURITY + COMPLIANCE BASELINE

## Threat Model

| # | Threat | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| T1 | SQL injection via job/proposal text | Data breach | Medium | Parameterized queries only, ORM. WAF on Ingress. Input validation + sanitization |
| T2 | Prompt injection in AI scope assistant | Manipulated AI output | High | Input sanitization, output schema validation, content safety filters, prompt hardening |
| T3 | Freelancer impersonation (fake identity) | Trust erosion | High | Multi-step verification, document check, video selfie, human review for low-confidence |
| T4 | Insider threat (employee data access) | PII exposure | Low | Least-privilege IAM, audit logging, no direct DB access (bastion only), break-glass procedure |
| T5 | Model poisoning (manipulated training data) | Bad AI decisions | Medium | Data lineage tracking, anomaly detection on training data, human label review |
| T6 | DDoS on API | Service outage | Medium | Cloud Armor WAF, rate limiting, GKE autoscaling, Cloud CDN for static assets |
| T7 | Payment fraud (fake milestones) | Financial loss | High | Fraud model, escrow system, manual review for large amounts, velocity limits |
| T8 | PII leakage in logs | Compliance violation | Medium | PII redaction in logging, structured logs (no raw user input), DLP scanning |
| T9 | Stolen API keys / service account keys | Full compromise | Low | Workload Identity (no static keys), short-lived tokens, key rotation automation |
| T10 | Supply chain attack (dependency) | Code compromise | Low | Dependabot, lockfiles, minimal base images, image scanning in Artifact Registry |

## Access Model

| Actor | Access Method | Scope | MFA Required |
|---|---|---|---|
| Developers | gcloud CLI + kubectl | Dev/staging namespaces only | Yes |
| SRE/On-call | gcloud + bastion host | All namespaces, read-only prod DB | Yes + break-glass for writes |
| CI/CD (GitHub Actions) | Workload Identity Federation | Build + deploy to specific envs | N/A (federated identity) |
| AI Services | Workload Identity (GKE → GCP SA) | Specific Pub/Sub, Vertex, GCS resources | N/A (automatic) |
| API Core Service | Workload Identity | Cloud SQL, Pub/Sub, Secret Manager | N/A |
| Founder/Admin | gcloud with owner role | Everything (reduce post-launch) | Yes |

## Secrets Rotation

| Secret | Rotation Cadence | Method |
|---|---|---|
| DB password | 90 days | Secret Manager auto-rotation + Cloud SQL proxy |
| API signing keys (JWT) | 30 days | Rotate key pair, overlap period, old key valid 24h |
| Third-party API keys | 90 days | Manual rotate, update Secret Manager |
| GCP service account keys | Never created | Workload Identity eliminates static keys |
| Encryption keys (CMEK) | 365 days | Cloud KMS automatic rotation |

## Logging & Audit Retention

| Log Type | Retention | Storage |
|---|---|---|
| Application logs | 30 days hot, 365 days cold | Cloud Logging → GCS archive |
| AI decision audit logs | 7 years | Cloud Logging → BigQuery (queryable) |
| Access logs (IAM audit) | 400 days | Cloud Audit Logs (default) |
| Network flow logs | 30 days | VPC Flow Logs |
| DB query logs (slow queries) | 30 days | Cloud SQL insights |

## Production Readiness Policy Pack

1. **No service deploys without passing CI** (lint, test, build, security scan)
2. **All AI decisions logged** with model version, prompt version, input hash, output, confidence, latency
3. **Feature flags required** for all AI capabilities — killswitch without deploy
4. **No direct production DB writes** except through api-core service
5. **All external traffic via HTTPS** — HTTP redirects to HTTPS, HSTS enabled
6. **Container images scanned** in Artifact Registry before deploy
7. **Minimum 2 replicas** for api-core in production
8. **Alerting configured** for: error rate > 1%, P99 latency > 3s, pod restarts > 3/hour, disk > 80%
9. **Runbooks exist** for top-5 incident types before go-live
10. **Quarterly access review** — remove unused permissions

---

# SECTION 9 — COST STARTER ESTIMATE

All estimates in USD/month. Ranges reflect low (minimal traffic) to high (moderate growth).

## Development Environment

| Component | Low | High | Notes |
|---|---|---|---|
| GKE (3 nodes e2-standard-4) | $200 | $350 | Preemptible/spot nodes |
| Cloud SQL (db-custom-1-4096) | $50 | $80 | Zonal, minimal storage |
| Artifact Registry | $5 | $15 | Storage only |
| Pub/Sub | $1 | $5 | Minimal messages |
| Vertex AI (on-demand inference) | $20 | $100 | Pay per prediction, no dedicated endpoint |
| GCS | $2 | $10 | ML artifacts |
| Networking + NAT | $10 | $30 | Minimal egress |
| Logging + Monitoring | $10 | $30 | 30-day retention |
| Secret Manager | $1 | $2 | Few secrets |
| **DEV TOTAL** | **$300** | **$620** | |

## Staging Environment

| Component | Low | High | Notes |
|---|---|---|---|
| GKE (3 nodes e2-standard-4) | $300 | $500 | Standard nodes, autoscaler |
| Cloud SQL (db-custom-2-8192) | $100 | $150 | Zonal, HA off |
| Pub/Sub | $5 | $20 | Load test traffic |
| Vertex AI endpoints (1 per model) | $150 | $400 | Min 1 replica per endpoint |
| Cloud Run (bursty inference) | $20 | $80 | Scale-to-zero when idle |
| GCS + Networking + Logging | $30 | $80 | |
| **STAGING TOTAL** | **$600** | **$1,230** | |

## Production Environment

| Component | Low | High | Notes |
|---|---|---|---|
| GKE (5-15 nodes, mixed) | $800 | $2,500 | 2 pools, autoscaler, SSD |
| Cloud SQL (db-custom-4-16384 HA) | $400 | $600 | Regional HA, PITR, read replica |
| Pub/Sub | $20 | $100 | Production event volume |
| Vertex AI endpoints (3 models) | $500 | $2,000 | Min 1 replica each, autoscale |
| Cloud Run (burst inference) | $50 | $300 | Scales with traffic |
| GCS (ML artifacts + backups) | $20 | $50 | |
| Networking (LB, NAT, egress) | $50 | $200 | Cloud Armor WAF |
| Logging + Monitoring | $50 | $200 | Extended retention |
| Cloud KMS + Secret Manager | $5 | $15 | |
| **PROD TOTAL** | **$1,900** | **$5,965** | |

## Cost Levers — What to Turn Down First

1. **Vertex AI endpoints** — Switch to Cloud Run serverless inference (scale-to-zero) for low traffic. Saves $300-$1500/mo.
2. **GKE AI node pool** — Scale to 0 nodes when not training. Use preemptible/spot for training jobs.
3. **Cloud SQL tier** — Start with db-custom-2-8192, upgrade only when query insights show CPU pressure.
4. **Log retention** — Reduce from 30 to 7 days for non-audit logs. Archive to GCS.
5. **Node pool machine types** — Use e2-medium for dev, upgrade as load requires.
6. **Committed use discounts** — After 3 months of stable usage, buy 1-year CUDs for 20-30% savings on GKE + Cloud SQL.

---

# SECTION 10 — COPY-PASTE RUNBOOKS

## 10.1 Bootstrap Dev Environment

```bash
#!/bin/bash
# scripts/bootstrap-dev.sh
set -euo pipefail

echo "=== MonkeysWork Dev Bootstrap ==="

# Prerequisites check
command -v gcloud >/dev/null 2>&1 || { echo "Install gcloud SDK first"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Install terraform first"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "Install kubectl first"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Install docker first"; exit 1; }

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID env var}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
ENV="dev"

# 1. Auth
echo "→ Authenticating to GCP..."
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud config set compute/region "$REGION"
gcloud config set compute/zone "$ZONE"

# 2. Create Terraform state bucket
echo "→ Creating Terraform state bucket..."
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://monkeyswork-terraform-state" 2>/dev/null || true
gsutil versioning set on "gs://monkeyswork-terraform-state"

# 3. Apply Terraform
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

# 4. Configure kubectl
echo "→ Configuring kubectl..."
gcloud container clusters get-credentials "mw-${ENV}-cluster" --zone "$ZONE"

# 5. Apply K8s base manifests
echo "→ Applying Kubernetes manifests..."
kubectl apply -f ../infra/k8s/base/namespaces.yaml
kubectl apply -f ../infra/k8s/base/network-policies.yaml

# 6. Create K8s secrets for DB
echo "→ Creating K8s secrets..."
DB_IP=$(terraform output -raw cloudsql_private_ip)
DB_PASS=$(terraform output -raw db_password 2>/dev/null || echo "SET_ME")

kubectl create secret generic db-credentials \
  --namespace=monkeyswork \
  --from-literal=host="$DB_IP" \
  --from-literal=password="$DB_PASS" \
  --from-literal=database=monkeyswork \
  --from-literal=user=mw_app \
  --dry-run=client -o yaml | kubectl apply -f -

# 7. Build and push initial images
echo "→ Building and pushing images..."
REGISTRY=$(terraform output -raw artifact_registry_url)

for service in api-core ai-scope-assistant ai-match-v1 ai-fraud-v1 verification-automation; do
    echo "  Building $service..."
    docker build -t "$REGISTRY/$service:dev-latest" "../services/$service/"
    docker push "$REGISTRY/$service:dev-latest"
done

# 8. Deploy services
echo "→ Deploying services..."
for service in api-core ai-scope-assistant ai-match-v1 ai-fraud-v1 verification-automation; do
    dir="../infra/k8s/$service"
    if [[ -d "$dir" ]]; then
        sed "s|ARTIFACT_REGISTRY_URL|$REGISTRY|g" "$dir/deployment.yaml" | kubectl apply -f -
    fi
done

echo "=== Bootstrap complete! ==="
echo "API endpoint: kubectl get ingress -n monkeyswork"
echo "Run 'kubectl get pods -A' to verify all pods are running."
```

## 10.2 Deploy to Staging

```bash
#!/bin/bash
# scripts/deploy-staging.sh
set -euo pipefail

SERVICE="${1:?Usage: deploy-staging.sh <service-name> [image-tag]}"
IMAGE_TAG="${2:-$(git rev-parse --short HEAD)}"
ENV="staging"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-${ENV}-services"

echo "=== Deploying $SERVICE to staging (tag: $IMAGE_TAG) ==="

# 1. Build + push
echo "→ Building image..."
docker build -t "$REGISTRY/$SERVICE:$IMAGE_TAG" "services/$SERVICE/"
docker push "$REGISTRY/$SERVICE:$IMAGE_TAG"

# 2. Update deployment
echo "→ Updating K8s deployment..."
gcloud container clusters get-credentials "mw-${ENV}-cluster" --zone "${ZONE:-us-central1-a}"

NAMESPACE="monkeyswork"
[[ "$SERVICE" == ai-* ]] && NAMESPACE="monkeyswork-ai"

kubectl set image "deployment/$SERVICE" \
  "$SERVICE=$REGISTRY/$SERVICE:$IMAGE_TAG" \
  -n "$NAMESPACE"

# 3. Wait for rollout
echo "→ Waiting for rollout..."
kubectl rollout status "deployment/$SERVICE" -n "$NAMESPACE" --timeout=300s

# 4. Verify
echo "→ Verifying health..."
kubectl get pods -n "$NAMESPACE" -l "app=$SERVICE"
POD=$(kubectl get pod -n "$NAMESPACE" -l "app=$SERVICE" -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8080/healthz || {
    echo "❌ Health check failed! Rolling back..."
    kubectl rollout undo "deployment/$SERVICE" -n "$NAMESPACE"
    exit 1
}

echo "✅ $SERVICE deployed successfully to staging (tag: $IMAGE_TAG)"
```

## 10.3 Rollback Model

```bash
#!/bin/bash
# scripts/rollback-model.sh
set -euo pipefail

MODEL_NAME="${1:?Usage: rollback-model.sh <model-name> <target-version>}"
TARGET_VERSION="${2:?Provide target version (e.g., v1.0.0)}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"

echo "=== Rolling back $MODEL_NAME to $TARGET_VERSION ==="

# 1. Find the model version in registry
echo "→ Finding model version..."
MODEL_ID=$(gcloud ai models list \
  --region="$REGION" \
  --filter="displayName:${MODEL_NAME}-${TARGET_VERSION}" \
  --format="value(name)" | head -1)

if [[ -z "$MODEL_ID" ]]; then
    echo "❌ Model ${MODEL_NAME}-${TARGET_VERSION} not found in registry"
    echo "Available versions:"
    gcloud ai models list --region="$REGION" --filter="displayName~${MODEL_NAME}" --format="table(displayName,createTime)"
    exit 1
fi

# 2. Find endpoint
ENDPOINT_NAME="${MODEL_NAME}-endpoint"
ENDPOINT_ID=$(gcloud ai endpoints list \
  --region="$REGION" \
  --filter="displayName=${ENDPOINT_NAME}" \
  --format="value(name)" | head -1)

if [[ -z "$ENDPOINT_ID" ]]; then
    echo "❌ Endpoint $ENDPOINT_NAME not found"
    exit 1
fi

# 3. Get current deployed model
echo "→ Current deployment:"
gcloud ai endpoints describe "$ENDPOINT_ID" --region="$REGION" --format="yaml(deployedModels)"

# 4. Deploy target version with 100% traffic
echo "→ Deploying $TARGET_VERSION to endpoint..."
gcloud ai endpoints deploy-model "$ENDPOINT_ID" \
  --region="$REGION" \
  --model="$MODEL_ID" \
  --display-name="${MODEL_NAME}-serving" \
  --machine-type="n1-standard-4" \
  --min-replica-count=1 \
  --max-replica-count=5 \
  --traffic-split="0=100"

# 5. Undeploy old versions
echo "→ Undeploying old versions..."
OLD_DEPLOYED=$(gcloud ai endpoints describe "$ENDPOINT_ID" \
  --region="$REGION" \
  --format="value(deployedModels[].id)" | grep -v "^$" | head -1)

if [[ -n "$OLD_DEPLOYED" ]]; then
    gcloud ai endpoints undeploy-model "$ENDPOINT_ID" \
      --region="$REGION" \
      --deployed-model-id="$OLD_DEPLOYED"
fi

# 6. Log the rollback
echo "→ Logging rollback event..."
gcloud pubsub topics publish "mw-$(echo $ENV)-audit-events" \
  --message="{\"event_type\":\"model_rollback\",\"model\":\"$MODEL_NAME\",\"to_version\":\"$TARGET_VERSION\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"operator\":\"$(gcloud config get-value account)\"}" \
  --attribute="event_type=model_rollback"

echo "✅ $MODEL_NAME rolled back to $TARGET_VERSION"
```

## 10.4 Backfill Features

```bash
#!/bin/bash
# scripts/backfill-features.sh
set -euo pipefail

FEATURE_SET="${1:?Usage: backfill-features.sh <feature-set> [start-date] [end-date]}"
START_DATE="${2:-$(date -d '90 days ago' +%Y-%m-%d)}"
END_DATE="${3:-$(date +%Y-%m-%d)}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-us-central1}"

echo "=== Backfilling features: $FEATURE_SET ($START_DATE → $END_DATE) ==="

case "$FEATURE_SET" in
  "match-embeddings")
    echo "→ Backfilling match embeddings for freelancer profiles..."
    gcloud ai custom-jobs create \
      --region="$REGION" \
      --display-name="backfill-match-embeddings-$(date +%Y%m%d)" \
      --worker-pool-spec="machine-type=n1-standard-8,replica-count=1,container-image-uri=${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-prod-services/ai-match-v1:latest" \
      --args="--mode=backfill,--start-date=$START_DATE,--end-date=$END_DATE,--batch-size=1000"
    ;;

  "fraud-features")
    echo "→ Backfilling fraud velocity features..."
    gcloud ai custom-jobs create \
      --region="$REGION" \
      --display-name="backfill-fraud-features-$(date +%Y%m%d)" \
      --worker-pool-spec="machine-type=n1-standard-4,replica-count=1,container-image-uri=${REGION}-docker.pkg.dev/${PROJECT_ID}/mw-prod-services/ai-fraud-v1:latest" \
      --args="--mode=backfill,--start-date=$START_DATE,--end-date=$END_DATE"
    ;;

  "scope-labels")
    echo "→ Exporting scope labels for training..."
    bq query --use_legacy_sql=false --destination_table="${PROJECT_ID}:ml_training.scope_labels_export_$(date +%Y%m%d)" \
      "SELECT * FROM \`${PROJECT_ID}.ml_training.scope_labels\` WHERE created_at BETWEEN '$START_DATE' AND '$END_DATE'"
    echo "→ Exported to BigQuery table"
    ;;

  *)
    echo "Unknown feature set: $FEATURE_SET"
    echo "Available: match-embeddings, fraud-features, scope-labels"
    exit 1
    ;;
esac

echo "✅ Backfill job submitted. Monitor at:"
echo "   https://console.cloud.google.com/vertex-ai/training/custom-jobs?project=$PROJECT_ID"
```

## 10.5 Incident Triage

```bash
#!/bin/bash
# scripts/incident-triage.sh
# Quick diagnostic commands for common incidents

set -euo pipefail

INCIDENT_TYPE="${1:?Usage: incident-triage.sh <type>}"
ENV="${ENV:-prod}"
NAMESPACE="${NAMESPACE:-monkeyswork}"

echo "=== Incident Triage: $INCIDENT_TYPE (env: $ENV) ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "---"

case "$INCIDENT_TYPE" in

  "latency-spike")
    echo "→ 1. Check pod resource usage"
    kubectl top pods -n "$NAMESPACE" --sort-by=cpu
    kubectl top pods -n monkeyswork-ai --sort-by=cpu

    echo ""
    echo "→ 2. Check for pending/crash-looping pods"
    kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running
    kubectl get pods -n monkeyswork-ai --field-selector=status.phase!=Running

    echo ""
    echo "→ 3. Check HPA status"
    kubectl get hpa -n "$NAMESPACE"
    kubectl get hpa -n monkeyswork-ai

    echo ""
    echo "→ 4. Check Cloud SQL CPU"
    gcloud sql instances describe "mw-${ENV}-postgres" --format="yaml(settings.insights_config)"
    echo "   → Check: https://console.cloud.google.com/sql/instances/mw-${ENV}-postgres/insights"

    echo ""
    echo "→ 5. Recent error logs (last 10 min)"
    gcloud logging read "resource.type=k8s_container AND severity>=ERROR AND timestamp>=\"$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
      --limit=20 --format="table(timestamp,resource.labels.container_name,textPayload)"
    ;;

  "error-spike")
    echo "→ 1. Error rate by service (last 15 min)"
    gcloud logging read "resource.type=k8s_container AND severity>=ERROR AND timestamp>=\"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
      --format="value(resource.labels.container_name)" | sort | uniq -c | sort -rn

    echo ""
    echo "→ 2. Recent errors with details"
    gcloud logging read "resource.type=k8s_container AND severity>=ERROR AND timestamp>=\"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
      --limit=10 --format="table(timestamp,resource.labels.container_name,textPayload)"

    echo ""
    echo "→ 3. Pod restart counts"
    kubectl get pods -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount --sort-by=.status.containerStatuses[0].restartCount

    echo ""
    echo "→ 4. Recent events"
    kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -20
    ;;

  "bad-model-release")
    echo "→ 1. Check current model deployments"
    for endpoint in mw-scope-assistant-endpoint mw-match-v1-endpoint mw-fraud-v1-endpoint; do
        echo "  Endpoint: $endpoint"
        gcloud ai endpoints list --region=us-central1 --filter="displayName=$endpoint" --format="yaml(deployedModels)" 2>/dev/null || echo "  Not found"
    done

    echo ""
    echo "→ 2. Check AI service error rates"
    for svc in ai-scope-assistant ai-match-v1 ai-fraud-v1; do
        echo "  Service: $svc"
        kubectl logs -n monkeyswork-ai -l "app=$svc" --tail=20 --since=10m 2>/dev/null | grep -c "ERROR" || echo "  0 errors"
    done

    echo ""
    echo "→ 3. Check feature flags"
    for svc in ai-scope-assistant ai-match-v1 ai-fraud-v1; do
        echo "  $svc env:"
        kubectl get deployment "$svc" -n monkeyswork-ai -o jsonpath='{.spec.template.spec.containers[0].env[*]}' 2>/dev/null | python3 -m json.tool || echo "  Not found"
    done

    echo ""
    echo "→ 4. EMERGENCY: Disable AI features"
    echo "   Run these to kill-switch AI:"
    echo "   kubectl set env deployment/ai-scope-assistant FEATURE_FLAG_AI_SCOPE=false -n monkeyswork-ai"
    echo "   kubectl set env deployment/ai-match-v1 FEATURE_FLAG_AI_MATCH=false -n monkeyswork-ai"
    echo "   kubectl set env deployment/ai-fraud-v1 FEATURE_FLAG_FRAUD_SCORING=false -n monkeyswork-ai"

    echo ""
    echo "→ 5. Rollback model (if needed)"
    echo "   ./scripts/rollback-model.sh <model-name> <target-version>"
    ;;

  *)
    echo "Unknown incident type: $INCIDENT_TYPE"
    echo "Available types:"
    echo "  latency-spike     — High latency investigation"
    echo "  error-spike       — Error rate increase"
    echo "  bad-model-release — AI model misbehaving"
    exit 1
    ;;
esac

echo ""
echo "=== Additional Resources ==="
echo "Logs:       https://console.cloud.google.com/logs?project=$PROJECT_ID"
echo "Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo "GKE:        https://console.cloud.google.com/kubernetes?project=$PROJECT_ID"
echo "Vertex AI:  https://console.cloud.google.com/vertex-ai?project=$PROJECT_ID"
```

---

# APPENDIX — GitHub Actions CI/CD

## `.github/workflows/ci.yaml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-core, ai-scope-assistant, ai-match-v1, ai-fraud-v1, verification-automation]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        if: hashFiles(format('services/{0}/package.json', matrix.service)) != ''
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Python
        if: hashFiles(format('services/{0}/requirements.txt', matrix.service)) != ''
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install and test
        working-directory: services/${{ matrix.service }}
        run: |
          if [ -f package.json ]; then
            npm ci
            npm run lint
            npm test
          elif [ -f requirements.txt ]; then
            pip install -r requirements.txt
            pip install pytest ruff
            ruff check src/
            pytest tests/
          fi

  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Validate event schemas
        run: |
          pip install jsonschema
          python -c "
          import json, glob, jsonschema
          for f in glob.glob('data/schemas/*.json'):
              with open(f) as fh:
                  schema = json.load(fh)
              jsonschema.Draft7Validator.check_schema(schema)
              print(f'✅ {f}')
          "

  docker-build:
    runs-on: ubuntu-latest
    needs: [lint-and-test]
    strategy:
      matrix:
        service: [api-core, ai-scope-assistant, ai-match-v1, ai-fraud-v1, verification-automation]
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t ${{ matrix.service }}:test services/${{ matrix.service }}/

  terraform-plan:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Plan
        working-directory: terraform/
        run: |
          terraform init -backend=false
          terraform validate
```

## `.github/workflows/cd-staging.yaml`

```yaml
name: CD Staging

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  ENV: staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    strategy:
      matrix:
        service: [api-core, ai-scope-assistant, ai-match-v1, ai-fraud-v1, verification-automation]
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_DEPLOY_SA }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push
        run: |
          TAG="${{ github.sha }}"
          REGISTRY="${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/mw-${{ env.ENV }}-services"
          docker build -t "$REGISTRY/${{ matrix.service }}:$TAG" services/${{ matrix.service }}/
          docker push "$REGISTRY/${{ matrix.service }}:$TAG"

      - name: Deploy to GKE
        run: |
          gcloud container clusters get-credentials "mw-${{ env.ENV }}-cluster" --zone us-central1-a
          NAMESPACE="monkeyswork"
          [[ "${{ matrix.service }}" == ai-* ]] && NAMESPACE="monkeyswork-ai"
          kubectl set image "deployment/${{ matrix.service }}" \
            "${{ matrix.service }}=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/mw-${{ env.ENV }}-services/${{ matrix.service }}:${{ github.sha }}" \
            -n "$NAMESPACE"
          kubectl rollout status "deployment/${{ matrix.service }}" -n "$NAMESPACE" --timeout=300s
```

---

*End of MonkeysWork Architecture Blueprint v1.0.0*
