import { defineConfig, devices } from '@playwright/test';

// APP_URL is injected at runtime by the Fargate task (via Lambda ECS override)
// Falls back to localhost for local development
const baseURL = process.env.APP_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL,
    trace: 'on',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/mobile.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: ['**/mobile.spec.ts', '**/visual.spec.ts'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome - Pixel 5',
      testIgnore: '**/visual.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Chrome - iPhone 12',
      testIgnore: '**/visual.spec.ts',
      use: { ...devices['iPhone 12'], defaultBrowserType: 'chromium' },
    },
  ],
  // No webServer block — in CI the app is already deployed externally.
  // For local dev, start the app manually before running tests.
});
