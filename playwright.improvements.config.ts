import { defineConfig } from '@playwright/test';
if (!process.env.NEXO_TEST_URL?.startsWith('http://127.0.0.1:')) throw new Error('Execute verify-local-improvements-browser.mjs.');
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'local-improvements.spec.ts', workers: 1, retries: 0, timeout: 30000,
  reporter: [['list']], use: { baseURL: process.env.NEXO_TEST_URL, channel: 'msedge', headless: true, viewport: { width: 1200, height: 800 } },
});
