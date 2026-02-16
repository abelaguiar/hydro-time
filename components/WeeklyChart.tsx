import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IntakeLog } from '../types';

interface WeeklyChartProps {
  logs: IntakeLog[];
  locale: string;
  labels: {
    title: string;
  };
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ logs, locale, labels }) => {
  const processData = () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Set day boundaries for comparison
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Filter logs within this day
      const dayLogs = logs.filter(l => {
        const logDate = new Date(l.timestamp);
        return logDate >= dayStart && logDate < dayEnd;
      });
      
      const total = dayLogs.reduce((sum, l) => sum + l.amountMl, 0);
      const dateStr = d.toLocaleDateString(locale);
      
      last7Days.push({
        name: d.toLocaleDateString(locale, { weekday: 'short' }),
        fullDate: dateStr,
        total: total
      });
    }
    return last7Days;
  };

  const data = processData();

  return (
    <div className="h-72 w-full bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mt-4">
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6">{labels.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <defs>
             <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={24} fill="url(#barGradient)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};