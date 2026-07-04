import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToAppointments } from '../helpers/auth';

test.describe('Appointment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

test('should render calendar view', async ({ page }) => {
    await navigateToAppointments(page);

    await expect(page.getByTestId('page-heading')).toHaveText('Rendez-vous');
    await expect(page.locator('.grid').filter({ hasText: 'Lun' }).first()).toBeVisible({ timeout: 10000 });
    // Calendar grid cells should be present
    await expect(page.locator('[class*="min-h-24"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate months using chevron buttons', async ({ page }) => {
    await navigateToAppointments(page);

    // Just verify chevron buttons exist and are clickable
    const prevBtn = page.locator('button:has(svg.lucide-chevron-left)').first();
    const nextBtn = page.locator('button:has(svg.lucide-chevron-right)').first();
    await expect(prevBtn).toBeVisible({ timeout: 5000 });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    const title = page.getByTestId('calendar-title');
    const before = await title.textContent().catch(() => '');
    await nextBtn.click();
    await expect.poll(async () => title.textContent().catch(() => '')).not.toBe(before);
  });

  test('should open create appointment dialog and display form', async ({ page }) => {
    await navigateToAppointments(page);

    await page.getByTestId('new-appointment-button').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"] input').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"] button[type="submit"]')).toBeVisible();
  });
});
