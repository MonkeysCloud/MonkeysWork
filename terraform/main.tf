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
    "vpcaccess.googleapis.com",
    "redis.googleapis.com",
    "dns.googleapis.com",
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
  name                     = "mw-${var.environment}-services-subnet"
  ip_cidr_range            = "10.1.0.0/20"
  region                   = var.region
  network                  = google_compute_network.main.id
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

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = "mw-${var.environment}-connector"
  region        = var.region
  ip_cidr_range = "10.2.0.0/28"
  network       = google_compute_network.main.name
  depends_on    = [google_project_service.apis]
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

# Firewall — allow internal
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

# Firewall — allow health checks from GCP LB
resource "google_compute_firewall" "allow_health_checks" {
  name    = "mw-${var.environment}-allow-health-checks"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["8080", "80", "443"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["gke-node"]
}

# ─────────────────────────────────────────────────────
# 3. GKE CLUSTER
# ─────────────────────────────────────────────────────
resource "google_container_cluster" "primary" {
  provider = google-beta
  name     = "mw-${var.environment}-cluster"
  location = var.zone

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

# Default node pool
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
    tags         = ["gke-node"]

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

# AI workload node pool
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
    tags         = ["gke-node", "ai-workload"]

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
    # Legacy aggregate topics (kept for future fan-out / analytics)
    "job-events"          = "Job lifecycle events"
    "proposal-events"     = "Proposal lifecycle events"
    "milestone-events"    = "Milestone lifecycle events"
    "verification-events" = "Verification status changes"
    "fraud-events"        = "Fraud scoring events"
    "match-events"        = "Match engine results"
    "audit-events"        = "All decision audit logs"
    "notification-events" = "User notification triggers"

    # AI service event topics (match code publishers)
    "user-registered"        = "User registration events — triggers fraud baseline + verification"
    "verification-submitted" = "Verification document submitted — triggers automation"
    "proposal-submitted"     = "Proposal submitted — triggers fraud + match analysis"
    "job-published"          = "Job published — triggers scope + match analysis"
    "profile-ready"          = "Freelancer profile ready — triggers embedding + re-rank"
  }

  subscriptions = {
    # Legacy subscriptions (kept for backward compat)
    "ai-scope-on-job-created"        = { topic = "job-events", filter = "attributes.event_type = \"job_created\"" }
    "ai-match-on-job-created"        = { topic = "job-events", filter = "attributes.event_type = \"job_created\"" }
    "ai-fraud-on-proposal-submitted" = { topic = "proposal-events", filter = "attributes.event_type = \"proposal_submitted\"" }
    "ai-fraud-on-account-activity"   = { topic = "fraud-events", filter = "" }
    "verification-on-status-change"  = { topic = "verification-events", filter = "" }
    "notification-dispatcher"        = { topic = "notification-events", filter = "" }
    "audit-sink"                     = { topic = "audit-events", filter = "" }

    # AI service subscriptions (match code subscribers)
    "user-registered-fraud"          = { topic = "user-registered", filter = "" }
    "user-registered-verification"   = { topic = "user-registered", filter = "" }
    "verification-submitted-auto"    = { topic = "verification-submitted", filter = "" }
    "proposal-submitted-fraud"       = { topic = "proposal-submitted", filter = "" }
    "job-published-match"            = { topic = "job-published", filter = "" }
    "job-published-scope"            = { topic = "job-published", filter = "" }
    "profile-ready-match"            = { topic = "profile-ready", filter = "" }
    "job-published-moderation"       = { topic = "job-published", filter = "" }
  }
}

resource "google_pubsub_topic" "topics" {
  for_each = local.pubsub_topics
  name     = "mw-${var.environment}-${each.key}"

  message_retention_duration = "604800s"

  labels = {
    environment = var.environment
  }
}

resource "google_pubsub_topic" "dead_letter" {
  name = "mw-${var.environment}-dead-letter"
}

resource "google_pubsub_subscription" "dead_letter" {
  name  = "mw-${var.environment}-dead-letter-sub"
  topic = google_pubsub_topic.dead_letter.id

  message_retention_duration = "1209600s" # 14 days
  retain_acked_messages      = true

  expiration_policy {
    ttl = ""
  }
}

