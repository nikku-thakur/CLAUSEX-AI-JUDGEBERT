import React from 'react';
import { cn } from '@/lib/utils/cn';
import { SeverityLevel, PreservationStatus } from '@/types/analysis';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'default' | 'success' | 'warning' | 'critical' | 'outline';
  severity?: SeverityLevel;
  preservationStatus?: PreservationStatus;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  severity,
  preservationStatus,
  size = 'md',
  children,
  ...props
}) => {
  let computedVariant = variant || 'default';

  if (severity) {
    if (severity === 'critical') computedVariant = 'critical';
    else if (severity === 'warning') computedVariant = 'warning';
    else computedVariant = 'gold';
  } else if (preservationStatus) {
    if (preservationStatus === 'preserved') computedVariant = 'success';
    else if (preservationStatus === 'subtle_shift') computedVariant = 'warning';
    else if (preservationStatus === 'critical_alteration') computedVariant = 'critical';
  }

  const variants = {
    gold: 'bg-gold-muted text-gold-bright border-gold-champagne/30',
    default: 'bg-obsidian-800 text-text-secondary border-border',
    success: 'bg-status-success-muted text-emerald-400 border-status-success/30',
    warning: 'bg-status-warning-muted text-amber-300 border-status-warning/30',
    critical: 'bg-status-critical-muted text-rose-300 border-status-critical/30',
    outline: 'bg-transparent text-text-primary border-border',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border uppercase transition-colors',
        variants[computedVariant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};
