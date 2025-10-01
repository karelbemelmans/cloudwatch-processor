terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure for remote state storage
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "cloudwatch-processor/staging/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CloudWatch Processor"
      Environment = "staging"
      ManagedBy   = "Terraform"
    }
  }
}

module "cloudwatch_processor" {
  source = "../../modules/lambda-cloudwatch-processor"

  environment  = "staging"
  function_name = var.function_name

  # Database configuration
  db_host     = var.db_host
  db_port     = var.db_port
  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
  db_ssl      = var.db_ssl

  # Lambda configuration
  memory_size = 256
  timeout     = 300

  # VPC configuration (if needed)
  vpc_subnet_ids         = var.vpc_subnet_ids
  vpc_security_group_ids = var.vpc_security_group_ids

  tags = {
    Environment = "staging"
    Owner       = "DevOps Team"
  }
}

# Example CloudWatch Logs subscription filter
resource "aws_cloudwatch_log_subscription_filter" "lambda_logs_filter" {
  count           = var.enable_subscription_filter ? 1 : 0
  name            = "cloudwatch-processor-staging-filter"
  log_group_name  = var.source_log_group_name
  filter_pattern  = var.log_filter_pattern
  destination_arn = module.cloudwatch_processor.lambda_function_arn

  depends_on = [
    module.cloudwatch_processor
  ]
}