/**
 * Test setup and configuration
 */

import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  // Global test setup
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(async () => {
  // Global test cleanup
});