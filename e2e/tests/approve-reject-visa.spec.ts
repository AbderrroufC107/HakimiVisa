import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToVisaCases, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

async function createClientAndCase(page: import('@playwright/test').Page, auth: LoginResponse, suffix: string) {
  const client = await expectOkJson<{ id: string; fullName: string }>(
    await page.request.post(`${API_URL}/clients`, {
      headers: authHeaders(auth),
      data: {
        fullName: `Visa Flow ${suffix}`,
        phoneNumber: `+213666${suffix.slice(-6)}`,
        whatsappNumber: `+213666${suffix.slice(-6)}`,
        email: `visa-flow-${suffix}@example.com`,
        passportNumber: `VF${suffix.slice(-7)}`,
        nationality: 'Algeria',
      },
    }),
  );

  const visaCase = await expectOkJson<{ id: string; caseNumber: string }>(
    await page.request.post(`${API_URL}/visa-cases`, {
      headers: authHeaders(auth),
      data: {
        clientId: client.id,
        visaCountry: 'France',
        visaType: 'Schengen Tourism',
        notes: `E2E visa flow ${suffix}`,
      },
    }),
  );

  return { client, visaCase };
}

test.describe('Visa Approval & Rejection', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('approves a visa case and creates visa details', async ({ page }) => {
    const { visaCase } = await createClientAndCase(page, auth, `A${Date.now()}`);

    await navigateToVisaCases(page);
    await page.getByPlaceholder(/search/i).fill(visaCase.caseNumber);
    await expect(page.getByTestId('data-table-row')).toHaveCount(1);
    await page.getByLabel(`View visa case ${visaCase.caseNumber}`).click();

    await expect(page.getByTestId('page-heading')).toHaveText(visaCase.caseNumber);
    await page.getByTestId('status-select').click();
    await page.getByRole('option', { name: /visa ok/i }).click();

    const updated = await expectOkJson<{ currentStatus: string }>(
      await page.request.get(`${API_URL}/visa-cases/${visaCase.id}`, {
        headers: authHeaders(auth),
      }),
    );
    expect(updated.currentStatus).toBe('VISA_OK');

    await expectOkJson(
      await page.request.post(`${API_URL}/visa-cases/${visaCase.id}/visa-details`, {
        headers: authHeaders(auth),
        data: {
          validFrom: '2026-07-01',
          validUntil: '2026-09-29',
          durationDays: 90,
          entryType: 'MULTIPLE',
          visaNumber: `APP-${Date.now()}`,
          notes: 'Approved by E2E test',
        },
      }),
    );

    const details = await expectOkJson<{ durationDays: number; entryType: string }>(
      await page.request.get(`${API_URL}/visa-cases/${visaCase.id}/visa-details`, {
        headers: authHeaders(auth),
      }),
    );
    expect(details.durationDays).toBe(90);
    expect(details.entryType).toBe('MULTIPLE');
  });

  test('rejects a visa case', async ({ page }) => {
    const { visaCase } = await createClientAndCase(page, auth, `R${Date.now()}`);

    await expectOkJson(
      await page.request.patch(`${API_URL}/visa-cases/${visaCase.id}/status`, {
        headers: authHeaders(auth),
        data: { status: 'VISA_REFUSEE' },
      }),
    );

    const updated = await expectOkJson<{ currentStatus: string; statusHistories: unknown[] }>(
      await page.request.get(`${API_URL}/visa-cases/${visaCase.id}`, {
        headers: authHeaders(auth),
      }),
    );
    expect(updated.currentStatus).toBe('VISA_REFUSEE');
    expect(updated.statusHistories.length).toBeGreaterThan(0);
  });

  test('generates a bordereau PDF', async ({ page }) => {
    const { visaCase } = await createClientAndCase(page, auth, `P${Date.now()}`);

    const pdf = await page.request.get(`${API_URL}/pdf/bordereau/${visaCase.id}`, {
      headers: authHeaders(auth),
    });
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect((await pdf.body()).byteLength).toBeGreaterThan(1000);
  });
});
