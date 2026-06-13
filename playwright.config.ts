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

    // Actionability timeouts — how long Playwright waits for elements to be
    // visible, enabled, stable before interacting or asserting.
    // Set conservatively for CI (remote ALB, cold containers).
    actionTimeout:    15_000,   // per action: click, fill, tap, etc.
    navigationTimeout: 30_000,  // page.goto() and navigation events

    // Screenshot on failure for debugging in CI
    screenshot: 'only-on-failure',
  },

  // Global test timeout — per test (not per assertion)
  timeout: 60_000,

  // Global expect timeout — how long web-first assertions retry before failing
  expect: {
    timeout: 10_000,
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
  // For local dev, start kiro-app manually before running tests.
});
