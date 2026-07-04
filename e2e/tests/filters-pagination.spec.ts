import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToClients, navigateToVisaCases } from '../helpers/auth';

test.describe('Filters & Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('filters clients by a seeded search term', async ({ page }) => {
    await navigateToClients(page);
    await expect(page.getByTestId('data-table-row').first()).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder(/search/i).fill('HV-A10001');
    await expect(page.getByTestId('data-table-row')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByTestId('data-table-row').first()).toContainText('Mohammed Benali');
  });

  test('filters visa cases by seeded case number', async ({ page }) => {
    await navigateToVisaCases(page);
    await expect(page.getByTestId('data-table-row').first()).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder(/search/i).fill('E2E-2026-0001');
    await expect(page.getByTestId('data-table-row')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByTestId('data-table-row').first()).toContainText('E2E-2026-0001');
  });

  test('paginates seeded clients', async ({ page }) => {
    await navigateToClients(page);
    await expect(page.getByTestId('pagination')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('pagination-current')).toHaveText(/Page 1 of/);

    await page.getByTestId('pagination-next').click();
    await expect(page.getByTestId('pagination-current')).toHaveText(/Page 2 of/, { timeout: 10000 });
    await expect(page.getByTestId('pagination-prev')).toBeEnabled();
  });
});
