# Lambda CloudWatch Processor Module

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "cloudwatch-processor"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda deployment package"
  type        = string
  default     = "../../lambda-deployment.zip"
}

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

variable "memory_size" {
  description = "Amount of memory in MB your Lambda Function can use at runtime"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Amount of time your Lambda Function has to run in seconds"
  type        = number
  default     = 300
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}