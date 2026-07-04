import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToLogin, navigateToDashboard } from '../helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should display login form elements', async ({ page }) => {
    await navigateToLogin(page);

    await expect(page.getByTestId('login-heading')).toBeVisible();
    await expect(page.getByTestId('login-welcome')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in');
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToDashboard(page);

    await expect(page.getByTestId('page-heading')).toHaveText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await navigateToLogin(page);

    await page.fill('#email', 'wrong@email.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/Invalid|credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('should logout and redirect to login page', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToDashboard(page);

    await page.locator('header button[aria-haspopup="menu"]').last().click();
    await page.locator('[role="menuitem"]:has-text("Log out")').click();

    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-welcome')).toBeVisible();
  });
});