resource "google_pubsub_subscription" "subs" {
  for_each = local.subscriptions
  name     = "mw-${var.environment}-${each.key}"
  topic    = google_pubsub_topic.topics[each.value.topic].id

  ack_deadline_seconds       = 60
  message_retention_duration = "604800s"
  retain_acked_messages      = false

  expiration_policy {
    ttl = ""
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
# 7. IAM — Service Accounts + Bindings
# ─────────────────────────────────────────────────────
locals {
  service_accounts = {
    "api-core"         = "MonkeysWork API Core"
    "ai-scope"         = "MonkeysWork AI Scope Assistant"
    "ai-match"         = "MonkeysWork AI Match Engine"
    "ai-fraud"         = "MonkeysWork AI Fraud Service"
    "verification"     = "MonkeysWork Verification"
    "vertex-pipe"      = "MonkeysWork Vertex Pipelines"
    "github-deploy"    = "MonkeysWork GitHub Actions Deploy"
    "github-terraform" = "MonkeysWork GitHub Actions Terraform"
  }
}

resource "google_service_account" "services" {
  for_each     = local.service_accounts
  account_id   = "mw-${var.environment}-${each.key}"
  display_name = "${each.value} (${var.environment})"
}

# Workload Identity bindings
resource "google_service_account_iam_binding" "api_core_wi" {
  service_account_id = google_service_account.services["api-core"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/api-core]",
  ]
  depends_on = [google_container_cluster.primary]
}

resource "google_service_account_iam_binding" "ai_scope_wi" {
  service_account_id = google_service_account.services["ai-scope"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork-ai/ai-scope-assistant]",
  ]
  depends_on = [google_container_cluster.primary]
}

resource "google_service_account_iam_binding" "ai_match_wi" {
  service_account_id = google_service_account.services["ai-match"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork-ai/ai-match-v1]",
  ]
  depends_on = [google_container_cluster.primary]
}

resource "google_service_account_iam_binding" "ai_fraud_wi" {
  service_account_id = google_service_account.services["ai-fraud"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork-ai/ai-fraud-v1]",
  ]
  depends_on = [google_container_cluster.primary]
}

resource "google_service_account_iam_binding" "verification_wi" {
  service_account_id = google_service_account.services["verification"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monkeyswork/verification-automation]",
  ]
  depends_on = [google_container_cluster.primary]
}

# Role bindings
resource "google_project_iam_member" "api_core_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.services["api-core"].email}"
}

resource "google_project_iam_member" "api_core_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.services["api-core"].email}"
}

resource "google_project_iam_member" "api_core_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.services["api-core"].email}"
}

resource "google_project_iam_member" "ai_scope_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.services["ai-scope"].email}"
}

resource "google_project_iam_member" "ai_scope_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.services["ai-scope"].email}"
}

resource "google_project_iam_member" "ai_match_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.services["ai-match"].email}"
}

resource "google_project_iam_member" "ai_match_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.services["ai-match"].email}"
}

resource "google_project_iam_member" "ai_fraud_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.services["ai-fraud"].email}"
}

resource "google_project_iam_member" "ai_fraud_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.services["ai-fraud"].email}"
}

resource "google_project_iam_member" "vertex_pipelines_ai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.services["vertex-pipe"].email}"
}

resource "google_project_iam_member" "vertex_pipelines_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.services["vertex-pipe"].email}"
}

resource "google_project_iam_member" "verification_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.services["verification"].email}"
}

resource "google_project_iam_member" "verification_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.services["verification"].email}"
}

resource "google_project_iam_member" "verification_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.services["verification"].email}"
}

# GitHub Actions — Workload Identity Federation
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "mw-${var.environment}-github-pool"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_binding" "github_deploy_wi" {
  service_account_id = google_service_account.services["github-deploy"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}",
  ]
}

resource "google_service_account_iam_binding" "github_terraform_wi" {
  service_account_id = google_service_account.services["github-terraform"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}",
  ]
}

resource "google_service_account_iam_binding" "github_vertex_wi" {
  service_account_id = google_service_account.services["vertex-pipe"].name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}",
  ]
}

resource "google_project_iam_member" "github_deploy_gke" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.services["github-deploy"].email}"
}

resource "google_project_iam_member" "github_deploy_ar" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.services["github-deploy"].email}"
}

resource "google_project_iam_member" "github_terraform_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.services["github-terraform"].email}"
}

resource "google_project_iam_member" "github_terraform_iam" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.services["github-terraform"].email}"
}

# ─────────────────────────────────────────────────────
# 8. STORAGE — GCS Buckets
# ─────────────────────────────────────────────────────
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
      age = var.environment == "prod" ? 365 : 90
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "uploads" {
  name          = "mw-${var.environment}-uploads-monkeyswork"
  location      = var.region
  force_destroy = var.environment != "prod"

  uniform_bucket_level_access = true

  cors {
    origin          = var.environment == "prod" ? ["https://${var.domain}"] : ["*"]
    method          = ["GET", "PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_member" "api_core_uploads" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.services["api-core"].email}"
}

# Public read access so files can be served as CDN URLs
resource "google_storage_bucket_iam_member" "uploads_public_read" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "vertex_ml_artifacts" {
  bucket = google_storage_bucket.ml_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.services["vertex-pipe"].email}"
}

