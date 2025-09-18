import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const configUrl = new URL(import.meta.url);
const testDir = dirname(fileURLToPath(configUrl));
const projectRoot = dirname(testDir);

export default defineConfig({
  testDir,
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173'
  },
  webServer: {
    command: 'node tools/serve-static.mjs',
    cwd: projectRoot,
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  },
  expect: {
    timeout: 5_000
  },
  outputDir: join(projectRoot, 'test-results')
});
