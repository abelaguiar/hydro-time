import React from 'react';
import { IntakeLog } from '../types';

interface HistoryListProps {
  logs: IntakeLog[];
  locale: string;
  labels: {
    noRecords: string;
    startTracking: string;
    total: string;
    duration: string;
    seconds: string;
  };
}

export const HistoryList: React.FC<HistoryListProps> = ({ logs, locale, labels }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  // Group logs by date
  const groupedLogs: { [key: string]: IntakeLog[] } = {};
  sortedLogs.forEach(log => {
    const dateKey = new Date(log.timestamp).toLocaleDateString(locale);
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  if (sortedLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <p>{labels.noRecords}</p>
        <p className="text-sm">{labels.startTracking}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {Object.keys(groupedLogs).map(dateKey => {
        const dayTotal = groupedLogs[dateKey].reduce((sum, log) => sum + log.amountMl, 0);
        
        return (
          <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">{dateKey}</h3>
              <span className="text-sm font-medium text-hydro-600 dark:text-hydro-400">{labels.total}: {dayTotal}ml</span>
            </div>
            <div className="space-y-3">
              {groupedLogs[dateKey].map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-800 dark:text-slate-300 font-medium">
                      {new Date(log.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {log.durationSeconds > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {labels.duration}: {log.durationSeconds}{labels.seconds}
                      </span>
                    )}
                  </div>
                  <span className="text-hydro-600 dark:text-hydro-400 font-bold bg-hydro-50 dark:bg-slate-700 px-3 py-1 rounded-full">
                    {log.amountMl} ml
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};