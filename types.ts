export interface IntakeLog {
  id: string;
  timestamp: number; // Unix timestamp
  amountMl: number;
  durationSeconds: number;
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