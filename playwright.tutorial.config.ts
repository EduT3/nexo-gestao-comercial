import { defineConfig } from '@playwright/test';

// The launcher owns an ephemeral loopback server. Never reuse an operator's server.
if (!process.env.NEXO_TUTORIAL_URL?.startsWith('http://127.0.0.1:')) throw new Error('Execute node scripts/verify-preview-tutorial.mjs.');
export default defineConfig({
  testDir: './tests/e2e', testMatch: ['local-company.spec.ts', 'tutorial-preview.spec.ts', 'published-preview.spec.ts'],
  workers: 1, retries: 0, timeout: 30000, expect: { timeout: 7000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/tutorial-browser-results.json' }]],
  use: { baseURL: process.env.NEXO_TUTORIAL_URL, channel: 'msedge', headless: true,
    viewport: { width: 1200, height: 800 }, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
});
