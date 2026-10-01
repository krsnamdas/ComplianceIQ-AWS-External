variable "env_name" {
  description = "Environment name (e.g. nonprod, prod). Used to namespace resources."
  type        = string
  default     = "nonprod"
}

variable "aws_region" {
  description = "AWS region to deploy into and for the app to call Bedrock."
  type        = string
  default     = "us-east-1"
}

variable "image_uri" {
  description = "Full ECR image URI, e.g. <acct>.dkr.ecr.us-east-1.amazonaws.com/complianceiq:latest"
  type        = string
}

variable "internal_domain_name" {
  description = "Friendly internal hostname to reach the app, e.g. complianceiq.internal"
  type        = string
  default     = "complianceiq.internal"
}

variable "bedrock_model_id" {
  description = "Bedrock model id the app invokes."
  type        = string
  default     = "amazon.nova-pro-v1:0"
}

variable "cpu" {
  description = "Fargate task CPU units (256, 512, 1024, ...)."
  type        = number
  default     = 512
}

variable "memory_mib" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 1024
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.42.0.0/16"
}
