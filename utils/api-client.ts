import { 
  AuthResponse, 
  LoginPayload, 
  RegisterPayload, 
  IntakeLog, 
  IntakeLogsResponse,
  UserSettings,
  UserSettingsUpdate,
  StatsOverview,
  IntakeLogPayload
} from '../types';

const API_URL = (import.meta as any).env.MODE === 'production' 
  ? ((import.meta as any).env.VITE_API_URL_PROD || 'https://api-hydro-time-mckv.vercel.app')
  : ((import.meta as any).env.VITE_API_URL || 'http://localhost:5000');

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async login(data: LoginPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  // Intake endpoints
  async addIntake(data: IntakeLogPayload): Promise<IntakeLog> {
    return this.request<IntakeLog>('/intake', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIntakeLogs(limit: number = 100, offset: number = 0): Promise<IntakeLogsResponse> {
    return this.request<IntakeLogsResponse>(`/intake?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async deleteIntake(id: string): Promise<void> {
    await this.request<void>(`/intake/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings endpoints
  async getSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/user/settings', {
      method: 'GET',
    });
  }

  async updateSettings(data: UserSettingsUpdate): Promise<UserSettings> {
    return this.request<UserSettings>('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Stats endpoints
  async getStats(): Promise<StatsOverview> {
    return this.request<StatsOverview>('/stats/overview', {
      method: 'GET',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
