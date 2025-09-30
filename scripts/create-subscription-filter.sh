#!/bin/bash
set -e

# Create CloudWatch Logs subscription filter
# Usage: ./create-subscription-filter.sh <environment> <log-group-name> [filter-pattern]

ENVIRONMENT=${1}
LOG_GROUP_NAME=${2}
FILTER_PATTERN=${3:-""}

if [[ -z "$ENVIRONMENT" || -z "$LOG_GROUP_NAME" ]]; then
    echo "Usage: $0 <environment> <log-group-name> [filter-pattern]"
    echo "Example: $0 staging /aws/lambda/my-function '[timestamp, request_id, level=ERROR, ...]'"
    exit 1
fi

echo "🔗 Creating CloudWatch Logs subscription filter..."

# Get Lambda function ARN from Terraform outputs
cd "terraform/environments/$ENVIRONMENT"
LAMBDA_ARN=$(terraform output -raw lambda_function_arn)

if [[ -z "$LAMBDA_ARN" ]]; then
    echo "❌ Error: Could not get Lambda function ARN. Is the function deployed?"
    exit 1
fi

echo "Lambda ARN: $LAMBDA_ARN"
echo "Log Group: $LOG_GROUP_NAME"
echo "Filter Pattern: $FILTER_PATTERN"

# Create subscription filter
aws logs put-subscription-filter \
    --log-group-name "$LOG_GROUP_NAME" \
    --filter-name "cloudwatch-processor-$ENVIRONMENT-filter" \
    --filter-pattern "$FILTER_PATTERN" \
    --destination-arn "$LAMBDA_ARN"

echo "✅ Subscription filter created successfully!"
echo ""
echo "📊 To verify the filter:"
echo "aws logs describe-subscription-filters --log-group-name '$LOG_GROUP_NAME'"