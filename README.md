# CloudWatch Processor

A serverless AWS Lambda function that processes logs from CloudWatch and stores them in a PostgreSQL database. Built with TypeScript, complete with testing, linting, formatting, and Terraform infrastructure as code.

## Overview

This Lambda function acts as a CloudWatch Logs subscription filter destination, automatically processing log events and storing them in a PostgreSQL database for analysis and retention.

### Key Features

- **TypeScript**: Fully typed with strict TypeScript configuration
- **Database Integration**: Stores logs in PostgreSQL with proper error handling
- **Comprehensive Testing**: Unit tests with Jest covering all major components
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Infrastructure as Code**: Terraform modules for staging and production deployments
- **Monitoring**: CloudWatch alarms and logging for production environments
- **VPC Support**: Optional VPC deployment for enhanced security

## Architecture

```
CloudWatch Logs → Subscription Filter → Lambda Function → PostgreSQL Database
```

The Lambda function:
1. Receives compressed log data from CloudWatch Logs
2. Decompresses and parses the log events
3. Inserts the logs into a PostgreSQL database
4. Handles errors gracefully with retry logic

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- AWS CLI configured with appropriate permissions
- Terraform 1.0 or higher
- PostgreSQL database (RDS recommended)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cloudwatch-processor
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Database Schema

The Lambda function automatically creates the following table structure:

```sql
CREATE TABLE IF NOT EXISTS cloudwatch_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  log_group VARCHAR(255) NOT NULL,
  log_stream VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  extracted_fields JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_timestamp ON cloudwatch_logs (timestamp);
CREATE INDEX idx_log_group ON cloudwatch_logs (log_group);
CREATE INDEX idx_created_at ON cloudwatch_logs (created_at);
```

## Configuration

### Environment Variables

The Lambda function requires the following environment variables:

- `DB_HOST`: PostgreSQL database host
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_SSL`: Enable SSL connection (true/false)

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode compilation
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run package` - Create deployment package

### Project Structure

```
src/
├── handlers/           # Lambda function handlers
├── services/          # Business logic and database services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── __tests__/         # Test files

terraform/
├── modules/           # Reusable Terraform modules
└── environments/      # Environment-specific configurations
    ├── staging/
    └── production/

scripts/               # Deployment and utility scripts
```

## Deployment

### 1. Prepare Configuration

For staging:
```bash
cd terraform/environments/staging
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
```

For production:
```bash
cd terraform/environments/production
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
```

### 2. Deploy Using Script

Deploy to staging:
```bash
./scripts/deploy.sh staging
```

Deploy to production:
```bash
./scripts/deploy.sh production
```

### 3. Manual Deployment

Build and package:
```bash
npm run build
npm run package
```

Deploy with Terraform:
```bash
cd terraform/environments/staging  # or production
terraform init
terraform plan
terraform apply
```

## Setting Up CloudWatch Logs Subscription

### Using the Script

```bash
./scripts/create-subscription-filter.sh staging /aws/lambda/my-function
```

### Manual Setup

1. Get the Lambda function ARN from Terraform outputs:
```bash
cd terraform/environments/staging
terraform output lambda_function_arn
```

2. Create subscription filter:
```bash
aws logs put-subscription-filter \
    --log-group-name "/aws/lambda/source-function" \
    --filter-name "cloudwatch-processor-filter" \
    --filter-pattern "" \
    --destination-arn "arn:aws:lambda:us-east-1:123456789012:function:cloudwatch-processor-staging"
```

## Monitoring

### CloudWatch Metrics

The Lambda function automatically publishes metrics to CloudWatch:
- **Duration**: Execution time
- **Errors**: Number of failed executions
- **Invocations**: Total number of invocations

### Production Monitoring

Production deployments include:
- CloudWatch alarms for error rates
- Enhanced logging
- VPC deployment support
- Higher memory allocation for better performance

### Logs

Lambda logs are available in CloudWatch Logs under:
- `/aws/lambda/cloudwatch-processor-staging`
- `/aws/lambda/cloudwatch-processor-production`

## Security Considerations

### IAM Permissions

The Lambda function has minimal required permissions:
- CloudWatch Logs access for reading log events
- VPC permissions if deployed in a VPC
- Basic Lambda execution permissions

### Database Security

- Use SSL connections in production (enabled by default)
- Store database credentials securely (consider AWS Secrets Manager)
- Implement proper database user permissions
- Use VPC for network isolation

### Network Security

- Deploy Lambda in private subnets when using VPC
- Use security groups to restrict database access
- Enable VPC flow logs for network monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check database connectivity from Lambda VPC
   - Verify security group rules
   - Confirm database credentials

2. **Memory/Timeout Issues**
   - Increase Lambda memory allocation
   - Optimize database connection pooling
   - Review log batch sizes

3. **Permission Errors**
   - Verify IAM role permissions
   - Check CloudWatch Logs subscription filter permissions

### Debug Logs

Enable debug logging by setting the Lambda timeout to a higher value and checking CloudWatch Logs for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite: `npm test`
6. Run linting: `npm run lint`
7. Submit a pull request

## Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test database operations with mocked connections
- **Handler Tests**: Test the main Lambda handler logic

Run tests:
```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Run in watch mode
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review CloudWatch Logs for error details
3. Open an issue in the repository with:
   - Environment details
   - Error messages
   - Steps to reproduce
