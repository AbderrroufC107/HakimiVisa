import { vi } from 'vitest';
import type { AuthUser } from '@/types';

export const mockAuthUser: AuthUser = {
  id: '1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
};

export const mockLogin = vi.fn();
export const mockLogout = vi.fn();

export function createMockAuthContext(overrides?: Partial<ReturnType<typeof getDefaultMockAuth>>) {
  return { ...getDefaultMockAuth(), ...overrides };
}

function getDefaultMockAuth() {
  return {
    user: mockAuthUser,
    isAuthenticated: true,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
  };
}
