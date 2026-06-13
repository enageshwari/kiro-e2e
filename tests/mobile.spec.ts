import { test, expect } from './fixtures';

/**
 * Mobile emulation tests for the Kiro App.
 * Runs on Pixel 5 and iPhone 12 viewports (configured in playwright.config.ts).
 *
 * Best practices:
 * - tap() used for all interactions (mirrors real mobile touch events)
 * - Each tap is followed by a web-first assertion before the next interaction
 * - fill() used for text entry — works correctly with mobile emulation
 * - toBeEmpty() for empty greeting assertions
 */
test.describe('Kiro Web App — Mobile Tests', () => {

  test('should display heading on mobile viewport', async ({ appPage }) => {
    await expect(appPage.heading).toBeVisible();
    await expect(appPage.heading).toHaveText('Welcome to Kiro App');
  });

  test('should display input and button on mobile viewport', async ({ appPage }) => {
    await expect(appPage.nameInput).toBeVisible();
    await expect(appPage.submitBtn).toBeVisible();
  });

  test('should show greeting after tap on submit button', async ({ appPage }) => {
    await appPage.nameInput.tap();
    // Wait for focus before filling — ensures virtual keyboard is ready
    await expect(appPage.nameInput).toBeFocused();
    await appPage.nameInput.fill('Nageshwari');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Nageshwari!');
  });

  test('should not show greeting when input is empty on mobile', async ({ appPage }) => {
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toBeEmpty();
  });

  test('should update greeting on re-submission on mobile', async ({ appPage }) => {
    await appPage.nameInput.tap();
    await expect(appPage.nameInput).toBeFocused();
    await appPage.nameInput.fill('Alice');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Alice!');

    // Wait for first greeting then submit second — avoids race between DOM updates
    await appPage.nameInput.tap();
    await appPage.nameInput.fill('Bob');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Bob!');
  });

  test('should have input field focused and keyboard-ready on tap', async ({ appPage }) => {
    await appPage.nameInput.tap();
    // toBeFocused() auto-retries — no need for manual waitForFunction
    await expect(appPage.nameInput).toBeFocused();
  });

  test('should fit content within mobile viewport without horizontal scroll', async ({ appPage, page }) => {
    // Wait for page to be stable before measuring layout
    await expect(appPage.heading).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
