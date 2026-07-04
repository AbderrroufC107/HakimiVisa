export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface CreateManagerRequest extends UpdateProfileRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';
