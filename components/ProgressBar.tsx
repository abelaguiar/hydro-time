import React from 'react';

interface ProgressBarProps {
  current: number;
  goal: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  // Ensure goal is valid to avoid NaN
  const validGoal = goal && goal > 0 ? goal : 2500;
  const percentage = Math.min(100, Math.max(0, (current / validGoal) * 100));
  const radius = 130;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center my-8 relative">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            stroke="url(#progressGradient)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className=""
          />
        </svg>
        <div className="absolute flex flex-col items-center gap-1">
          <span className="text-5xl font-bold text-slate-800 dark:text-white">
            {isNaN(percentage) ? 0 : Math.round(percentage)}%
          </span>
          <span className="text-base font-medium text-slate-600 dark:text-slate-300">
            {current} / {validGoal} ml
          </span>
        </div>
      </div>
    </div>
  );
};