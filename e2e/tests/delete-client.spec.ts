import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToClients, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Delete Client', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('deletes a client through the UI', async ({ page }) => {
    const suffix = Date.now();
    const client = await expectOkJson<{ id: string; fullName: string }>(
      await page.request.post(`${API_URL}/clients`, {
        headers: authHeaders(auth),
        data: {
          fullName: `Delete Target ${suffix}`,
          phoneNumber: `+213777${String(suffix).slice(-6)}`,
          whatsappNumber: `+213777${String(suffix).slice(-6)}`,
          email: `delete-${suffix}@example.com`,
          passportNumber: `DEL${String(suffix).slice(-7)}`,
          nationality: 'Algeria',
        },
      }),
    );

    await navigateToClients(page);
    await page.getByPlaceholder(/search/i).fill(client.fullName);
    await expect(page.getByTestId('data-table-row')).toHaveCount(1);

    await page.getByLabel(`Delete client ${client.fullName}`).click();
    await expect(page.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible();
    await page.getByRole('button', { name: /delete|supprimer|confirm/i }).click();

    await expect(page.getByTestId('data-table-row')).toHaveCount(0, { timeout: 10000 });
    const getDeleted = await page.request.get(`${API_URL}/clients/${client.id}`, {
      headers: authHeaders(auth),
    });
    expect(getDeleted.status()).toBe(404);
  });
});
