import { Page, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

async function doApiLogin(
  page: Page,
  email: string,
  password: string,
  retries = 3,
): Promise<LoginResponse> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let res;
    try {
      res = await page.request.post(`${API_URL}/auth/login`, {
        data: { email, password },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Login request failed for ${email}: ${message}`);
    }

    if (res.ok()) {
      const body = await res.json().catch(async () => {
        const text = await res.text().catch(() => '');
        throw new Error(`Login response was not JSON. HTTP ${res.status()}: ${text.slice(0, 300)}`);
      });
      const data = body?.data as LoginResponse | undefined;

      if (!data?.accessToken || !data?.refreshToken || !data?.user?.email) {
        throw new Error(
          `Login response missing expected auth fields. HTTP ${res.status()}: ${JSON.stringify(body).slice(0, 500)}`,
        );
      }

      return data;
    }

    const body = await res.json().catch(async () => ({
      message: await res.text().catch(() => res.statusText()),
    }));
    const message =
      (Array.isArray(body?.message) ? body.message.join(', ') : body?.message) ||
      body?.error?.[0]?.message ||
      body?.error ||
      res.statusText() ||
      `HTTP ${res.status()}`;

    // Retry on refresh-token unique constraint collisions (same-second iat).
    if (res.status() === 500 && message.includes('refresh_tokens_token_key') && attempt < retries) {
      await new Promise((r) => setTimeout(r, 1200));
      continue;
    }

    throw new Error(`Login failed for ${email}: ${message}`);
  }

  throw new Error(`Login failed for ${email}: exhausted retries`);
}

/** Inject tokens into localStorage so the app reads them on next navigation. */
async function injectTokens(page: Page, data: LoginResponse): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('hakimi_accessToken', accessToken);
      localStorage.setItem('hakimi_refreshToken', refreshToken);
    },
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
  );
}

export async function loginAsAdmin(page: Page): Promise<LoginResponse> {
  const data = await doApiLogin(page, 'admin@hakimivisa.com', 'Admin123!');
  // Navigate to any app page so localStorage is on the right origin, then inject tokens.
  await page.goto('/login');
  await page.waitForSelector('#email');
  await injectTokens(page, data);
  return data;
}

export async function loginAsManager(page: Page): Promise<LoginResponse> {
  const data = await doApiLogin(page, 'manager@hakimivisa.com', 'Admin123!');
  await page.goto('/login');
  await page.waitForSelector('#email');
  await injectTokens(page, data);
  return data;
}

export async function loginAsAgent(page: Page): Promise<LoginResponse> {
  const data = await doApiLogin(page, 'agent@hakimivisa.com', 'Admin123!');
  await page.goto('/login');
  await page.waitForSelector('#email');
  await injectTokens(page, data);
  return data;
}

export async function logout(page: Page): Promise<void> {
  if (page.isClosed()) return;

  try {
    if (page.url() === 'about:blank') {
      await page.goto('/login');
    }
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hakimi_accessToken');
      localStorage.removeItem('hakimi_refreshToken');
    });
  } catch {
    // Page may be on about:blank or a cross-origin page where localStorage is inaccessible.
  }
}

export async function navigateAndLogin(page: Page): Promise<void> {
  await loginAsAdmin(page);
}

export async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/login');
  await expect(page.getByTestId('login-welcome')).toBeVisible({ timeout: 10000 });
}

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToClients(page: Page): Promise<void> {
  await page.goto('/clients');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToVisaCases(page: Page): Promise<void> {
  await page.goto('/visa-cases');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToKanban(page: Page): Promise<void> {
  await page.goto('/kanban');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToAppointments(page: Page): Promise<void> {
  await page.goto('/appointments');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToBackupCenter(page: Page): Promise<void> {
  await page.goto('/backups');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToTracking(page: Page): Promise<void> {
  await page.goto('/tracking');
  await expect(page.getByTestId('tracking-heading')).toBeVisible({ timeout: 10000 });
}

export async function navigateToNotifications(page: Page): Promise<void> {
  await page.goto('/notifications');
  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 });
}
