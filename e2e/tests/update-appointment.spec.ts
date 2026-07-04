import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateToAppointments, type LoginResponse } from '../helpers/auth';
import { API_URL, authHeaders, expectOkJson } from '../helpers/api';

test.describe('Update Appointment', () => {
  let auth: LoginResponse;

  test.beforeEach(async ({ page }) => {
    auth = await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('updates an existing appointment', async ({ page }) => {
    const suffix = `${Date.now()}`;
    const client = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/clients`, {
        headers: authHeaders(auth),
        data: {
          fullName: `Appointment Update ${suffix}`,
          phoneNumber: `+213664${suffix.slice(-6)}`,
          passportNumber: `AU${suffix.slice(-7)}`,
          nationality: 'Algeria',
        },
      }),
    );
    const visaCase = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/visa-cases`, {
        headers: authHeaders(auth),
        data: {
          clientId: client.id,
          visaCountry: 'Germany',
          visaType: 'Work Visa',
        },
      }),
    );
    const appointment = await expectOkJson<{ id: string }>(
      await page.request.post(`${API_URL}/appointments`, {
        headers: authHeaders(auth),
        data: {
          visaCaseId: visaCase.id,
          appointmentDate: '2026-06-20',
          appointmentTime: '09:30',
          appointmentCenter: 'TLS Contact Algiers',
          appointmentType: 'TLS',
          notes: 'Initial appointment',
        },
      }),
    );

    await expectOkJson(
      await page.request.patch(`${API_URL}/appointments/${appointment.id}`, {
        headers: authHeaders(auth),
        data: {
          appointmentDate: '2026-06-21',
          appointmentTime: '14:45',
          appointmentCenter: 'VFS Global Algiers',
          appointmentType: 'VFS',
          notes: 'Updated by E2E',
        },
      }),
    );

    const updated = await expectOkJson<{ appointmentTime: string; appointmentCenter: string; notes: string }>(
      await page.request.get(`${API_URL}/appointments/${appointment.id}`, {
        headers: authHeaders(auth),
      }),
    );
    expect(updated.appointmentTime).toBe('14:45');
    expect(updated.appointmentCenter).toBe('VFS Global Algiers');
    expect(updated.notes).toBe('Updated by E2E');

    await navigateToAppointments(page);
    await expect(page.getByTestId('page-heading')).toBeVisible();
  });
});