# ─────────────────────────────────────────────────────
# 9. STATIC IP + CLOUD DNS
# ─────────────────────────────────────────────────────
resource "google_compute_global_address" "ingress" {
  name    = "mw-${var.environment}-ingress-ip"
  project = var.project_id
}

resource "google_dns_managed_zone" "main" {
  name        = "mw-${var.environment}-zone"
  dns_name    = "${var.domain}."
  description = "MonkeysWork ${var.environment} DNS zone"
  project     = var.project_id
  depends_on  = [google_project_service.apis]
}

resource "google_dns_record_set" "root" {
  managed_zone = google_dns_managed_zone.main.name
  name         = "${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress.address]
}

resource "google_dns_record_set" "www" {
  managed_zone = google_dns_managed_zone.main.name
  name         = "www.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress.address]
}

resource "google_dns_record_set" "api" {
  managed_zone = google_dns_managed_zone.main.name
  name         = "api.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress.address]
}

resource "google_dns_record_set" "ws" {
  managed_zone = google_dns_managed_zone.main.name
  name         = "ws.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress.address]
}

# ─────────────────────────────────────────────────────
# 10. SECRET MANAGER
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

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "mw-${var.environment}-jwt-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "internal_api_token" {
  secret_id = "mw-${var.environment}-internal-api-token"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "internal_api_token" {
  secret      = google_secret_manager_secret.internal_api_token.id
  secret_data = var.internal_api_token
}

# ─────────────────────────────────────────────────────
# 10. MONITORING — Alert Policies
# ─────────────────────────────────────────────────────
resource "google_monitoring_notification_channel" "email" {
  display_name = "MonkeysWork Alerts (${var.environment})"
  type         = "email"

  labels = {
    email_address = "alerts@monkeysworks.com"
  }
}

resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "[${var.environment}] High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 1%"

    condition_threshold {
      filter          = "resource.type = \"k8s_container\" AND metric.type = \"logging.googleapis.com/log_entry_count\" AND metric.labels.severity = \"ERROR\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "pod_restarts" {
  display_name = "[${var.environment}] Excessive Pod Restarts"
  combiner     = "OR"

  conditions {
    display_name = "Pod restarts > 3/hour"

    condition_threshold {
      filter          = "resource.type = \"k8s_container\" AND metric.type = \"kubernetes.io/container/restart_count\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 3

      aggregations {
        alignment_period   = "3600s"
        per_series_aligner = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# ─────────────────────────────────────────────────────
# 11. MEMORYSTORE — Redis
# ─────────────────────────────────────────────────────
resource "google_redis_instance" "main" {
  name           = "mw-${var.environment}-redis"
  tier           = var.environment == "prod" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.redis_memory_gb
  region         = var.region
  location_id    = var.zone

  redis_version = "REDIS_7_0"

  authorized_network = google_compute_network.main.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  labels = {
    environment = var.environment
  }

  depends_on = [
    google_project_service.apis,
    google_service_networking_connection.private_vpc,
  ]
}

# ─────────────────────────────────────────────────────
# 12. KUBERNETES SECRETS — Redis + JWT for socket-server
# ─────────────────────────────────────────────────────
resource "kubernetes_secret_v1" "redis_credentials" {
  metadata {
    name      = "redis-credentials"
    namespace = "monkeyswork"
  }

  data = {
    url = "redis://${google_redis_instance.main.host}:${google_redis_instance.main.port}"
  }

  depends_on = [google_container_cluster.primary]
}

resource "kubernetes_secret_v1" "jwt_secret" {
  metadata {
    name      = "jwt-secret"
    namespace = "monkeyswork"
  }

  data = {
    secret = var.jwt_secret
  }

  depends_on = [google_container_cluster.primary]
}

# ─────────────────────────────────────────────────────
# 13. KUBERNETES — AI Service Namespace + Secrets
# ─────────────────────────────────────────────────────
resource "kubernetes_namespace_v1" "ai" {
  metadata {
    name = "monkeyswork-ai"

    labels = {
      environment = var.environment
      managed-by  = "terraform"
    }
  }

  depends_on = [google_container_cluster.primary]
}

resource "kubernetes_secret_v1" "internal_api_token_ai" {
  metadata {
    name      = "internal-api-token"
    namespace = "monkeyswork-ai"
  }

  data = {
    token = var.internal_api_token
  }

  depends_on = [kubernetes_namespace_v1.ai]
}

resource "kubernetes_secret_v1" "internal_api_token_main" {
  metadata {
    name      = "internal-api-token"
    namespace = "monkeyswork"
  }

  data = {
    token = var.internal_api_token
  }

  depends_on = [google_container_cluster.primary]
}
