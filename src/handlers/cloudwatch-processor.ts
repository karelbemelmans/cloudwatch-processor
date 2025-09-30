import { CloudWatchLogsEvent, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { parseCloudWatchLogs, validateEnvironment } from '../utils';
import { DatabaseConfig } from '../types';

// Define result type locally since it's not exported from aws-lambda
interface CloudWatchLogsResult {
  requestId: string;
  timestamp: number;
  message: string;
}

let dbService: DatabaseService | null = null;

/**
 * Initialize database service (singleton pattern for connection reuse)
 */
function initializeDatabaseService(): DatabaseService {
  if (!dbService) {
    validateEnvironment();

    const config: DatabaseConfig = {
      host: process.env['DB_HOST']!,
      port: parseInt(process.env['DB_PORT']!, 10),
      database: process.env['DB_NAME']!,
      username: process.env['DB_USER']!,
      password: process.env['DB_PASSWORD']!,
      ssl: process.env['DB_SSL'] === 'true',
    };

    dbService = new DatabaseService(config);
  }
  return dbService;
}

// Exported for testing - allows clearing the singleton
export function _clearDatabaseService(): void {
  dbService = null;
}

/**
 * AWS Lambda handler for processing CloudWatch logs
 */
export const handler = async (
  event: CloudWatchLogsEvent,
  context: Context
): Promise<CloudWatchLogsResult> => {
  console.log('Processing CloudWatch logs event');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Initialize database service
    const db = initializeDatabaseService();

    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Initialize database schema
    await db.initialize();

    // Parse CloudWatch logs from the event
    const logEvents = parseCloudWatchLogs(event);
    console.log(`Parsed ${logEvents.length} log events`);

    // Insert log events into database
    const result = await db.insertLogEvents(logEvents);

    console.log('Processing result:', result);

    if (!result.success) {
      console.error('Some errors occurred during processing:', result.errors);
      // Don't throw error to avoid infinite retries, just log the errors
    }

    return {
      requestId: context.awsRequestId,
      timestamp: Date.now(),
      message: `Successfully processed ${result.processedCount} out of ${logEvents.length} log events`,
    };
  } catch (error) {
    console.error('Error processing CloudWatch logs:', error);

    // Return error response to trigger retry
    throw new Error(`Failed to process CloudWatch logs: ${error}`);
  }
};
