import { expect, test } from '@playwright/test';

test('opens the game tracker route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Open tracker' }).click();
  await expect(page.getByRole('heading', { name: 'Life tracker' })).toBeVisible();
});
