# Terraform Firebase Infrastructure
terraform {
  required_version = ">= 1.5"

  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Remote state — uncomment and configure when ready
  # backend "gcs" {
  #   bucket = "monkeyswork-terraform-state"
  #   prefix = "firebase"
  # }
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

provider "google" {
  project = var.project_id
  region  = var.region
}
