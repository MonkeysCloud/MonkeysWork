output "gke_cluster_name" {
  value = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "cloudsql_instance_connection" {
  value = google_sql_database_instance.postgres.connection_name
}

output "cloudsql_private_ip" {
  value = google_sql_database_instance.postgres.private_ip_address
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.services.repository_id}"
}

output "ml_artifacts_bucket" {
  value = google_storage_bucket.ml_artifacts.name
}

output "uploads_bucket" {
  value = google_storage_bucket.uploads.name
}

output "vpc_network_id" {
  value = google_compute_network.main.id
}

output "vpc_connector_name" {
  value = google_vpc_access_connector.connector.name
}

output "pubsub_topics" {
  value = { for k, v in google_pubsub_topic.topics : k => v.id }
}

output "service_accounts" {
  value = { for k, v in google_service_account.services : k => v.email }
}

output "wif_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "github_deploy_sa_email" {
  description = "GitHub secret: GCP_DEPLOY_SA"
  value       = google_service_account.services["github-deploy"].email
}

output "github_terraform_sa_email" {
  description = "GitHub secret: GCP_TERRAFORM_SA"
  value       = google_service_account.services["github-terraform"].email
}

output "github_vertex_sa_email" {
  description = "GitHub secret: GCP_VERTEX_SA"
  value       = google_service_account.services["vertex-pipe"].email
}

output "redis_host" {
  description = "Memorystore Redis private IP"
  value       = google_redis_instance.main.host
}

output "redis_port" {
  description = "Memorystore Redis port"
  value       = google_redis_instance.main.port
}

output "ingress_ip" {
  description = "Static IP for the Ingress load balancer — use for DNS A records"
  value       = google_compute_global_address.ingress.address
}

output "dns_nameservers" {
  description = "Cloud DNS nameservers — set these at your domain registrar"
  value       = google_dns_managed_zone.main.name_servers
}
