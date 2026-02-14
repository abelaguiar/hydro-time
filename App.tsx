import React, { useState, useEffect, useCallback } from 'react';
import { IntakeLog, UserSettings, AppView, Language } from './types';
import { getLogs, saveLogs, getSettings, saveSettings } from './utils/storage';
import { exportToCSV } from './utils/csv';
import { QUICK_ADD_AMOUNTS, TRANSLATIONS, DEFAULT_SETTINGS } from './constants';
import { ProgressBar } from './components/ProgressBar';
import { Timer } from './components/Timer';
import { HistoryList } from './components/HistoryList';
import { WeeklyChart } from './components/WeeklyChart';

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [manualInput, setManualInput] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    setLogs(getLogs());
    const savedSettings = getSettings();
    setSettings(savedSettings);
  }, []);

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

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

  const addLog = useCallback((amount: number, duration: number = 0) => {
    const newLog: IntakeLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      amountMl: amount,
      durationSeconds: duration
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setTimerDuration(null); 
    
    if(view !== AppView.DASHBOARD) setView(AppView.DASHBOARD);

  }, [logs, view]);

  const getTodayTotal = () => {
    const today = new Date().toLocaleDateString(settings.language);
    return logs
      .filter(log => new Date(log.timestamp).toLocaleDateString(settings.language) === today)
      .reduce((sum, log) => sum + log.amountMl, 0);
  };

  const handleTimerFinish = (duration: number) => {
    setTimerDuration(duration);
  };

  const handleManualAdd = () => {
    const amount = parseInt(manualInput);
    if (!isNaN(amount) && amount > 0) {
      addLog(amount, timerDuration || 0);
      setManualInput('');
    }
  };

  const toggleLanguage = () => {
    setSettings(prev => ({
      ...prev,
      language: prev.language === 'en-US' ? 'pt-BR' : 'en-US'
    }));
  };

  // Render Functions
  const renderDashboard = () => (
    <div className="animate-fade-in pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column (Tablet): Progress */}
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-white to-hydro-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-sm border border-hydro-100 dark:border-slate-700 relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-hydro-200/20 dark:bg-hydro-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <h2 className="text-xl font-bold text-center text-slate-700 dark:text-slate-200 mb-2 relative z-10">{t.dailyProgress}</h2>
            <ProgressBar current={getTodayTotal()} goal={settings.dailyGoalMl} />
          </div>
        </div>

        {/* Right Column (Tablet): Actions */}
        <div className="flex flex-col gap-6">
          <Timer 
            onFinish={handleTimerFinish} 
            labels={{ title: t.intakeTimer, start: t.startDrinking, finish: t.finishDrinking }}
          />

          {timerDuration !== null && (
            <div className="animate-bounce-short bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center">
              <p className="text-green-700 dark:text-green-400 font-medium">{t.timerFinished} ({timerDuration}s)</p>
              <p className="text-sm text-green-600 dark:text-green-500">{t.howMuch}</p>
            </div>
          )}

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
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-hydro-500 dark:text-white transition-shadow"
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
                  onClick={() => addLog(amount, timerDuration || 0)}
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
  );

  const renderHistory = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{t.history}</h2>
      <HistoryList 
        logs={logs} 
        locale={settings.language} 
        labels={{
          noRecords: t.noRecords,
          startTracking: t.startTracking,
          total: t.total,
          duration: t.duration,
          seconds: t.seconds
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

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            {t.dailyGoal}
          </label>
          <input
            type="number"
            value={settings.dailyGoalMl}
            onChange={(e) => setSettings({ ...settings, dailyGoalMl: Number(e.target.value) })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-hydro-500 dark:text-white font-bold text-lg"
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
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-hydro-500 dark:text-white font-bold text-lg"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
           <button
             onClick={() => exportToCSV(logs)}
             className="w-full py-4 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             {t.exportCsv}
           </button>
        </div>
      </div>
    </div>
  );

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