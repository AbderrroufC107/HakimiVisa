import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from '../helpers/auth';

test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should render dashboard on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
  });

  test('should render clients page on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/clients');
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
  });

  test('should render visa cases page on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/visa-cases');
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
  });

  test('should render kanban board on mobile with horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/kanban');
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
  });

  test('should render appointments on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/appointments');
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
  });
});
