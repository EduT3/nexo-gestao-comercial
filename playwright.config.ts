import { randomBytes } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

// Per-run credentials exist only in memory and are valid only in the disposable database.
process.env.NEXO_E2E_PASSWORD ??= `${randomBytes(24).toString('base64url')}aA7!`;
process.env.NEXO_E2E_CONTROL_TOKEN ??= randomBytes(32).toString('hex');

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/published-preview.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  globalTeardown: './tests/support/e2e-teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    ...devices['Desktop Edge'],
    channel: 'msedge',
    viewport: { width: 1440, height: 1000 },
    // Authentication forms and HTTP sessions must not be captured in traces or video.
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  webServer: {
    command: 'node --import tsx tests/support/e2e-server.ts',
    url: 'http://127.0.0.1:5174/api/health',
    timeout: 90_000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      NEXO_E2E_PASSWORD: process.env.NEXO_E2E_PASSWORD,
      NEXO_E2E_CONTROL_TOKEN: process.env.NEXO_E2E_CONTROL_TOKEN,
    },
  },
});
