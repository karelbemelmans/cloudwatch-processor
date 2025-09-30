# CloudWatch Processor Database Schema

This document describes the database schema used by the CloudWatch Processor Lambda function.

## Table: cloudwatch_logs

This table stores all processed CloudWatch log events.

### Schema

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
```

### Indexes

```sql
CREATE INDEX idx_timestamp ON cloudwatch_logs (timestamp);
CREATE INDEX idx_log_group ON cloudwatch_logs (log_group);
CREATE INDEX idx_created_at ON cloudwatch_logs (created_at);
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(255) | Unique identifier composed of log group, stream, timestamp, and event ID |
| `timestamp` | BIGINT | Unix timestamp of the log event in milliseconds |
| `log_group` | VARCHAR(255) | CloudWatch Log Group name |
| `log_stream` | VARCHAR(255) | CloudWatch Log Stream name |
| `message` | TEXT | The actual log message content |
| `extracted_fields` | JSONB | JSON object containing extracted fields from structured logs |
| `created_at` | TIMESTAMP | When the record was inserted into the database |

### Sample Queries

#### Find logs by time range
```sql
SELECT * FROM cloudwatch_logs 
WHERE timestamp BETWEEN 1704067200000 AND 1704153600000
ORDER BY timestamp DESC;
```

#### Find logs by log group
```sql
SELECT * FROM cloudwatch_logs 
WHERE log_group = '/aws/lambda/my-function'
ORDER BY timestamp DESC
LIMIT 100;
```

#### Search log messages
```sql
SELECT * FROM cloudwatch_logs 
WHERE message ILIKE '%error%'
ORDER BY timestamp DESC;
```

#### Query extracted fields (for structured logs)
```sql
SELECT * FROM cloudwatch_logs 
WHERE extracted_fields->>'level' = 'ERROR'
ORDER BY timestamp DESC;
```

### Performance Considerations

- The `timestamp` index enables efficient time-range queries
- The `log_group` index allows fast filtering by log source
- Consider partitioning by date for very large datasets
- Regular cleanup of old logs may be needed based on retention requirements

### Data Retention

Consider implementing a data retention policy:

```sql
-- Delete logs older than 90 days
DELETE FROM cloudwatch_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

Or use a scheduled job to archive old data to a cheaper storage solution.