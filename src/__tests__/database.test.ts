import { DatabaseService } from '../services/database';
import { DatabaseConfig, LogEvent } from '../types';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

import { Pool } from 'pg';

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPool: jest.Mocked<InstanceType<typeof Pool>>;
  let mockClient: {
    query: jest.Mock;
    release: jest.Mock;
  };

  const config: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
    } as unknown as jest.Mocked<InstanceType<typeof Pool>>;

    MockedPool.mockImplementation(() => mockPool);

    databaseService = new DatabaseService(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create table if not exists', async () => {
      await databaseService.initialize();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS cloudwatch_logs')
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mockPool.connect = mockConnect;

      await expect(databaseService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('insertLogEvents', () => {
    const logEvents: LogEvent[] = [
      {
        id: 'test-1',
        timestamp: 1704067200000,
        message: 'Test message 1',
        logGroup: '/aws/lambda/test',
        logStream: 'test-stream',
      },
      {
        id: 'test-2',
        timestamp: 1704067201000,
        message: 'Test message 2',
        logGroup: '/aws/lambda/test',
        logStream: 'test-stream',
        extractedFields: { level: 'INFO' },
      },
    ];

    it('should insert log events successfully', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await databaseService.insertLogEvents(logEvents);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.errors).toHaveLength(0);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cloudwatch_logs'),
        ['test-1', 1704067200000, '/aws/lambda/test', 'test-stream', 'Test message 1', null]
      );
    });

    it('should return early for empty log events array', async () => {
      const result = await databaseService.insertLogEvents([]);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockPool.connect).not.toHaveBeenCalled();
    });

    it('should handle individual insert errors gracefully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce(new Error('Insert failed for test-1')) // First insert
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Second insert
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await databaseService.insertLogEvents(logEvents);

      expect(result.success).toBe(false);
      expect(result.processedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to insert log event test-1');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });

      const result = await databaseService.testConnection();

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return false for failed connection', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mockPool.connect = mockConnect;

      const result = await databaseService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the connection pool', async () => {
      await databaseService.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
