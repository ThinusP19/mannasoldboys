import { beforeAll, afterAll, vi } from 'vitest';

// Set required environment variables before any imports
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-minimum-64-characters-long-for-security';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// Mock the logger to reduce noise during tests
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
  vi.clearAllMocks();
});
