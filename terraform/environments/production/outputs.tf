output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.cloudwatch_processor.lambda_function_arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.cloudwatch_processor.lambda_function_name
}

output "lambda_role_arn" {
  description = "ARN of the IAM role for the Lambda function"
  value       = module.cloudwatch_processor.lambda_role_arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.cloudwatch_processor.cloudwatch_log_group_name
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm for Lambda errors"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
}