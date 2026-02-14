import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  onFinish: (durationSeconds: number) => void;
  labels: {
    title: string;
    start: string;
    finish: string;
  };
}

export const Timer: React.FC<TimerProps> = ({ onFinish, labels }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now() - elapsed * 1000;
      intervalRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, elapsed]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    onFinish(elapsed);
    setElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-hydro-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-sm border border-hydro-100 dark:border-slate-700 mb-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4 text-hydro-600 dark:text-hydro-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-bold">{labels.title}</h3>
      </div>
      
      <div className="text-6xl font-mono font-bold text-slate-800 dark:text-white mb-8 tracking-wider">
        {formatTime(elapsed)}
      </div>
      
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-full bg-hydro-500 hover:bg-hydro-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-hydro-500/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            {labels.start}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-slate-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            {labels.finish}
          </button>
        )}
      </div>
    </div>
  );
};