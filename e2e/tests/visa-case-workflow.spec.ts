import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToVisaCases, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

async function createVisaCase(page: import('@playwright/test').Page, auth: LoginResponse) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const client = await expectOkJson<{ id: string }>(
    await page.request.post(`${API_URL}/clients`, {
      headers: authHeaders(auth),
      data: {
        fullName: `VisaCase Client ${suffix}`,
        phoneNumber: `+213661${suffix.slice(-6)}`,
        passportNumber: `VC${suffix.slice(-7)}`,
        nationality: 'Algeria',
      },
    }),
  );

  return expectOkJson<{ id: string; caseNumber: string }>(
    await page.request.post(`${API_URL}/visa-cases`, {
      headers: authHeaders(auth),
      data: {
        clientId: client.id,
        visaCountry: 'France',
        visaType: 'Schengen',
        notes: 'E2E test visa case',
      },
    }),
  );
}

test.describe('Visa Case Workflow', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('creates a visa case through the API and displays it in the table', async ({ page }) => {
    const visaCase = await createVisaCase(page, auth);

    await navigateToVisaCases(page);
    await page.getByPlaceholder(/search/i).fill(visaCase.caseNumber);
    await expect(page.getByTestId('data-table-row')).toHaveCount(1, { timeout: 10000 });
    await expect(page.getByTestId('data-table-row').first()).toContainText('France');
    await expect(page.getByTestId('data-table-row').first()).toContainText('Schengen');
  });

  test('changes visa case status and records history', async ({ page }) => {
    const visaCase = await createVisaCase(page, auth);

    await navigateToVisaCases(page);
    await page.getByPlaceholder(/search/i).fill(visaCase.caseNumber);
    await page.getByLabel(`View visa case ${visaCase.caseNumber}`).click();
    await expect(page.getByTestId('page-heading')).toHaveText(visaCase.caseNumber);

    await page.getByTestId('status-select').click();
    await page.getByRole('option', { name: /en traitement/i }).click();

    await expect
      .poll(async () => {
        const updated = await expectOkJson<{ currentStatus: string }>(
          await page.request.get(`${API_URL}/visa-cases/${visaCase.id}`, {
            headers: authHeaders(auth),
          }),
        );
        return updated.currentStatus;
      })
      .toBe('EN_TRAITEMENT');

    const history = await expectOkJson<unknown[]>(
      await page.request.get(`${API_URL}/visa-cases/${visaCase.id}/history`, {
        headers: authHeaders(auth),
      }),
    );
    expect(history.length).toBeGreaterThan(0);
  });
});
