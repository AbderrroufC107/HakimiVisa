import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToKanban, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Kanban Drag & Drop', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    // All six columns fit at this width, so the board does not scroll sideways
    // mid-drag. That keeps the test about the drop itself rather than about
    // chasing a column that is sliding under the cursor.
    await page.setViewportSize({ width: 2000, height: 1000 });
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
    expect(handleBox).not.toBeNull();

    const start = {
      x: handleBox!.x + handleBox!.width / 2,
      y: handleBox!.y + handleBox!.height / 2,
    };

    // The board is wider than the viewport, so it scrolls sideways while a card
    // is held. A column measured before the drag has moved by the time the
    // pointer arrives — measure again once dragging has settled, or the card
    // lands in whichever column slid under the cursor.
    const centreOf = async () => {
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      return { x: box!.x + box!.width / 2, y: box!.y + Math.min(80, box!.height / 2) };
    };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 12, start.y + 12, { steps: 4 });

    const firstPass = await centreOf();
    await page.mouse.move(firstPass.x, firstPass.y, { steps: 20 });

    // Chase the column until it is genuinely the active drop target: each move
    // can nudge the board along, so one correction is not always enough.
    await expect
      .poll(
        async () => {
          const settled = await centreOf();
          await page.mouse.move(settled.x, settled.y, { steps: 8 });
          return target.getAttribute('data-drop-active');
        },
        { timeout: 10000 },
      )
      .toBe('true');

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
