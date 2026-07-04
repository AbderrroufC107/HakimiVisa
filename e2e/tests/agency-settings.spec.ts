import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Agency Settings', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('loads and updates agency settings', async ({ page }) => {
    const existing = await expectOkJson<{ agencyName: string }>(
      await page.request.get(`${API_URL}/agency-settings`, {
        headers: authHeaders(auth),
      }),
    );
    expect(existing.agencyName).toBeTruthy();

    const updatedName = `Hakimi Visa Services ${Date.now()}`;
    const updated = await expectOkJson<{ agencyName: string; defaultCountry: string }>(
      await page.request.put(`${API_URL}/agency-settings`, {
        headers: authHeaders(auth),
        data: {
          agencyName: updatedName,
          agencyAddress: '42 Rue Didouche Mourad, Algiers, Algeria',
          agencyPhone: '+213 21 63 10 10',
          agencyEmail: 'contact@hakimivisa.com',
          agencyWebsite: 'https://hakimivisa.com',
          defaultCountry: 'France',
          defaultVisaType: 'Schengen',
          pdfFooterText: 'Hakimi Visa Services - Professional visa assistance',
          pdfPrimaryColor: '#1a73e8',
          appointmentCenter: 'TLS Contact Algiers',
        },
      }),
    );
    expect(updated.agencyName).toBe(updatedName);
    expect(updated.defaultCountry).toBe('France');
  });
});
