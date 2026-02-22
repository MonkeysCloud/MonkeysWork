# ── Firestore Database ───────────────────────────────
resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.default]
}

# ── Firestore Security Rules ────────────────────────
# Only used for real-time signals (new_message, typing, etc.)
# Actual data lives in PostgreSQL via the PHP API
resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta
  project  = var.project_id

  source {
    files {
      name    = "firestore.rules"
      content = <<-EOT
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {

            // User notification signals — only the owner can read
            match /notifications/{userId}/{document=**} {
              allow read: if request.auth != null && request.auth.uid == userId;
              allow write: if false; // Only backend writes via Admin SDK
            }

            // Typing indicators — participants only
            match /typing/{conversationId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null;
            }

            // Deny everything else
            match /{document=**} {
              allow read, write: if false;
            }
          }
        }
      EOT
    }
  }

  depends_on = [google_firestore_database.default]
}

resource "google_firebaserules_release" "firestore" {
  provider     = google-beta
  project      = var.project_id
  name         = "cloud.firestore/database"
  ruleset_name = google_firebaserules_ruleset.firestore.name

  depends_on = [google_firebaserules_ruleset.firestore]
}
