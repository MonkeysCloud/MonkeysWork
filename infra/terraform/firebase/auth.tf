# ── Identity Platform (Firebase Auth) ────────────────
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled            = true
      password_required  = true
    }
  }

  depends_on = [google_firebase_project.default]
}

# ── Google Sign-In Provider ──────────────────────────
resource "google_identity_platform_default_supported_idp_config" "google" {
  provider = google-beta
  project  = var.project_id
  idp_id   = "google.com"

  client_id     = "" # Set after creating OAuth client in GCP Console
  client_secret = "" # Set after creating OAuth client in GCP Console

  enabled = true

  depends_on = [google_identity_platform_config.auth]
}

# ── Apple Sign-In Provider ───────────────────────────
resource "google_identity_platform_default_supported_idp_config" "apple" {
  provider = google-beta
  project  = var.project_id
  idp_id   = "apple.com"

  client_id     = var.ios_bundle_id  # Apple Services ID
  client_secret = ""                  # Set after generating Apple private key

  enabled = true

  depends_on = [google_identity_platform_config.auth]
}
