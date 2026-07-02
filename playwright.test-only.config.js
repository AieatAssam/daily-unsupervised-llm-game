import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './games',
  use: {
    baseURL: 'http://localhost:8080',
    navigationTimeout: 60000,
    actionTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
