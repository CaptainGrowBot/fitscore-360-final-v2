
import React from 'react';

interface RadialScoreProps {
  score: number;
  label: string;
  size?: 'sm' | 'lg';
  color?: string;
}

export const RadialScore: React.FC<RadialScoreProps> = ({ score, label, size = 'lg', color = 'text-fit-accent' }) => {
  const radius = size === 'lg' ? 45 : 30;
  const stroke = size === 'lg' ? 8 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-100"
          />
          <circle
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={color}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-black text-black`}>{score}%</span>
        </div>
      </div>
      <span className={`mt-2 font-bold text-xs text-slate-500 uppercase tracking-tight`}>{label}</span>
    </div>
  );
};
