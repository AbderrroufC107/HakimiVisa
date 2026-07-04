import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToNotifications, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Notifications', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('filters unread notifications and marks one as read', async ({ page }) => {
    const title = `E2E notification ${Date.now()}`;
    const notification = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/notifications`, {
        headers: authHeaders(auth),
        data: {
          type: 'INFO',
          title,
          message: 'Notification created by automated test',
          userId: auth.user.id,
          link: '/dashboard',
        },
      }),
    );

    await navigateToNotifications(page);
    await expect(page.getByTestId('page-heading')).toHaveText('Notifications');
    await expect(page.getByTestId('notifications-filter-all')).toBeVisible();
    await page.getByTestId('notifications-filter-unread').click();

    await expect(page.getByTestId('notification-item').first()).toBeVisible({ timeout: 10000 });
    await expectOkJson(
      await page.request.patch(`${API_URL}/notifications/${notification.id}/read`, {
        headers: authHeaders(auth),
      }),
    );
    const unread = await expectOkJson<{ data: Array<{ id: string }>; meta: unknown }>(
      await page.request.get(`${API_URL}/notifications?read=false`, {
        headers: authHeaders(auth),
      }),
    );
    expect(unread.data.some((item) => item.id === notification.id)).toBe(false);
  });

  test('marks all notifications as read', async ({ page }) => {
    await expectOkJson(
      await page.request.post(`${API_URL}/notifications`, {
        headers: authHeaders(auth),
        data: {
          type: 'WARNING',
          title: `E2E read all ${Date.now()}`,
          message: 'Mark all test',
          userId: auth.user.id,
        },
      }),
    );

    await navigateToNotifications(page);
    const markAll = page.getByTestId('notifications-mark-all-read');
    await expect(markAll).toBeVisible({ timeout: 10000 });
    await markAll.click();
    await page.getByTestId('notifications-filter-unread').click();
    await expect(page.getByTestId('notification-item')).toHaveCount(0, { timeout: 10000 });
  });
});
