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
  #   key    = "cloudwatch-processor/production/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CloudWatch Processor"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

module "cloudwatch_processor" {
  source = "../../modules/lambda-cloudwatch-processor"

  environment  = "production"
  function_name = var.function_name

  # Database configuration
  db_host     = var.db_host
  db_port     = var.db_port
  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
  db_ssl      = var.db_ssl

  # Lambda configuration - higher resources for production
  memory_size = 512
  timeout     = 300

  # VPC configuration (if needed)
  vpc_subnet_ids         = var.vpc_subnet_ids
  vpc_security_group_ids = var.vpc_security_group_ids

  tags = {
    Environment = "production"
    Owner       = "DevOps Team"
    CriticalApp = "true"
  }
}

# Example CloudWatch Logs subscription filter
resource "aws_cloudwatch_log_subscription_filter" "lambda_logs_filter" {
  count           = var.enable_subscription_filter ? 1 : 0
  name            = "cloudwatch-processor-production-filter"
  log_group_name  = var.source_log_group_name
  filter_pattern  = var.log_filter_pattern
  destination_arn = module.cloudwatch_processor.lambda_function_arn

  depends_on = [
    module.cloudwatch_processor
  ]
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.function_name}-production-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = var.alarm_notification_arns

  dimensions = {
    FunctionName = module.cloudwatch_processor.lambda_function_name
  }

  tags = {
    Environment = "production"
  }
}