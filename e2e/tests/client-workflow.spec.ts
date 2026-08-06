import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToClients, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

async function createClient(page: import('@playwright/test').Page, auth: LoginResponse, label: string) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return expectOkJson<{ id: string; fullName: string; phoneNumber: string }>(
    await page.request.post(`${API_URL}/clients`, {
      headers: authHeaders(auth),
      data: {
        fullName: `${label} ${suffix}`,
        phoneNumber: `+213663${suffix.slice(-6)}`,
        email: `${label.toLowerCase().replace(/\s+/g, '-')}-${suffix}@example.com`,
        passportNumber: `CW${suffix.slice(-7)}`,
      },
    }),
  );
}

test.describe('Client Workflow', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('creates a new client from the UI', async ({ page }) => {
    const suffix = `${Date.now()}`;
    const fullName = `E2E Test Client ${suffix}`;
    const phoneNumber = `+213662${suffix.slice(-6)}`;

    await navigateToClients(page);
    await page.getByTestId('add-client-button').click();
    await page.waitForURL('**/clients/new');
    await expect(page.getByTestId('page-heading')).toHaveText('Add Client');

    await page.fill('#fullName', fullName);
    await page.fill('#phoneNumber', phoneNumber);
    await page.fill('#email', `client-${suffix}@example.com`);
    await page.fill('#passportNumber', `CU${suffix.slice(-7)}`);
    await page.fill('#passportExpiry', '2030-01-01');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/clients');
    await page.getByTestId('page-search').fill(fullName);
    await expect(page.getByTestId('data-table-row')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByTestId('data-table-row').first()).toContainText(phoneNumber);
  });

  test('displays an existing client in the list', async ({ page }) => {
    const client = await createClient(page, auth, 'Display Client');

    await navigateToClients(page);
    await page.getByTestId('page-search').fill(client.fullName);
    await expect(page.getByTestId('data-table-row')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByTestId('data-table-row').first()).toContainText(client.fullName);
  });

  test('updates client details', async ({ page }) => {
    const client = await createClient(page, auth, 'Editable Client');

    await expectOkJson(
      await page.request.patch(`${API_URL}/clients/${client.id}`, {
        headers: authHeaders(auth),
        data: { notes: 'Edited by the update test' },
      }),
    );

    const updated = await expectOkJson<{ notes: string }>(
      await page.request.get(`${API_URL}/clients/${client.id}`, {
        headers: authHeaders(auth),
      }),
    );
    expect(updated.notes).toBe('Edited by the update test');
  });
});
