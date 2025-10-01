import { gunzipSync } from 'zlib';
import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { LogEvent } from '../types';

/**
 * Decompresses and parses CloudWatch Logs data from the Lambda event
 */
export function parseCloudWatchLogs(event: CloudWatchLogsEvent): LogEvent[] {
  try {
    // Decode the base64 encoded gzipped data
    const compressed = Buffer.from(event.awslogs.data, 'base64');
    const uncompressed = gunzipSync(compressed);
    const data: CloudWatchLogsDecodedData = JSON.parse(uncompressed.toString('utf8'));

    return data.logEvents.map(logEvent => ({
      id: `${data.logGroup}-${data.logStream}-${logEvent.timestamp}-${logEvent.id}`,
      timestamp: logEvent.timestamp,
      message: logEvent.message,
      logGroup: data.logGroup,
      logStream: data.logStream,
      extractedFields: logEvent.extractedFields
        ? (Object.fromEntries(
            Object.entries(logEvent.extractedFields).filter(([, value]) => value !== undefined)
          ) as Record<string, string>)
        : undefined,
    }));
  } catch (error) {
    console.error('Error parsing CloudWatch logs:', error);
    throw new Error(`Failed to parse CloudWatch logs: ${error}`);
  }
}

/**
 * Validates environment variables required for database connection
 */
export function validateEnvironment(): void {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(env => !process.env[env]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
