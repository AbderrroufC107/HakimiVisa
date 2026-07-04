import { api, setAccessToken, setRefreshToken, getRefreshToken } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  CreateManagerRequest,
  AuthUser,
  LoginResponse,
} from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', data);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    return res;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/register', data);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    return res;
  },

  async getProfile(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/profile');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<AuthUser> {
    return api.patch<AuthUser>('/auth/profile', data);
  },

  async createManager(data: CreateManagerRequest): Promise<AuthUser> {
    return api.post<AuthUser>('/users/managers', data);
  },

  async listManagers(): Promise<AuthUser[]> {
    return api.get<AuthUser[]>('/users/managers');
  },

  async deleteManager(id: string): Promise<void> {
    return api.delete<void>(`/users/managers/${id}`);
  },

  async refreshToken(): Promise<LoginResponse> {
    const rt = getRefreshToken();
    const res = await api.post<LoginResponse>('/auth/refresh', { refreshToken: rt });
    setAccessToken(res.accessToken);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    return res;
  },

  async logout(): Promise<void> {
    const rt = getRefreshToken();
    if (rt) {
      try {
        await api.post<void>('/auth/logout', { refreshToken: rt });
      } catch {
        // ignore logout errors
      }
    }
    setAccessToken(null);
    setRefreshToken(null);
  },
};
