import { vi } from 'vitest';

export const api = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

export const setAccessToken = vi.fn();
export const getAccessToken = vi.fn();
