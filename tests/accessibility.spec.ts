import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core.
 * Checks the app against WCAG 2.1 AA standards.
 *
 * Best practices:
 * - Each test waits for the page/element to be in the expected state before scanning
 * - axe runs after web-first assertions confirm the DOM is stable
 * - Violations array checked with toEqual([]) for clear failure messages
 */
test.describe('Kiro Web App — Accessibility Tests', () => {

  test('should have no WCAG violations on initial page load', async ({ appPage, page }) => {
    // appPage fixture ensures page is fully loaded and heading is visible
    // before axe scans — avoids scanning a partially rendered page
    await expect(appPage.heading).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('should have no WCAG violations after greeting is displayed', async ({ appPage, page }) => {
    await appPage.submitName('Nageshwari');
    // Wait for DOM update to settle before scanning
    await expect(appPage.greetingOutput).toHaveText('Hello, Nageshwari!');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('should have no WCAG violations when input is focused', async ({ appPage, page }) => {
    await appPage.nameInput.focus();
    // Confirm focus before scanning — ensures focused state is reflected in DOM
    await expect(appPage.nameInput).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
