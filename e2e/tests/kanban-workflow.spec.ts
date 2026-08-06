import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToKanban } from '../helpers/auth';

test.describe('Kanban Board Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('displays all kanban columns', async ({ page }) => {
    await navigateToKanban(page);

    await expect(page.getByTestId('page-heading')).toHaveText('Case Tracking');
    // The board tracks a case up to delivery; the approve/refuse outcome lives
    // on the decisions page, not here. EN_ATTENTE_AGENCE is the same status as
    // EN_ATTENTE, split out so agency submissions queue separately.
    const columns = [
      'DOSSIER_INCOMPLET',
      'EN_ATTENTE',
      'EN_ATTENTE_AGENCE',
      'EN_TRAITEMENT',
      'RDV_OK',
      'LIVREE',
    ];
    for (const status of columns) {
      // The last column sits off-screen on a narrow viewport, so scroll it in.
      const column = page.getByTestId(`kanban-column-${status}`);
      await column.scrollIntoViewIfNeeded();
      await expect(column).toBeVisible({ timeout: 5000 });
    }
  });

  test('opens a kanban card detail drawer', async ({ page }) => {
    await navigateToKanban(page);

    const card = page.getByTestId('kanban-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.hover();
    await card.getByTestId('kanban-card-view').click();

    await expect(page.getByTestId('kanban-card-drawer')).toBeVisible({ timeout: 5000 });
  });

  test('filters kanban cards by search', async ({ page }) => {
    await navigateToKanban(page);

    const searchInput = page.getByTestId('kanban-search');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('X-NONEXISTENT-999');
    await expect(searchInput).toHaveValue('X-NONEXISTENT-999');
    await expect(page.getByTestId('kanban-card')).toHaveCount(0);
  });
});
