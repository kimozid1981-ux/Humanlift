import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against real, built servers: the API (with PostgreSQL), the web app and the admin app.
 * Locally, start them yourself (see docs/guides/local-development.md) or let Playwright start them.
 */
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: [
    { command: 'node ../../services/api/dist/main.js', url: 'http://localhost:4000/v1/health', reuseExistingServer: !CI, timeout: 60_000 },
    { command: 'pnpm start', url: 'http://localhost:3000/en', reuseExistingServer: !CI, timeout: 60_000 },
    { command: 'pnpm --dir ../admin start', url: 'http://localhost:3001/login', reuseExistingServer: !CI, timeout: 60_000 },
  ],
});
