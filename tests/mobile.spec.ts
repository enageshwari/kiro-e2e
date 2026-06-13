import { test, expect } from './fixtures';

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
    await appPage.nameInput.fill('Nageshwari');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Nageshwari!');
  });

  test('should not show greeting when input is empty on mobile', async ({ appPage }) => {
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('');
  });

  test('should update greeting on re-submission on mobile', async ({ appPage }) => {
    await appPage.nameInput.tap();
    await appPage.nameInput.fill('Alice');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Alice!');
    await appPage.nameInput.fill('Bob');
    await appPage.submitBtn.tap();
    await expect(appPage.greetingOutput).toHaveText('Hello, Bob!');
  });

  test('should have input field focused and keyboard-ready on tap', async ({ appPage }) => {
    await appPage.nameInput.tap();
    await expect(appPage.nameInput).toBeFocused();
  });

  test('should fit content within mobile viewport without horizontal scroll', async ({ appPage, page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
