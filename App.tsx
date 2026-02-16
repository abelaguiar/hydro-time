import React, { useState, useEffect, useCallback } from 'react';
import { IntakeLog, UserSettings, AppView, Language, Theme } from './types';
import { getLogs, saveLogs, getSettings, saveSettings } from './utils/storage';
import { exportToCSV } from './utils/csv';
import { QUICK_ADD_AMOUNTS, TRANSLATIONS, DEFAULT_SETTINGS } from './constants';
import { ProgressBar } from './components/ProgressBar';
import { HistoryList } from './components/HistoryList';
import { WeeklyChart } from './components/WeeklyChart';
import { Login } from './components/Login';
import { apiClient } from './utils/api-client';
import { authService, AuthUser } from './utils/auth';

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [manualInput, setManualInput] = useState<string>('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Check authentication and load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Check if user is already logged in
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            
            // Load data from API
            try {
              const [intakeResponse, settingsResponse] = await Promise.all([
                apiClient.getIntakeLogs(1000, 0),
                apiClient.getSettings(),
              ]);
              
              // Transform API intake logs to local format
              const transformedLogs: IntakeLog[] = intakeResponse.intakeLogs.map(log => ({
                id: log.id,
                timestamp: typeof log.timestamp === 'string' ? parseInt(log.timestamp, 10) : log.timestamp,
                amountMl: log.amountMl,
                durationSeconds: log.durationSeconds || 0,
              }));
              
              console.log('Logs carregados da API:', intakeResponse.intakeLogs.length);
              console.log('Primeiro log:', transformedLogs[0]);
              console.log('Data do primeiro log:', transformedLogs[0] ? new Date(transformedLogs[0].timestamp).toLocaleString('pt-BR') : 'N/A');
              
              setLogs(transformedLogs);
              
              // Update settings
              const apiSettings: UserSettings = {
                dailyGoalMl: settingsResponse.settings.dailyGoalMl,
                reminderIntervalMinutes: settingsResponse.settings.reminderIntervalMinutes,
                notificationsEnabled: settingsResponse.settings.notificationsEnabled,
                language: settingsResponse.settings.language as Language,
                theme: settingsResponse.settings.theme as Theme,
              };
              setSettings(apiSettings);
              setSyncError(null);
            } catch (error) {
              console.error('Error loading from API, using local storage:', error);
              // Fallback to local storage
              setLogs(getLogs());
              const savedSettings = getSettings();
              setSettings(savedSettings);
              setSyncError('Usando dados locais');
            }
          }
        } else {
          // No authentication, use local data
          setLogs(getLogs());
          const savedSettings = getSettings();
          setSettings(savedSettings);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Save settings when changed - sync with API if authenticated
  useEffect(() => {
    if (user) {
      apiClient.updateSettings({
        dailyGoalMl: settings.dailyGoalMl,
        reminderIntervalMinutes: settings.reminderIntervalMinutes,
        notificationsEnabled: settings.notificationsEnabled,
        language: settings.language,
        theme: settings.theme,
      }).catch(err => {
        console.error('Error syncing settings to API:', err);
      });
    } else {
      saveSettings(settings);
    }
  }, [settings, user]);

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      const isDark = settings.theme === 'dark' || 
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listener for system changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') applyTheme();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Helper for translations
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS['pt-BR'];

  // Request notification permission if enabled
  useEffect(() => {
    if (settings.notificationsEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  // Notification Interval
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const interval = setInterval(() => {
      new Notification("HydroTime", {
        body: t.startDrinking, // Simplified notification message
      });
    }, settings.reminderIntervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, settings.reminderIntervalMinutes, t]);

  const addLog = useCallback((amount: number) => {
    const newLog: IntakeLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: amount
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    
    // Sync with API if authenticated
    if (user) {
      apiClient.addIntake({
        amountMl: amount,
        timestamp: newLog.timestamp
      }).catch(err => {
        console.error('Error syncing intake to API:', err);
        setSyncError('Erro ao sincronizar');
      });
    } else {
      saveLogs(updatedLogs);
    }
    
    if(view !== AppView.DASHBOARD) setView(AppView.DASHBOARD);

  }, [logs, view, user]);

  const getTodayTotal = () => {
    const today = new Date().toLocaleDateString(settings.language);
    const todayLogs = logs.filter(log => new Date(log.timestamp).toLocaleDateString(settings.language) === today);
    const total = todayLogs.reduce((sum, log) => sum + log.amountMl, 0);
    
    console.log('Data de hoje formatada:', today);
    console.log('Total de logs:', logs.length);
    console.log('Logs de hoje:', todayLogs.length);
    console.log('Total de ml hoje:', total);
    
    return total;
  };

  // Helper calculations for new counters
  const getWeeklyTotal = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logs
      .filter(log => log.timestamp >= oneWeekAgo.getTime())
      .reduce((sum, log) => sum + log.amountMl, 0);
  };

  const getMonthlyTotal = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return logs
      .filter(log => {
        const date = new Date(log.timestamp);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, log) => sum + log.amountMl, 0);
  };

  const getMonthlyStatus = () => {
    const monthlyTotal = getMonthlyTotal();
    const dayOfMonth = new Date().getDate();
    // Theoretical target: Daily Goal * Days Passed so far
    const expected = dayOfMonth * settings.dailyGoalMl;
    return monthlyTotal >= expected;
  };

  const handleManualAdd = () => {
    const amount = parseInt(manualInput);
    if (!isNaN(amount) && amount > 0) {
      addLog(amount, 0);
      setManualInput('');
    }
  };

  const handleLoginSuccess = async (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    authService.storeUser(loggedInUser);
    
    // Reload data from API
    try {
      const [intakeResponse, settingsResponse] = await Promise.all([
        apiClient.getIntakeLogs(1000, 0),
        apiClient.getSettings(),
      ]);
      
      const transformedLogs: IntakeLog[] = intakeResponse.intakeLogs.map(log => ({
        id: log.id,
        timestamp: typeof log.timestamp === 'string' ? parseInt(log.timestamp, 10) : log.timestamp,
        amountMl: log.amountMl,
      }));
      
      setLogs(transformedLogs);
      
      const apiSettings: UserSettings = {
        dailyGoalMl: settingsResponse.settings.dailyGoalMl,
        reminderIntervalMinutes: settingsResponse.settings.reminderIntervalMinutes,
        notificationsEnabled: settingsResponse.settings.notificationsEnabled,
        language: settingsResponse.settings.language as Language,
        theme: settingsResponse.settings.theme as Theme,
      };
      setSettings(apiSettings);
      setView(AppView.DASHBOARD); // Return to dashboard after login
    } catch (error) {
      console.error('Error loading data after login:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    authService.logout();
    apiClient.clearToken();
    setLogs([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const renderDashboard = () => {
    const todayTotal = getTodayTotal();
    const isDailyGoalMet = todayTotal >= settings.dailyGoalMl;
    const isMonthOnTrack = getMonthlyStatus();

    return (
    <div className="animate-fade-in pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Progress */}
        <div className="flex flex-col">
          <div className={`bg-gradient-to-br ${isDailyGoalMet ? 'from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800' : 'from-white to-hydro-50 dark:from-slate-800 dark:to-slate-900 border-hydro-100 dark:border-slate-700'} transition-all duration-500 rounded-3xl p-6 shadow-sm border relative overflow-hidden flex-1 flex flex-col justify-center`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-hydro-200/20 dark:bg-hydro-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <h2 className="text-xl font-bold text-center text-slate-700 dark:text-slate-200 mb-2 relative z-10">{t.dailyProgress}</h2>
            
            {todayTotal === 0 ? (
              <div className="flex flex-col items-center justify-center my-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-hydro-200 to-hydro-100 dark:from-hydro-900/30 dark:to-hydro-800/30 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-hydro-500 dark:text-hydro-400">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 8.463 19.123 4.293 12 0C4.877 4.293 2 8.463 2 12C2 17.5228 6.47715 22 12 22Z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">{t.startDrinking}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Meta: {settings.dailyGoalMl} ml</p>
              </div>
            ) : (
              <ProgressBar current={todayTotal} goal={settings.dailyGoalMl} />
            )}
            
            {/* Daily Goal Success Indicator */}
            {isDailyGoalMet && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 py-2 px-4 rounded-xl animate-bounce-short">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm">{t.dailyGoalMet}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Overview & Actions */}
        <div className="flex flex-col gap-6">
          
          {/* New Stats Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
             {/* Weekly Card */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.weeklyTotal}</span>
                {getWeeklyTotal() === 0 ? (
                  <div className="mt-3 flex flex-col justify-center">
                    <div className="text-3xl font-black text-slate-400 dark:text-slate-500">—</div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-700 dark:text-white">{(getWeeklyTotal() / 1000).toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">L</span>
                  </div>
                )}
             </div>

             {/* Monthly Card with Status */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute right-2 top-2 w-3 h-3 rounded-full ${isMonthOnTrack ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.monthlyTotal}</span>
                {getMonthlyTotal() === 0 ? (
                  <div className="mt-3 flex flex-col justify-center">
                    <div className="text-3xl font-black text-slate-400 dark:text-slate-500">—</div>
                    <span className="text-[10px] font-bold mt-2 text-slate-400 dark:text-slate-500">
                      {t.startDrinking}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-700 dark:text-white">{(getMonthlyTotal() / 1000).toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">L</span>
                    <span className={`text-[10px] font-bold mt-1 block ${isMonthOnTrack ? 'text-green-500' : 'text-orange-400'}`}>
                      {isMonthOnTrack ? t.onTrack : t.behindSchedule}
                    </span>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-hydro-100 dark:bg-slate-700 flex items-center justify-center text-hydro-500 dark:text-hydro-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t.addWater}</h3>
            </div>
            
            {/* Fixed responsive layout for input and button */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={t.amountPlaceholder}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-hydro-500 text-slate-900 dark:text-white transition-shadow"
              />
              <button
                onClick={handleManualAdd}
                disabled={!manualInput}
                className="bg-slate-800 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-slate-200 dark:shadow-none w-full sm:w-auto"
              >
                {t.add}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {QUICK_ADD_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => addLog(amount, 0)}
                  className="group flex flex-col items-center justify-center p-3 bg-hydro-50 dark:bg-slate-700/50 hover:bg-hydro-100 dark:hover:bg-slate-700 border border-transparent hover:border-hydro-200 dark:hover:border-slate-600 rounded-2xl transition-all active:scale-95"
                >
                  <div className="text-hydro-500 dark:text-hydro-400 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 8.463 19.123 4.293 12 0C4.877 4.293 2 8.463 2 12C2 17.5228 6.47715 22 12 22Z" />
                    </svg>
                  </div>
                  <span className="text-hydro-900 dark:text-hydro-100 font-bold text-sm">
                    {amount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )};

  const renderHistory = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{t.history}</h2>
      <HistoryList 
        logs={logs} 
        locale={settings.language} 
        labels={{
          noRecords: t.noRecords,
          startTracking: t.startTracking,
          total: t.total
        }}
      />
    </div>
  );

  const renderStats = () => (
    <div className="animate-fade-in pb-24">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{t.statistics}</h2>
      
      <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
           <WeeklyChart 
             logs={logs} 
             locale={settings.language} 
             labels={{ title: t.last7Days }}
           />
        </div>
        
        <div className="md:col-span-1 h-full">
          <div className="h-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
             <h3 className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">{t.totalAllTime}</h3>
             <p className="text-4xl font-black text-hydro-600 dark:text-hydro-400 mt-2">
                {(logs.reduce((acc, curr) => acc + curr.amountMl, 0) / 1000).toFixed(1)} <span className="text-xl">L</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-fade-in space-y-6 pb-24">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{t.settings}</h2>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 max-w-2xl mx-auto md:mx-0">
        
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            {t.language}
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
             <button 
               onClick={() => setSettings({...settings, language: 'pt-BR'})}
               className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${settings.language === 'pt-BR' ? 'bg-white dark:bg-slate-700 text-hydro-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
               Português
             </button>
             <button 
               onClick={() => setSettings({...settings, language: 'en-US'})}
               className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${settings.language === 'en-US' ? 'bg-white dark:bg-slate-700 text-hydro-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
               English
             </button>
          </div>
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            {t.theme}
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
             <button 
               onClick={() => setSettings({...settings, theme: 'light'})}
               className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${settings.theme === 'light' ? 'bg-white dark:bg-slate-700 text-hydro-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
               {t.themeLight}
             </button>
             <button 
               onClick={() => setSettings({...settings, theme: 'dark'})}
               className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${settings.theme === 'dark' ? 'bg-white dark:bg-slate-700 text-hydro-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
               {t.themeDark}
             </button>
             <button 
               onClick={() => setSettings({...settings, theme: 'system'})}
               className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${settings.theme === 'system' ? 'bg-white dark:bg-slate-700 text-hydro-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
               {t.themeSystem}
             </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            {t.dailyGoal}
          </label>
          <input
            type="number"
            value={settings.dailyGoalMl}
            onChange={(e) => setSettings({ ...settings, dailyGoalMl: Number(e.target.value) })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-hydro-500 text-slate-900 dark:text-white font-bold text-lg"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-700 dark:text-slate-300 font-bold">{t.notifications}</span>
          <button
            onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.notificationsEnabled ? 'bg-hydro-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {settings.notificationsEnabled && (
          <div className="animate-fade-in">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              {t.reminderInterval}
            </label>
            <input
              type="number"
              value={settings.reminderIntervalMinutes}
              onChange={(e) => setSettings({ ...settings, reminderIntervalMinutes: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-hydro-500 text-slate-900 dark:text-white font-bold text-lg"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
           <button
             onClick={() => exportToCSV(logs)}
             className="w-full py-4 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             {t.exportCsv}
           </button>
           
           {user && (
             <button
               onClick={handleLogout}
               className="w-full py-4 px-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
               Sair
             </button>
           )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-hydro-500 to-hydro-300 flex items-center justify-center text-white shadow-lg shadow-hydro-500/30 mx-auto mb-4 animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 8.463 19.123 4.293 12 0C4.877 4.293 2 8.463 2 12C2 17.5228 6.47715 22 12 22Z" />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-hydro-200">
      <div className="w-full md:max-w-4xl lg:max-w-5xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl relative overflow-hidden md:border-x md:border-slate-200 dark:md:border-slate-800">
        
        {/* Header */}
        <header className="px-6 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Hydro<span className="text-hydro-500">Time</span>
          </h1>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {view === AppView.DASHBOARD && renderDashboard()}
          {view === AppView.HISTORY && renderHistory()}
          {view === AppView.STATS && renderStats()}
          {view === AppView.SETTINGS && renderSettings()}
        </main>

        {/* Bottom Navigation - Adapts to 'dock' style on tablet */}
        <nav className="fixed bottom-0 left-0 right-0 w-full md:max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 safe-pb md:bottom-6 md:rounded-2xl md:border md:shadow-2xl transition-all duration-300">
          <NavButton 
            active={view === AppView.DASHBOARD} 
            onClick={() => setView(AppView.DASHBOARD)} 
            label={t.navHome}
            icon={<HomeIcon />}
          />
          <NavButton 
            active={view === AppView.STATS} 
            onClick={() => setView(AppView.STATS)} 
            label={t.navStats}
            icon={<StatsIcon />}
          />
          <NavButton 
            active={view === AppView.HISTORY} 
            onClick={() => setView(AppView.HISTORY)} 
            label={t.navHistory}
            icon={<HistoryIcon />}
          />
          <NavButton 
            active={view === AppView.SETTINGS} 
            onClick={() => setView(AppView.SETTINGS)} 
            label={t.navSettings}
            icon={<SettingsIcon />}
          />
        </nav>

      </div>
    </div>
  );
}

// Logo
const LogoIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-hydro-500 to-hydro-300 flex items-center justify-center text-white shadow-lg shadow-hydro-500/30">
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 8.463 19.123 4.293 12 0C4.877 4.293 2 8.463 2 12C2 17.5228 6.47715 22 12 22Z" />
      <path d="M12 6V12L15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Icons
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

const StatsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0zm1.5 0a6.75 6.75 0 006.75 6.75v-6H3.75z" clipRule="evenodd" />
    <path d="M12 10.5V3a.75.75 0 01.75.75 8.25 8.25 0 018.17 7.5H12.75a.75.75 0 01-.75-.75z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 01-.517.608 7.45 7.45 0 00-.478.198.798.798 0 01-.796-.064l-.453-.324a1.875 1.875 0 00-2.416.2l-.043.044a1.875 1.875 0 00-.2 2.416l.324.453a.798.798 0 01.064.796 7.448 7.448 0 00-.198.478.798.798 0 01-.608.517l-.55.092a1.875 1.875 0 00-1.566 1.849v.044c0 .917.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 01-.064.796l-.324.453a1.875 1.875 0 00.2 2.416l.044.043a1.875 1.875 0 002.416.2l.453-.324a.798.798 0 01.796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.044c.917 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 01.517-.608 7.52 7.52 0 00.478-.198.798.798 0 01.796.064l.453.324a1.875 1.875 0 002.416-.2l.043-.044a1.875 1.875 0 00.2-2.416l-.324-.453a.798.798 0 01-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.092a1.875 1.875 0 001.566-1.849v-.044c0-.917-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 01-.608-.517 7.507 7.507 0 00-.198-.478.798.798 0 01.064-.796l.324-.453a1.875 1.875 0 00-.2-2.416l-.044-.043a1.875 1.875 0 00-2.416-.2l-.453.324a.798.798 0 01-.796.064 7.462 7.462 0 00-.478-.198.798.798 0 01-.517-.608l-.092-.55a1.875 1.875 0 00-1.849-1.566h-.044zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
  </svg>
);

const NavButton = ({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors w-16 ${active ? 'text-hydro-500 dark:text-hydro-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
  >
    <div className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110 -translate-y-1 drop-shadow-md' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default App;