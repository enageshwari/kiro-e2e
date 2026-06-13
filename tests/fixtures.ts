import { test as base } from '@playwright/test';
import { KiroAppPage } from './pages/KiroAppPage';

type AppFixtures = {
  appPage: KiroAppPage;
};

export const test = base.extend<AppFixtures>({
  appPage: async ({ page }, use) => {
    const appPage = new KiroAppPage(page);
    await appPage.goto();
    await use(appPage);
  },
});

export { expect } from '@playwright/test';
