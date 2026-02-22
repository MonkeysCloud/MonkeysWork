# ── Firebase Project ──────────────────────────────────
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

# ── iOS App ──────────────────────────────────────────
resource "google_firebase_apple_app" "ios" {
  provider     = google-beta
  project      = var.project_id
  display_name = "MonkeysWork iOS"
  bundle_id    = var.ios_bundle_id
  app_store_id = var.ios_app_store_id != "" ? var.ios_app_store_id : null

  depends_on = [google_firebase_project.default]
}

# Download the iOS config file
data "google_firebase_apple_app_config" "ios" {
  provider   = google-beta
  project    = var.project_id
  app_id     = google_firebase_apple_app.ios.app_id

  depends_on = [google_firebase_apple_app.ios]
}

resource "local_file" "google_service_info_plist" {
  filename = "${path.module}/output/GoogleService-Info.plist"
  content  = data.google_firebase_apple_app_config.ios.config_file_contents
}

# ── Android App ──────────────────────────────────────
resource "google_firebase_android_app" "android" {
  provider     = google-beta
  project      = var.project_id
  display_name = "MonkeysWork Android"
  package_name = var.android_package_name

  depends_on = [google_firebase_project.default]
}

# Download the Android config file
data "google_firebase_android_app_config" "android" {
  provider   = google-beta
  project    = var.project_id
  app_id     = google_firebase_android_app.android.app_id

  depends_on = [google_firebase_android_app.android]
}

resource "local_file" "google_services_json" {
  filename = "${path.module}/output/google-services.json"
  content  = data.google_firebase_android_app_config.android.config_file_contents
}
