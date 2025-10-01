import { gzipSync } from 'zlib';
import { CloudWatchLogsEvent } from 'aws-lambda';
import { parseCloudWatchLogs, validateEnvironment } from '../utils';

describe('Utils', () => {
  describe('parseCloudWatchLogs', () => {
    it('should parse compressed CloudWatch logs correctly', () => {
      const mockLogData = {
        messageType: 'DATA_MESSAGE',
        owner: '123456789012',
        logGroup: '/aws/lambda/test-function',
        logStream: '2024/01/01/[$LATEST]abcdef',
        subscriptionFilters: ['test-filter'],
        logEvents: [
          {
            id: '1',
            timestamp: 1704067200000,
            message: 'Test log message 1',
          },
          {
            id: '2',
            timestamp: 1704067201000,
            message: 'Test log message 2',
            extractedFields: { level: 'INFO' },
          },
        ],
      };

      const compressed = gzipSync(JSON.stringify(mockLogData));
      const base64Data = compressed.toString('base64');

      const event: CloudWatchLogsEvent = {
        awslogs: {
          data: base64Data,
        },
      };

      const result = parseCloudWatchLogs(event);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '/aws/lambda/test-function-2024/01/01/[$LATEST]abcdef-1704067200000-1',
        timestamp: 1704067200000,
        message: 'Test log message 1',
        logGroup: '/aws/lambda/test-function',
        logStream: '2024/01/01/[$LATEST]abcdef',
        extractedFields: undefined,
      });
      expect(result[1]).toEqual({
        id: '/aws/lambda/test-function-2024/01/01/[$LATEST]abcdef-1704067201000-2',
        timestamp: 1704067201000,
        message: 'Test log message 2',
        logGroup: '/aws/lambda/test-function',
        logStream: '2024/01/01/[$LATEST]abcdef',
        extractedFields: { level: 'INFO' },
      });
    });

    it('should throw error for invalid compressed data', () => {
      const event: CloudWatchLogsEvent = {
        awslogs: {
          data: 'invalid-base64-data',
        },
      };

      expect(() => parseCloudWatchLogs(event)).toThrow();
    });
  });

  describe('validateEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should not throw when all required environment variables are present', () => {
      process.env['DB_HOST'] = 'localhost';
      process.env['DB_PORT'] = '5432';
      process.env['DB_NAME'] = 'test_db';
      process.env['DB_USER'] = 'test_user';
      process.env['DB_PASSWORD'] = 'test_password';

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw when required environment variables are missing', () => {
      delete process.env['DB_HOST'];
      delete process.env['DB_PORT'];

      expect(() => validateEnvironment()).toThrow(
        'Missing required environment variables: DB_HOST, DB_PORT'
      );
    });
  });
});
