// Test setup file
import { config } from '../src/config';
import { logger } from '../src/middleware/logger';

// Mock logger to prevent console output during tests
jest.mock('../src/middleware/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.UPSELL_ENABLED = 'true';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(30000);

// Global beforeEach for all tests
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global afterAll for cleanup
afterAll(() => {
  // Any global cleanup
});

// Suppress console output during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
