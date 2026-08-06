import { test, expect } from '@playwright/test';
import { loginAsAdmin, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

/**
 * A partner agency sees its own work and nothing else. Scoping the lists is
 * not enough on its own — an id guessed or kept from elsewhere must not open
 * a door either, so these go at records the agency did not file.
 */
test.describe('Agency Isolation', () => {
  let deskAuth: LoginResponse;
  let agencyAuth: LoginResponse;
  let deskClientId: string;
  let deskCaseId: string;

  test.beforeEach(async ({ page }) => {
    deskAuth = await loginAsAdmin(page);
    const suffix = `${Date.now()}`;

    const deskClient = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/clients`, {
        headers: authHeaders(deskAuth),
        data: {
          fullName: `Desk Only ${suffix}`,
          phoneNumber: `+213668${suffix.slice(-6)}`,
          passportNumber: `DO${suffix.slice(-7)}`,
        },
      }),
    );
    deskClientId = deskClient.id;

    const deskCase = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/visa-cases`, {
        headers: authHeaders(deskAuth),
        data: { clientId: deskClient.id, visaCountry: 'Spain', visaType: 'Schengen' },
      }),
    );
    deskCaseId = deskCase.id;

    const agency = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/agencies`, {
        headers: authHeaders(deskAuth),
        data: { name: `Agence Isolée ${suffix}` },
      }),
    );

    const email = `isolation-${suffix}@e2e.test`;
    const password = 'AgencyPass123!';
    await expectOkJson(
      await page.request.post(`${API_URL}/agencies/${agency.id}/users`, {
        headers: authHeaders(deskAuth),
        data: { email, password, firstName: 'Iso', lastName: 'Agency' },
      }),
    );
    agencyAuth = await expectOkJson<LoginResponse>(
      await page.request.post(`${API_URL}/auth/login`, { data: { email, password } }),
    );
  });

  test('cannot read a desk case by id', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/visa-cases/${deskCaseId}`, {
      headers: authHeaders(agencyAuth),
    });
    expect(res.status()).toBe(404);
  });

  test('cannot move a desk case through the pipeline', async ({ page }) => {
    const res = await page.request.patch(`${API_URL}/visa-cases/${deskCaseId}/status`, {
      headers: authHeaders(agencyAuth),
      data: { status: 'EN_TRAITEMENT' },
    });
    expect([403, 404]).toContain(res.status());
  });

  test('cannot read a desk client by id', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/clients/${deskClientId}`, {
      headers: authHeaders(agencyAuth),
    });
    expect(res.status()).toBe(404);
  });

  test('sees none of the desk cases in its own list', async ({ page }) => {
    const list = await expectOkJson<{ data: { id: string }[] }>(
      await page.request.get(`${API_URL}/visa-cases`, { headers: authHeaders(agencyAuth) }),
    );
    expect(list.data.map((c) => c.id)).not.toContain(deskCaseId);
  });

  test('is refused the desk-only tools outright', async ({ page }) => {
    for (const path of ['/agencies', '/backup', '/audit-logs']) {
      const res = await page.request.get(`${API_URL}${path}`, {
        headers: authHeaders(agencyAuth),
      });
      expect([401, 403, 404], `${path} should not be open to an agency`).toContain(res.status());
    }
  });
});
