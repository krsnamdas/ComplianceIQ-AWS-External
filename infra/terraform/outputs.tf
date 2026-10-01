output "internal_alb_dns_name" {
  description = "Private ALB DNS name (reachable inside the VPC / connected networks)"
  value       = aws_lb.internal.dns_name
}

output "internal_url" {
  description = "Friendly internal URL via the Route53 private zone"
  value       = "http://${var.internal_domain_name}/"
}

output "tavily_secret_name" {
  description = "Set the Tavily key here with: aws secretsmanager put-secret-value"
  value       = aws_secretsmanager_secret.tavily.name
}

output "efs_file_system_id" {
  description = "EFS holding persistent /app/data"
  value       = aws_efs_file_system.data.id
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}
