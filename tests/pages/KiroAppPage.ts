import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Kiro App main page.
 *
 * Playwright best practices applied:
 * - All locators use data-testid (stable, not tied to CSS or text)
 * - goto() waits for domcontentloaded + heading visible before yielding
 * - All interactions use built-in actionability checks (visible, enabled, stable)
 * - fill() used instead of clear()+type() — atomic and actionability-safe
 * - Assertions use web-first assertions (auto-retry until timeout)
 */
export class KiroAppPage {
  readonly page:           Page;
  readonly heading:        Locator;
  readonly nameInput:      Locator;
  readonly submitBtn:      Locator;
  readonly greetingOutput: Locator;

  constructor(page: Page) {
    this.page           = page;
    this.heading        = page.getByTestId('main-heading');
    this.nameInput      = page.getByTestId('name-input');
    this.submitBtn      = page.getByTestId('submit-btn');
    this.greetingOutput = page.getByTestId('greeting-output');
  }

  /**
   * Navigate to the app and wait until the page is interactive.
   * Waits for domcontentloaded then asserts the heading is visible —
   * ensures the page is fully ready before any test interaction begins.
   */
  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    // Web-first assertion: retries until heading is visible (up to default timeout)
    // This is the actionability gate — nothing runs until the page is ready.
    await expect(this.heading).toBeVisible();
  }

  /**
   * Fill the name input and click submit.
   * fill() clears existing content and types atomically.
   * click() waits for: attached, visible, stable, enabled, not obscured.
   */
  async submitName(name: string) {
    await this.nameInput.fill(name);
    await this.submitBtn.click();
  }

  /**
   * Fill the name input and press Enter to submit.
   * press() has the same actionability checks as click().
   */
  async submitNameWithEnter(name: string) {
    await this.nameInput.fill(name);
    await this.nameInput.press('Enter');
  }

  /**
   * Clear the input (fill with empty string) and submit.
   * fill('') is preferred over clear() — it triggers input events
   * consistently and has built-in actionability checks.
   */
  async clearAndSubmit() {
    await this.nameInput.fill('');
    await this.submitBtn.click();
  }

  /**
   * Wait for the greeting to show a specific value.
   * Use in tests that need to confirm state before proceeding.
   */
  async waitForGreeting(text: string) {
    await expect(this.greetingOutput).toHaveText(text);
  }

  /**
   * Wait for the greeting to be empty.
   */
  async waitForNoGreeting() {
    await expect(this.greetingOutput).toBeEmpty();
  }
}
