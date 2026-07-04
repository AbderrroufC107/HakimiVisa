import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToKanban, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Kanban Drag & Drop', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('moves a card to another kanban status', async ({ page }) => {
    const suffix = `${Date.now()}`;
    const client = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/clients`, {
        headers: authHeaders(auth),
        data: {
          fullName: `Kanban Move ${suffix}`,
          phoneNumber: `+213665${suffix.slice(-6)}`,
          passportNumber: `KM${suffix.slice(-7)}`,
          nationality: 'Algeria',
        },
      }),
    );
    const visaCase = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/visa-cases`, {
        headers: authHeaders(auth),
        data: {
          clientId: client.id,
          visaCountry: 'Italy',
          visaType: 'Schengen',
        },
      }),
    );

    await navigateToKanban(page);
    await page.getByTestId('kanban-search').fill(`Kanban Move ${suffix}`);

    const card = page.locator(`[data-testid="kanban-card"][data-case-id="${visaCase.id}"]`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('kanban-card')).toHaveCount(1);
    await expect(card).toHaveAttribute('data-status', 'EN_ATTENTE');

    const handle = card.getByTestId('kanban-card-drag-handle');
    const target = page.getByTestId('kanban-dropzone-EN_TRAITEMENT');
    await expect(target).toBeVisible();

    const handleBox = await handle.boundingBox();
    const targetBox = await target.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    const start = {
      x: handleBox!.x + handleBox!.width / 2,
      y: handleBox!.y + handleBox!.height / 2,
    };
    const end = {
      x: targetBox!.x + targetBox!.width / 2,
      y: targetBox!.y + Math.min(80, targetBox!.height / 2),
    };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 12, start.y + 12, { steps: 4 });
    await page.mouse.move(end.x, end.y, { steps: 20 });
    await page.mouse.up();

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
  });
});
