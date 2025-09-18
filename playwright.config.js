import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/playwright',
  timeout: 60000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'on-first-retry'
  }
});
