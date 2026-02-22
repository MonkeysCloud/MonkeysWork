# ── Cloud Storage Bucket ─────────────────────────────
resource "google_storage_bucket" "app_storage" {
  provider      = google-beta
  project       = var.project_id
  name          = "${var.project_id}-app-storage"
  location      = var.storage_location
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["Content-Type", "Content-Disposition"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  depends_on = [google_firebase_project.default]
}

# ── Firebase Storage Rules ───────────────────────────
resource "google_firebaserules_ruleset" "storage" {
  provider = google-beta
  project  = var.project_id

  source {
    files {
      name    = "storage.rules"
      content = <<-EOT
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {

            // User uploads (avatars, attachments)
            match /users/{userId}/{allPaths=**} {
              allow read: if request.auth != null;
              allow write: if request.auth != null
                           && request.auth.uid == userId
                           && request.resource.size < 10 * 1024 * 1024; // 10MB max
            }

            // Message attachments
            match /conversations/{conversationId}/{allPaths=**} {
              allow read: if request.auth != null;
              allow write: if request.auth != null
                           && request.resource.size < 25 * 1024 * 1024; // 25MB max
            }

            // Generated reports (PDFs) — read-only for users
            match /reports/{userId}/{allPaths=**} {
              allow read: if request.auth != null && request.auth.uid == userId;
              allow write: if false; // Only backend writes
            }

            // Deny everything else
            match /{allPaths=**} {
              allow read, write: if false;
            }
          }
        }
      EOT
    }
  }

  depends_on = [google_storage_bucket.app_storage]
}

resource "google_firebaserules_release" "storage" {
  provider     = google-beta
  project      = var.project_id
  name         = "firebase.storage/${google_storage_bucket.app_storage.name}"
  ruleset_name = google_firebaserules_ruleset.storage.name

  depends_on = [google_firebaserules_ruleset.storage]
}
