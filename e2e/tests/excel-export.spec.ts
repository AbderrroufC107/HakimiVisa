import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders } from '../helpers/api';

test.describe('Excel Export', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  for (const endpoint of ['clients', 'visa-cases', 'appointments', 'approvals', 'refusals']) {
    test(`exports ${endpoint} as XLSX`, async ({ page }) => {
      const response = await page.request.get(`${API_URL}/excel/${endpoint}`, {
        headers: authHeaders(auth),
      });
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect((await response.body()).byteLength).toBeGreaterThan(1000);
    });
  }
});
