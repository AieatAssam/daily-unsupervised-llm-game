import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './games',
  testMatch: '**/*.test.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // 4 workers keeps unpkg.com from rate-limiting React/Babel downloads.
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    navigationTimeout: 60000,
    actionTimeout: 15000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // One desktop project; each suite opens its own 375px touch context for the
  // mobile test, so a second mobile project would only double the runtime.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx http-server -p 8080 -c-1 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
