// Jest setup file for all tests
import { jest } from '@jest/globals';

// Mock environment variables for tests
process.env['DB_HOST'] = 'localhost';
process.env['DB_PORT'] = '5432';
process.env['DB_NAME'] = 'test_db';
process.env['DB_USER'] = 'test_user';
process.env['DB_PASSWORD'] = 'test_password';
process.env['DB_SSL'] = 'false';

// Increase timeout for integration tests
jest.setTimeout(30000);
