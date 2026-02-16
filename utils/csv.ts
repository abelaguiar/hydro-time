import { IntakeLog } from '../types';

export const exportToCSV = (logs: IntakeLog[]) => {
  const headers = ['Date', 'Time', 'Amount (ml)'];
  const rows = logs.map(log => {
    const date = new Date(log.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      log.amountMl
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `hydrotime_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};