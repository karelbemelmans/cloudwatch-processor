import { Pool } from 'pg';
import { DatabaseConfig, LogEvent, ProcessingResult } from '../types';

export class DatabaseService {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Initialize the database table if it doesn't exist
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS cloudwatch_logs (
          id VARCHAR(255) PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          log_group VARCHAR(255) NOT NULL,
          log_stream VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          extracted_fields JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes if they don't exist
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_timestamp ON cloudwatch_logs (timestamp)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_log_group ON cloudwatch_logs (log_group)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_created_at ON cloudwatch_logs (created_at)
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Insert log events into the database
   */
  async insertLogEvents(logEvents: LogEvent[]): Promise<ProcessingResult> {
    if (logEvents.length === 0) {
      return { success: true, processedCount: 0, errors: [] };
    }

    const client = await this.pool.connect();
    const errors: string[] = [];
    let processedCount = 0;

    try {
      await client.query('BEGIN');

      for (const logEvent of logEvents) {
        try {
          await client.query(
            `INSERT INTO cloudwatch_logs 
             (id, timestamp, log_group, log_stream, message, extracted_fields) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [
              logEvent.id,
              logEvent.timestamp,
              logEvent.logGroup,
              logEvent.logStream,
              logEvent.message,
              logEvent.extractedFields ? JSON.stringify(logEvent.extractedFields) : null,
            ]
          );
          processedCount++;
        } catch (error) {
          const errorMessage = `Failed to insert log event ${logEvent.id}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = `Transaction failed: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    } finally {
      client.release();
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors,
    };
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
