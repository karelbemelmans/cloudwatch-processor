export interface LogEvent {
  id: string;
  timestamp: number;
  message: string;
  logGroup: string;
  logStream: string;
  extractedFields?: Record<string, string> | undefined;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  processedCount: number;
  errors: string[];
}
