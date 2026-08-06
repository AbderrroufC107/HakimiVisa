import { test, expect } from '@playwright/test';
import { navigateToTracking } from '../helpers/auth';

test.describe('Public Tracking Portal', () => {
  test('should display tracking portal without authentication', async ({ page }) => {
    await navigateToTracking(page);

    await expect(page.getByTestId('tracking-heading')).toBeVisible();
    await expect(page.getByTestId('tracking-passport-input')).toBeVisible();
    await expect(page.getByTestId('tracking-expiry-input')).toBeVisible();
    await expect(page.getByTestId('tracking-search-btn')).toBeVisible();
  });

  test('should show empty state on initial load', async ({ page }) => {
    await navigateToTracking(page);

    await expect(page.getByTestId('tracking-empty-state')).toBeVisible();
  });

  test('should keep search disabled until passport and expiry are both given', async ({ page }) => {
    await navigateToTracking(page);

    // A passport number alone is not enough — the expiry date proves the
    // caller is holding the document.
    await page.getByTestId('tracking-passport-input').fill('AB12');
    await expect(page.getByTestId('tracking-search-btn')).toBeDisabled();

    await page.getByTestId('tracking-passport-input').fill('AB123456');
    await expect(page.getByTestId('tracking-search-btn')).toBeDisabled();
  });

  test('should attempt tracking lookup with a passport and expiry', async ({ page }) => {
    await navigateToTracking(page);

    await page.getByTestId('tracking-passport-input').fill('AB123456');
    await page.getByTestId('tracking-expiry-input').fill('2030-01-01');
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
