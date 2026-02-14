import { UserSettings } from './types';

export const QUICK_ADD_AMOUNTS = [100, 200, 300, 500];

export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalMl: 2500,
  reminderIntervalMinutes: 60,
  notificationsEnabled: false,
  language: 'pt-BR',
  theme: 'system',
};

export const STORAGE_KEYS = {
  LOGS: 'hydrotime_logs',
  SETTINGS: 'hydrotime_settings',
};

export const TRANSLATIONS = {
  'en-US': {
    dailyProgress: 'Daily Progress',
    howMuch: 'How much did you drink?',
    addWater: 'Add Water',
    amountPlaceholder: 'Amount (ml)',
    add: 'Add',
    history: 'History',
    noRecords: 'No records found.',
    startTracking: 'Start tracking your hydration!',
    total: 'Total',
    duration: 'Duration',
    statistics: 'Statistics',
    last7Days: 'Last 7 Days',
    totalAllTime: 'Total All Time',
    settings: 'Settings',
    dailyGoal: 'Daily Goal (ml)',
    notifications: 'Notifications',
    reminderInterval: 'Interval (minutes)',
    exportCsv: 'Export History to CSV',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    navHome: 'Home',
    navStats: 'Stats',
    navHistory: 'History',
    navSettings: 'Settings',
    seconds: 's',
    // New translations
    overview: 'Overview',
    weeklyTotal: 'Last 7 Days',
    monthlyTotal: 'Current Month',
    goalMet: 'Goal Met!',
    keepGoing: 'Keep Going',
    onTrack: 'On Track',
    behindSchedule: 'Behind',
    dailyGoalMet: 'Daily Goal Achieved!'
  },
  'pt-BR': {
    dailyProgress: 'Progresso Diário',
    howMuch: 'Quanto você bebeu?',
    addWater: 'Adicionar Água',
    amountPlaceholder: 'Quantidade (ml)',
    add: 'Adicionar',
    history: 'Histórico',
    noRecords: 'Nenhum registro encontrado.',
    startTracking: 'Comece a monitorar sua hidratação!',
    total: 'Total',
    duration: 'Duração',
    statistics: 'Estatísticas',
    last7Days: 'Últimos 7 Dias',
    totalAllTime: 'Total Acumulado',
    settings: 'Configurações',
    dailyGoal: 'Meta Diária (ml)',
    notifications: 'Notificações',
    reminderInterval: 'Intervalo (minutos)',
    exportCsv: 'Exportar Histórico (CSV)',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',
    navHome: 'Início',
    navStats: 'Estatísticas',
    navHistory: 'Histórico',
    navSettings: 'Ajustes',
    seconds: 's',
    // New translations
    overview: 'Resumo',
    weeklyTotal: 'Últimos 7 dias',
    monthlyTotal: 'Mês Atual',
    goalMet: 'Meta Batida!',
    keepGoing: 'Continue assim',
    onTrack: 'No Ritmo',
    behindSchedule: 'Atrasado',
    dailyGoalMet: 'Meta Diária Concluída!'
  }
};