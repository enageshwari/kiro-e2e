import { test, expect } from './fixtures';

test.describe('Kiro Web App — UI Tests', () => {

  test('should display the correct page title', async ({ appPage, page }) => {
    await expect(page).toHaveTitle('Kiro App');
  });

  test('should display the main heading', async ({ appPage }) => {
    await expect(appPage.heading).toHaveText('Welcome to Kiro App');
  });

  test('should show placeholder text in the name input', async ({ appPage }) => {
    await expect(appPage.nameInput).toHaveAttribute('placeholder', 'Enter your name');
  });

  test('should show greeting when a name is submitted via button', async ({ appPage }) => {
    await appPage.submitName('Nageshwari');
    await expect(appPage.greetingOutput).toHaveText('Hello, Nageshwari!');
  });

  test('should show greeting when a name is submitted via Enter key', async ({ appPage }) => {
    await appPage.submitNameWithEnter('Kiro');
    await expect(appPage.greetingOutput).toHaveText('Hello, Kiro!');
  });

  test('should not display greeting when input is empty', async ({ appPage }) => {
    await appPage.clearAndSubmit();
    await expect(appPage.greetingOutput).toHaveText('');
  });

  test('should update greeting when a different name is submitted', async ({ appPage }) => {
    await appPage.submitName('Alice');
    await expect(appPage.greetingOutput).toHaveText('Hello, Alice!');
    await appPage.submitName('Bob');
    await expect(appPage.greetingOutput).toHaveText('Hello, Bob!');
  });

  test('should trim whitespace and not greet for whitespace-only input', async ({ appPage }) => {
    await appPage.submitName('   ');
    await expect(appPage.greetingOutput).toHaveText('');
  });

  test('should handle very long input gracefully', async ({ appPage }) => {
    const longName = 'A'.repeat(500);
    await appPage.submitName(longName);
    await expect(appPage.greetingOutput).toHaveText(`Hello, ${longName}!`);
    await expect(appPage.heading).toBeVisible();
  });
});
