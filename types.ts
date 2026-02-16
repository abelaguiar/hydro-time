export interface IntakeLog {
  id: string;
  timestamp: number; // Unix timestamp
  amountMl: number;
}

export type Language = 'en-US' | 'pt-BR';
export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  dailyGoalMl: number;
  reminderIntervalMinutes: number;
  notificationsEnabled: boolean;
  language: Language;
  theme: Theme;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS',
}

// API Types
export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface IntakeLogPayload {
  amountMl: number;
  timestamp: number;
}

export interface IntakeLogsResponse {
  intakeLogs: IntakeLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserSettingsUpdate {
  dailyGoalMl?: number;
  reminderIntervalMinutes?: number;
  notificationsEnabled?: boolean;
  language?: string;
  theme?: string;
}

export interface StatsOverview {
  todayTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  dailyGoal: number;
  dailyGoalMet: boolean;
  monthlyStatus: 'completed' | 'on_track';
}
