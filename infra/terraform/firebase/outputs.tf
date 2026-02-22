# ── Outputs ──────────────────────────────────────────

output "firebase_project_id" {
  description = "Firebase project ID"
  value       = google_firebase_project.default.project
}

output "ios_app_id" {
  description = "Firebase iOS app ID"
  value       = google_firebase_apple_app.ios.app_id
}

output "android_app_id" {
  description = "Firebase Android app ID"
  value       = google_firebase_android_app.android.app_id
}

output "storage_bucket" {
  description = "Cloud Storage bucket name"
  value       = google_storage_bucket.app_storage.name
}

output "ios_config_path" {
  description = "Path to GoogleService-Info.plist"
  value       = local_file.google_service_info_plist.filename
}

output "android_config_path" {
  description = "Path to google-services.json"
  value       = local_file.google_services_json.filename
}
