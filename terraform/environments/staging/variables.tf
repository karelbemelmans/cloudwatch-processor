variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "cloudwatch-processor"
}

# Database variables
variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_ssl" {
  description = "Enable SSL for database connection"
  type        = bool
  default     = true
}

# VPC variables
variable "vpc_subnet_ids" {
  description = "VPC subnet IDs for Lambda function"
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "VPC security group IDs for Lambda function"
  type        = list(string)
  default     = []
}

# CloudWatch Logs subscription filter variables
variable "enable_subscription_filter" {
  description = "Enable CloudWatch Logs subscription filter"
  type        = bool
  default     = false
}

variable "source_log_group_name" {
  description = "Source CloudWatch log group name to subscribe to"
  type        = string
  default     = ""
}

variable "log_filter_pattern" {
  description = "CloudWatch Logs filter pattern"
  type        = string
  default     = ""
}