import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report' }], ['list']]
    : 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: [
    {
      command: 'cd ../backend && npm run start:dev',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../frontend && npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
