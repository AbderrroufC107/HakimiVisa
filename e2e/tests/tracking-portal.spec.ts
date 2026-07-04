import { test, expect } from '@playwright/test';
import { navigateToTracking } from '../helpers/auth';

test.describe('Public Tracking Portal', () => {
  test('should display tracking portal without authentication', async ({ page }) => {
    await navigateToTracking(page);

    await expect(page.getByTestId('tracking-heading')).toBeVisible();
    await expect(page.getByTestId('tracking-phone-input')).toBeVisible();
    await expect(page.getByTestId('tracking-search-btn')).toBeVisible();
  });

  test('should show empty state on initial load', async ({ page }) => {
    await navigateToTracking(page);

    await expect(page.getByTestId('tracking-empty-state')).toBeVisible();
  });

  test('should show validation on short phone number', async ({ page }) => {
    await navigateToTracking(page);

    await page.getByTestId('tracking-phone-input').fill('123');
    await expect(page.getByTestId('tracking-search-btn')).toBeDisabled();
  });

  test('should attempt tracking lookup with a phone number', async ({ page }) => {
    await navigateToTracking(page);

    await page.getByTestId('tracking-phone-input').fill('+213556677889');
    await expect(page.getByTestId('tracking-search-btn')).toBeEnabled();
    await page.getByTestId('tracking-search-btn').click();

    await expect(page.getByTestId('tracking-error').or(page.getByTestId('tracking-empty-state'))).toBeVisible({ timeout: 10000 });
  });

  test('should be accessible on public route without redirect to login', async ({ page }) => {
    await page.goto('/tracking');
    await expect(page.getByTestId('tracking-heading')).toBeVisible();

    expect(page.url()).not.toContain('/login');
  });
});
