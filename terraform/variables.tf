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

variable "domain" {
  description = "Primary domain for the application"
  type        = string
  default     = "monkeyswork.com"
}

variable "enable_vertex_ai" {
  description = "Whether to provision Vertex AI resources"
  type        = bool
  default     = true
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format for WIF binding"
  type        = string
  default     = "MonkeysCloud/MonkeysWork"
}

variable "redis_memory_gb" {
  description = "Memorystore Redis instance size in GB"
  type        = number
  default     = 1
}

variable "jwt_secret" {
  description = "JWT signing secret for socket-server auth"
  type        = string
  sensitive   = true
}
