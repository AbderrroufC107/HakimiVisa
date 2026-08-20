import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToKanban, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Sending a message from the board', () => {
  let auth: LoginResponse;
  let suffix: string;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);

    // The picker only has something to offer if templates exist, so the test
    // brings its own rather than leaning on whatever the database happens to
    // hold. Filters are left empty so they match any case.
    suffix = `${Date.now()}`;
    for (const [name, body] of [
      [`E2E Premier avis ${suffix}`, 'Bonjour {{client_name}}, votre dossier {{case_number}} est ouvert.'],
      [`E2E Rappel ${suffix}`, 'Rappel : dossier {{case_number}} pour {{client_name}}, merci de nous contacter.'],
    ]) {
      await expectOkJson(
        await page.request.post(`${API_URL}/templates`, {
          headers: authHeaders(auth),
          data: { name, channel: 'WHATSAPP', body },
        }),
      );
    }
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('offers WhatsApp and email at every stage, not only RDV OK', async ({ page }) => {
    await navigateToKanban(page);
    await expect(page.getByTestId('kanban-card').first()).toBeVisible({ timeout: 15000 });

    // A client is kept informed throughout, so a card that has not reached the
    // appointment stage must still be able to send.
    const other = page.locator('[data-testid="kanban-card"]:not([data-status="RDV_OK"])').first();
    await expect(other).toBeVisible();
    await expect(other.getByRole('button', { name: /whatsapp/i })).toBeVisible();
    await expect(other.getByRole('button', { name: /email/i })).toBeVisible();
  });

  test('asks which template to use and previews it', async ({ page }) => {
    await navigateToKanban(page);
    await expect(page.getByTestId('kanban-card').first()).toBeVisible({ timeout: 15000 });

    const card = page.locator('[data-testid="kanban-card"]:not([data-status="RDV_OK"])').first();
    await card.getByRole('button', { name: /whatsapp/i }).click();

    // The picker names each template and shows what will actually be sent.
    const options = page.locator('[data-testid^="template-option-"]');
    await expect(options.first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('template-preview')).toBeVisible();

    // Target the two this test created, so templates left by other runs
    // cannot decide which pair gets compared.
    const first = page.getByRole('radio', { name: `E2E Premier avis ${suffix}` });
    const second = page.getByRole('radio', { name: `E2E Rappel ${suffix}` });

    await first.click();
    await expect
      .poll(async () => page.getByTestId('template-preview').innerText(), { timeout: 10000 })
      .toContain('est ouvert');

    await second.click();
    await expect(second).toHaveAttribute('aria-checked', 'true');
    await expect
      .poll(async () => page.getByTestId('template-preview').innerText(), { timeout: 10000 })
      .toContain('Rappel');
  });
});
