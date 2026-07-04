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

    await expect(page.getByTestId('page-heading')).toHaveText('Kanban Board');
    for (const status of ['EN_ATTENTE', 'EN_TRAITEMENT', 'RDV_OK', 'VISA_OK', 'VISA_REFUSEE']) {
      await expect(page.getByTestId(`kanban-column-${status}`)).toBeVisible({ timeout: 5000 });
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
