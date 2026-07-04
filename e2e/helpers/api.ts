import { APIResponse, expect } from '@playwright/test';
import type { LoginResponse } from './auth';

export const API_URL = process.env.API_URL || 'http://localhost:4000/api';

export function authHeaders(auth: LoginResponse) {
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export async function expectOkJson<T>(response: APIResponse): Promise<T> {
  const text = await response.text();
  expect(response.ok(), text).toBeTruthy();
  const body = JSON.parse(text);
  return body.data as T;
}
