import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'gold' | 'elevated' | 'subtle';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hoverEffect = false, children, ...props }, ref) => {
    const variants = {
      glass: 'glass-panel rounded-xl shadow-card-glass',
      gold: 'glass-panel-gold rounded-xl shadow-gold-sm',
      elevated: 'bg-card-elevated border border-border rounded-xl shadow-md',
      subtle: 'bg-obsidian-900/60 border border-border/60 rounded-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          hoverEffect &&
            'transition-all duration-300 hover:border-gold-champagne/40 hover:-translate-y-0.5 hover:shadow-gold-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
