variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "ios_bundle_id" {
  description = "iOS app bundle identifier"
  type        = string
  default     = "com.monkeyswork.app"
}

variable "android_package_name" {
  description = "Android app package name"
  type        = string
  default     = "com.monkeyswork.app"
}

variable "ios_app_store_id" {
  description = "Apple App Store ID (optional, set after first submission)"
  type        = string
  default     = ""
}

variable "firestore_location" {
  description = "Firestore database location"
  type        = string
  default     = "nam5"  # US multi-region
}

variable "storage_location" {
  description = "Cloud Storage bucket location"
  type        = string
  default     = "US"
}
