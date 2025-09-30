#!/bin/bash
set -e

# Build and deploy CloudWatch Processor Lambda function
# Usage: ./deploy.sh <environment> [options]
# Environment: staging | production

ENVIRONMENT=${1:-staging}
SKIP_BUILD=${2:-false}

echo "🚀 Deploying CloudWatch Processor to $ENVIRONMENT environment"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed." >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "❌ terraform is required but not installed." >&2; exit 1; }

# Build the application
if [[ "$SKIP_BUILD" != "true" ]]; then
    echo "🔨 Building application..."
    npm ci
    npm run build
    npm run test
    npm run lint
    
    echo "📦 Creating deployment package..."
    npm run package
else
    echo "⏭️  Skipping build step"
fi

# Check if deployment package exists
if [[ ! -f "lambda-deployment.zip" ]]; then
    echo "❌ Error: lambda-deployment.zip not found. Run build first."
    exit 1
fi

# Deploy with Terraform
echo "🏗️  Deploying infrastructure with Terraform..."
cd "terraform/environments/$ENVIRONMENT"

# Check if terraform.tfvars exists
if [[ ! -f "terraform.tfvars" ]]; then
    echo "⚠️  Warning: terraform.tfvars not found. Copy from terraform.tfvars.example and configure."
    echo "   cp terraform.tfvars.example terraform.tfvars"
    exit 1
fi

# Initialize Terraform
terraform init

# Plan deployment
echo "📋 Planning deployment..."
terraform plan -out=tfplan

# Apply deployment
echo "🚀 Applying deployment..."
terraform apply tfplan

# Clean up plan file
rm -f tfplan

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Display outputs
echo ""
echo "📊 Deployment outputs:"
terraform output