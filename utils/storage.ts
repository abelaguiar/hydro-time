import { IntakeLog, UserSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export const getLogs = (): IntakeLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

export const saveLogs = (logs: IntakeLog[]) => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
};

export const getSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = stored ? JSON.parse(stored) : {};
    // Merge with defaults to ensure new fields (like language) are present for existing users
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Failed to parse settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};