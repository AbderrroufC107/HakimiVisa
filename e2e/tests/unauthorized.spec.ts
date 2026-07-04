import { test, expect } from '@playwright/test';

test.describe('Unauthorized Access & Expired JWT', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing clients without auth', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing visa cases without auth', async ({ page }) => {
    await page.goto('/visa-cases');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing appointments without auth', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing kanban without auth', async ({ page }) => {
    await page.goto('/kanban');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing backups without auth', async ({ page }) => {
    await page.goto('/backups');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing notifications without auth', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should return 401 for API requests without token', async ({ page }) => {
    const res = await page.request.get('http://localhost:4000/api/clients');
    expect(res.status()).toBe(401);
  });

  test('should return 401 for API requests with expired token', async ({ page }) => {
    const res = await page.request.get('http://localhost:4000/api/clients', {
      headers: { Authorization: 'Bearer expired-invalid-token' },
    });
    expect(res.status()).toBe(401);
  });

  test('should allow public access to tracking page', async ({ page }) => {
    await page.goto('/tracking');
    await expect(page.getByTestId('tracking-heading')).toBeVisible();
    expect(page.url()).not.toContain('/login');
  });
});
