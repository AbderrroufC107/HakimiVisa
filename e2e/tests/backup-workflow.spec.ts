import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToBackupCenter } from '../helpers/auth';

test.describe('Backup Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should display backup center with stats', async ({ page }) => {
    await navigateToBackupCenter(page);

    await expect(page.getByTestId('page-heading')).toHaveText('Backup Center');
    await expect(page.getByText('Total Backups')).toBeVisible();
    await expect(page.getByText('Total Size')).toBeVisible();
    await expect(page.getByText('Last Backup')).toBeVisible();
    await expect(page.getByText('Auto Backup')).toBeVisible();
    await expect(page.getByText('Backup History')).toBeVisible();
  });

  test('should create a new backup', async ({ page }) => {
    await navigateToBackupCenter(page);

    await page.getByTestId('create-backup-button').click();
    await expect(page.getByText('Backup created')).toBeVisible({ timeout: 15000 });
  });

  test('should show newly created backup in the history list', async ({ page }) => {
    await navigateToBackupCenter(page);

    await page.getByTestId('create-backup-button').click();
    await expect(page.getByText('Backup created')).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId('backup-list-item').first()).toBeVisible({ timeout: 10000 });
  });
});
