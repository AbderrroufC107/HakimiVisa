import type { ApiError } from '@/types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

const ACCESS_TOKEN_KEY = 'hakimi_accessToken';
const REFRESH_TOKEN_KEY = 'hakimi_refreshToken';

function readStoredToken(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

let accessToken: string | null = readStoredToken(ACCESS_TOKEN_KEY);
let refreshToken: string | null = readStoredToken(REFRESH_TOKEN_KEY);

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
      else localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

interface ApiEnvelope<T> {
  data: T;
  message: string;
  statusCode: number;
}

class ApiService {
  private baseUrl: string;
  private isRefreshing = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry && refreshToken) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const rt = refreshToken;
          const res = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (res.ok) {
            const body = await res.json();
            setAccessToken(body.data.accessToken);
            if (body.data.refreshToken) setRefreshToken(body.data.refreshToken);
            this.isRefreshing = false;
            return this.request<T>(endpoint, options, true);
          }
        } catch {
          // refresh failed
        }
        this.isRefreshing = false;
      }
      setAccessToken(null);
      setRefreshToken(null);
      window.location.href = '/login';
      throw { statusCode: 401, message: 'Session expired', error: 'Unauthorized' } as ApiError;
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
        error: 'Unknown error',
      }))) as ApiError;
      throw error;
    }

    const body = (await response.json()) as ApiEnvelope<T>;
    return body.data;
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    const searchParams = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${searchParams}`);
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService(API_URL);
