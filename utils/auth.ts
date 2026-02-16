import { apiClient } from './api-client';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

class AuthService {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.login(payload);
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient.register(payload);
  }

  logout(): void {
    apiClient.clearToken();
    localStorage.removeItem('auth_user');
  }

  getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  storeUser(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
