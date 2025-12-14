# 1. Artifact Registry for Frontend
resource "google_artifact_registry_repository" "frontend_repo" {
  location      = var.region
  repository_id = "sira-frontend-repo"
  description   = "Docker repository for SIRA Frontend"
  format        = "DOCKER"
}

# 2. Cloud Run Service for Frontend
resource "google_cloud_run_service" "frontend" {
  name     = var.frontend_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/sira-frontend-repo/${var.frontend_service_name}:latest"
        
        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }
        
        ports {
          container_port = 8080 # Cloud Run always listens on 8080
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# 3. Public Access (CRITICAL: Allows anyone to see your website)
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.frontend.location
  project     = google_cloud_run_service.frontend.project
  service     = google_cloud_run_service.frontend.name
  policy_data = data.google_iam_policy.noauth.policy_data
}