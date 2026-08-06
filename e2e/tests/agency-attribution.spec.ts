import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin, logout, navigateToClients, navigateToKanban, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

/**
 * Once partner agencies file cases, "whose client is this?" is the first
 * question asked of a card, a search hit or a row. These cover the places the
 * desk asks it.
 */
test.describe('Agency Attribution', () => {
  let auth: LoginResponse;
  let agencyName: string;
  let clientName: string;
  let phoneNumber: string;
  let caseId: string;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);

    const suffix = `${Date.now()}`;
    agencyName = `Agence E2E ${suffix}`;
    clientName = `Agency Client ${suffix}`;
    phoneNumber = `+213667${suffix.slice(-6)}`;

    const agency = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/agencies`, {
        headers: authHeaders(auth),
        data: { name: agencyName, contactName: 'E2E Contact' },
      }),
    );

    // The agency files under its own login — attribution is stamped from the
    // token, never from the request body, so it has to come in this way.
    const email = `agency-${suffix}@e2e.test`;
    const password = 'AgencyPass123!';
    await expectOkJson(
      await page.request.post(`${API_URL}/agencies/${agency.id}/users`, {
        headers: authHeaders(auth),
        data: { email, password, firstName: 'E2E', lastName: 'Agency' },
      }),
    );

    const agencyAuth = await expectOkJson<LoginResponse>(
      await page.request.post(`${API_URL}/auth/login`, { data: { email, password } }),
    );

    const client = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/clients`, {
        headers: authHeaders(agencyAuth),
        data: {
          fullName: clientName,
          phoneNumber,
          passportNumber: `AG${suffix.slice(-7)}`,
        },
      }),
    );

    const visaCase = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/visa-cases`, {
        headers: authHeaders(agencyAuth),
        data: { clientId: client.id, visaCountry: 'France', visaType: 'Schengen' },
      }),
    );
    caseId = visaCase.id;
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('queues an agency submission in its own board column, named', async ({ page }) => {
    await navigateToKanban(page);
    await page.getByTestId('kanban-search').fill(clientName);

    const card = page.locator(`[data-testid="kanban-card"][data-case-id="${caseId}"]`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText(agencyName);

    // Same status as the desk's own intake, but queued separately.
    await expect(card).toHaveAttribute('data-status', 'EN_ATTENTE');
    await expect(page.getByTestId('kanban-dropzone-EN_ATTENTE_AGENCE')).toContainText(clientName);
  });

  const expectAgencyInSearch = async (page: Page, term: string) => {
    const search = page.getByRole('combobox', { name: /search clients, cases/i });
    await search.fill(term);
    const results = page.locator('#search-results');
    await expect(results).toContainText(clientName, { timeout: 10000 });
    await expect(results).toContainText(agencyName);
  };

  test('names the agency on a search hit found by client name', async ({ page }) => {
    await navigateToClients(page);
    await expectAgencyInSearch(page, clientName);
  });

  test('names the agency on a search hit found by phone number', async ({ page }) => {
    await navigateToClients(page);
    await expectAgencyInSearch(page, phoneNumber);
  });

  test('marks the client as an agency client in the clients table', async ({ page }) => {
    await navigateToClients(page);
    await page.getByTestId('page-search').fill(clientName);

    const row = page.getByTestId('data-table-row').first();
    await expect(row).toContainText(clientName, { timeout: 10000 });
    await expect(row).toContainText(agencyName);
  });
});
