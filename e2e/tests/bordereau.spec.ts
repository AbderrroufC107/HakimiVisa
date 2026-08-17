import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

/** 1 cm in PostScript points, the unit a PDF MediaBox is written in. */
const CM = 28.3465;

async function createClientAndCase(page: import('@playwright/test').Page, auth: LoginResponse, suffix: string) {
  const client = await expectOkJson<{ id: string; fullName: string }>(
    await page.request.post(`${API_URL}/clients`, {
      headers: authHeaders(auth),
      data: {
        fullName: `Bordereau Flow ${suffix}`,
        phoneNumber: `+213666${suffix.slice(-6)}`,
        whatsappNumber: `+213666${suffix.slice(-6)}`,
        email: `bordereau-${suffix}@example.com`,
        passportNumber: `BF${suffix.slice(-7)}`,
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
        notes: `E2E bordereau ${suffix}`,
      },
    }),
  );

  return { client, visaCase };
}

test.describe('Bordereau', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('prints on a single 15 x 10 cm card', async ({ page }) => {
    const { visaCase } = await createClientAndCase(page, auth, `P${Date.now()}`);

    const response = await page.request.get(`${API_URL}/pdf/bordereau/${visaCase.id}`, {
      headers: authHeaders(auth),
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/pdf');

    const pdf = (await response.body()).toString('latin1');
    expect(pdf.length).toBeGreaterThan(1000);

    // The receipt is cut to a fixed card, so the page size is part of the
    // contract rather than a detail of how it happens to be drawn today.
    const mediaBox = pdf.match(/\/MediaBox\s*\[([^\]]+)\]/);
    expect(mediaBox, 'PDF should declare a MediaBox').not.toBeNull();

    const [, , width, height] = mediaBox![1].trim().split(/\s+/).map(Number);
    expect(width / CM).toBeCloseTo(15, 1);
    expect(height / CM).toBeCloseTo(10, 1);

    // A second page would mean the content no longer fits the card.
    expect(pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).toHaveLength(1);
  });
});
