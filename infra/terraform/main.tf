# =============================================================================
# ComplianceIQ — PRIVATE single-instance deployment (Terraform)
# Mirrors the CDK stack: internal ALB, one Fargate task (no autoscaling),
# EFS-backed /app/data, IAM task role for Bedrock, Tavily via Secrets Manager,
# CloudWatch logs, Route53 private hosted zone.
# =============================================================================

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  # Recommended: store state in S3 + DynamoDB lock (uncomment & set once you have a bucket).
  # backend "s3" {
  #   bucket         = "my-tfstate-bucket"
  #   key            = "complianceiq/nonprod/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "ComplianceIQ"
      Environment = var.env_name
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  name = "complianceiq-${var.env_name}"
  # zone_name is the parent of the internal domain (e.g. "internal" from "complianceiq.internal")
  zone_name = join(".", slice(split(".", var.internal_domain_name), 1, length(split(".", var.internal_domain_name))))
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ---------------------------------------------------------------------------
# 1. Network — VPC with 2 private (egress) subnets + 2 isolated subnets.
#    NAT gives the task internet egress to reach Bedrock/Tavily; no inbound.
# ---------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-igw" }
}

# Public subnets exist ONLY to host the NAT gateway (no app runs here).
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${local.name}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${local.name}-private-${count.index}" }
}

resource "aws_subnet" "isolated" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${local.name}-isolated-${count.index}" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${local.name}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${local.name}-nat" }
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "${local.name}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ---------------------------------------------------------------------------
# 2. Security groups
# ---------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${local.name}-alb-sg"
  description = "Internal ALB SG — HTTP from within the VPC only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from within VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name}-alb-sg" }
}

resource "aws_security_group" "task" {
  name        = "${local.name}-task-sg"
  description = "Fargate task SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "ALB to task on 3000"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name}-task-sg" }
}

resource "aws_security_group" "efs" {
  name        = "${local.name}-efs-sg"
  description = "EFS SG — NFS from the task"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "NFS from task"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.task.id]
  }
  tags = { Name = "${local.name}-efs-sg" }
}

# ---------------------------------------------------------------------------
# 3. Secrets Manager — Tavily API key (value set out-of-band, not in code).
# ---------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "tavily" {
  name        = "complianceiq/${var.env_name}/tavily-api-key"
  description = "Tavily Search API key for ComplianceIQ"
}

# ---------------------------------------------------------------------------
# 4. EFS — persistent /app/data with an access point + daily backups.
# ---------------------------------------------------------------------------
resource "aws_efs_file_system" "data" {
  encrypted = true
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  tags = { Name = "${local.name}-data" }
}

resource "aws_efs_mount_target" "data" {
  count           = 2
  file_system_id  = aws_efs_file_system.data.id
  subnet_id       = aws_subnet.isolated[count.index].id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "data" {
  file_system_id = aws_efs_file_system.data.id
  posix_user {
    gid = 1000
    uid = 1000
  }
  root_directory {
    path = "/data"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "750"
    }
  }
  tags = { Name = "${local.name}-data-ap" }
}

resource "aws_efs_backup_policy" "data" {
  file_system_id = aws_efs_file_system.data.id
  backup_policy {
    status = "ENABLED"
  }
}

# ---------------------------------------------------------------------------
# 5. IAM roles — execution role (pull image + logs) and task role (Bedrock).
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.name}-exec-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Execution role must read the Tavily secret to inject it at container start.
resource "aws_iam_role_policy" "execution_secrets" {
  name = "${local.name}-exec-secrets"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.tavily.arn]
    }]
  })
}

resource "aws_iam_role" "task" {
  name               = "${local.name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# Least-privilege runtime permissions: Bedrock invoke only.
resource "aws_iam_role_policy" "task_bedrock" {
  name = "${local.name}-task-bedrock"
  role = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "BedrockInvoke"
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
      Resource = ["*"]
    }]
  })
}

# ---------------------------------------------------------------------------
# 6. CloudWatch Logs
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "app" {
  name              = "/complianceiq/${var.env_name}"
  retention_in_days = 30
}

# ---------------------------------------------------------------------------
# 7. ECS cluster, task definition, service (single task, no autoscaling)
# ---------------------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory_mib
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  volume {
    name = "data"
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.data.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.data.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([{
    name         = "app"
    image        = var.image_uri
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" },
      { name = "REGION", value = "menat" },
      { name = "DATA_DIR", value = "/app/data" },
      { name = "BEDROCK_MODEL_ID", value = var.bedrock_model_id },
      { name = "AWS_REGION", value = var.aws_region }
    ]
    secrets = [
      { name = "TAVILY_API_KEY", valueFrom = aws_secretsmanager_secret.tavily.arn }
    ]
    mountPoints = [{ sourceVolume = "data", containerPath = "/app/data", readOnly = false }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "app"
      }
    }
  }])
}

resource "aws_lb" "internal" {
  name               = "${local.name}-alb"
  internal           = true # <-- PRIVATE / internal, no public access
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.private[*].id
  tags               = { Name = "${local.name}-alb" }
}

resource "aws_lb_target_group" "app" {
  name        = "${local.name}-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  deregistration_delay = 15
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_ecs_service" "app" {
  name            = "${local.name}-svc"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1 # single instance — NO autoscaling this phase
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.http, aws_efs_mount_target.data]
}

# ---------------------------------------------------------------------------
# 8. Route53 private hosted zone → friendly internal hostname
# ---------------------------------------------------------------------------
resource "aws_route53_zone" "private" {
  name = local.zone_name
  vpc {
    vpc_id = aws_vpc.main.id
  }
}

resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.private.zone_id
  name    = var.internal_domain_name
  type    = "A"
  alias {
    name                   = aws_lb.internal.dns_name
    zone_id                = aws_lb.internal.zone_id
    evaluate_target_health = true
  }
}
