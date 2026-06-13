import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Kiro App main page.
 * Encapsulates all locators and interactions so tests stay clean and maintainable.
 */
export class KiroAppPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly submitBtn: Locator;
  readonly greetingOutput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading       = page.getByTestId('main-heading');
    this.nameInput     = page.getByTestId('name-input');
    this.submitBtn     = page.getByTestId('submit-btn');
    this.greetingOutput = page.getByTestId('greeting-output');
  }

  async goto() {
    await this.page.goto('/');
  }

  async submitName(name: string) {
    await this.nameInput.fill(name);
    await this.submitBtn.click();
  }

  async submitNameWithEnter(name: string) {
    await this.nameInput.fill(name);
    await this.nameInput.press('Enter');
  }

  async clearAndSubmit() {
    await this.nameInput.clear();
    await this.submitBtn.click();
  }
}
