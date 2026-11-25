'use client';

import React from 'react';
import { PreservationStatus } from '@/types/analysis';

interface ScoreGaugeProps {
  score: number; // 1.0 to 10.0
  status: PreservationStatus;
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, status, size = 160 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Normalized score (0 to 1)
  const normalized = Math.min(Math.max((score - 1) / 9, 0), 1);
  const strokeDashoffset = circumference - normalized * circumference;

  const colorConfig = {
    preserved: {
      stroke: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.2)',
      label: 'Preserved Meaning',
      badgeClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    },
    subtle_shift: {
      stroke: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.2)',
      label: 'Subtle Shift / Ambiguity',
      badgeClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    },
    critical_alteration: {
      stroke: '#F87171',
      bgGlow: 'rgba(248, 113, 113, 0.25)',
      label: 'Critical Alteration',
      badgeClass: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    },
  }[status];

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700"
          style={{ background: colorConfig.bgGlow }}
        />

        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(214, 180, 106, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="text-3xl font-serif font-bold text-text-primary tracking-tight">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
            / 10 LMP
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${colorConfig.badgeClass}`}
        >
          {colorConfig.label}
        </span>
      </div>
    </div>
  );
};
