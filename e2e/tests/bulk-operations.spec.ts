import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToVisaCases } from '../helpers/auth';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should select multiple visa cases and show bulk toolbar', async ({ page }) => {
    await navigateToVisaCases(page);
    await expect(page.getByTestId('data-table-row').first()).toBeVisible({ timeout: 10000 });

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await expect(page.getByText(/selected/).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /status/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible();
  });

  test('should perform bulk status change on selected cases', async ({ page }) => {
    await navigateToVisaCases(page);
    await expect(page.getByTestId('data-table-row').first()).toBeVisible({ timeout: 10000 });

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await checkboxes.nth(0).check();
    await expect(page.getByText(/selected/)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /status/i }).click();
    await expect(page.getByRole('heading', { name: /change status/i })).toBeVisible({ timeout: 5000 });
  });
});
