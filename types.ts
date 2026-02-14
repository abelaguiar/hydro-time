export interface IntakeLog {
  id: string;
  timestamp: number; // Unix timestamp
  amountMl: number;
  durationSeconds: number;
}

export type Language = 'en-US' | 'pt-BR';

export interface UserSettings {
  dailyGoalMl: number;
  reminderIntervalMinutes: number;
  notificationsEnabled: boolean;
  language: Language;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS',
}