import { gzipSync } from 'zlib';
import { CloudWatchLogsEvent, Context } from 'aws-lambda';
import { handler, _clearDatabaseService } from '../handlers/cloudwatch-processor';

// Mock the database service
jest.mock('../services/database');
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  validateEnvironment: jest.fn(),
}));

import { DatabaseService } from '../services/database';
import { validateEnvironment } from '../utils';

const MockedDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;
const mockedValidateEnvironment = validateEnvironment as jest.MockedFunction<
  typeof validateEnvironment
>;

describe('CloudWatch Processor Handler', () => {
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    _clearDatabaseService(); // Clear the singleton between tests

    mockDbService = {
      testConnection: jest.fn(),
      initialize: jest.fn(),
      insertLogEvents: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    MockedDatabaseService.mockImplementation(() => mockDbService);
    mockedValidateEnvironment.mockImplementation(() => {});

    mockContext = {
      awsRequestId: 'test-request-id',
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      remainingTimeInMillis: () => 30000,
      callbackWaitsForEmptyEventLoop: true,
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2024/01/01/[$LATEST]abc123',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    } as Context;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process CloudWatch logs successfully', async () => {
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
          message: 'Test log message',
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

    mockDbService.testConnection.mockResolvedValue(true);
    mockDbService.initialize.mockResolvedValue(undefined);
    mockDbService.insertLogEvents.mockResolvedValue({
      success: true,
      processedCount: 1,
      errors: [],
    });

    const result = await handler(event, mockContext);

    expect(mockedValidateEnvironment).toHaveBeenCalled();
    expect(mockDbService.testConnection).toHaveBeenCalled();
    expect(mockDbService.initialize).toHaveBeenCalled();
    expect(mockDbService.insertLogEvents).toHaveBeenCalledWith([
      {
        id: '/aws/lambda/test-function-2024/01/01/[$LATEST]abcdef-1704067200000-1',
        timestamp: 1704067200000,
        message: 'Test log message',
        logGroup: '/aws/lambda/test-function',
        logStream: '2024/01/01/[$LATEST]abcdef',
        extractedFields: undefined,
      },
    ]);

    expect(result).toEqual({
      requestId: 'test-request-id',
      timestamp: expect.any(Number),
      message: 'Successfully processed 1 out of 1 log events',
    });
  });

  it('should handle database connection failure', async () => {
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
          message: 'Test log message',
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

    mockDbService.testConnection.mockResolvedValue(false);

    await expect(handler(event, mockContext)).rejects.toThrow(
      'Failed to process CloudWatch logs: Error: Failed to connect to database'
    );
  });

  it('should handle environment validation failure', async () => {
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
          message: 'Test log message',
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

    mockedValidateEnvironment.mockImplementation(() => {
      throw new Error('Missing required environment variables');
    });

    await expect(handler(event, mockContext)).rejects.toThrow('Failed to process CloudWatch logs');
  });

  it('should handle partial processing success with errors', async () => {
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
          message: 'Test log message',
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

    mockDbService.testConnection.mockResolvedValue(true);
    mockDbService.initialize.mockResolvedValue(undefined);
    mockDbService.insertLogEvents.mockResolvedValue({
      success: false,
      processedCount: 1,
      errors: ['Some error occurred'],
    });

    // Should not throw, but log the errors
    const result = await handler(event, mockContext);

    expect(result).toEqual({
      requestId: 'test-request-id',
      timestamp: expect.any(Number),
      message: 'Successfully processed 1 out of 1 log events',
    });
  });
});
