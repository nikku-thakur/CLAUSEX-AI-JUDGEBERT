'use client';

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  Scale,
  Sparkles,
  FileText,
} from 'lucide-react';
import { CriticalChange, SeverityLevel } from '@/types/analysis';
import { Card } from '@/components/ui/Card';

interface CriticalChangeCardsProps {
  changes: CriticalChange[];
  onSelectChange?: (change: CriticalChange) => void;
}

export const CriticalChangeCards: React.FC<CriticalChangeCardsProps> = ({
  changes,
  onSelectChange,
}) => {
  if (changes.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-obsidian-900/60 border border-emerald-500/20 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <Scale className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-text-primary">
          No Critical Legal Meaning Alterations Detected
        </h4>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          The simplified text preserves the core mandatory obligations, conditions, and intent of
          the original clause.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-serif font-bold text-text-primary flex items-center gap-2">
          <span>Identified Legal Discrepancies</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-obsidian-850 text-gold-champagne border border-border">
            {changes.length} Flagged
          </span>
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {changes.map((c) => {
          const isCritical = c.severity === 'critical';
          const isWarning = c.severity === 'warning';

          const icon = isCritical ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-gold-bright shrink-0" />
          );

          const borderClass = isCritical
            ? 'border-rose-500/30 bg-rose-500/5'
            : isWarning
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-border bg-obsidian-900/40';

          return (
            <Card
              key={c.id}
              variant="glass"
              className={`p-5 rounded-xl border ${borderClass} space-y-4`}
              onClick={() => onSelectChange && onSelectChange(c)}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {icon}
                  <h5 className="text-sm font-serif font-bold text-text-primary">{c.title}</h5>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-border">
                    {c.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-gold-muted text-gold-bright border-gold-champagne/30'
                    }`}
                  >
                    {c.severity}
                  </span>
                </div>
              </div>

              {/* Excerpts Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-obsidian-950/80 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block mb-1">
                    Original Excerpt:
                  </span>
                  <p className="font-mono text-rose-200">{c.originalExcerpt}</p>
                </div>

                <div className="p-3 rounded-lg bg-obsidian-950/80 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-semibold block mb-1">
                    Simplified Excerpt:
                  </span>
                  <p className="font-mono text-amber-200">{c.simplifiedExcerpt}</p>
                </div>
              </div>

              {/* Explanation & Legal Consequence */}
              <div className="space-y-1.5 text-xs">
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Why It Matters:</strong> {c.explanation}
                </p>
                <p className="text-rose-300/90 leading-relaxed text-[11px]">
                  <strong>Legal Consequence:</strong> {c.legalSignificance}
                </p>
              </div>

              {/* Evidence Source Footer */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-text-muted">
                <span>
                  Evidence Mechanism: <code className="text-gold-champagne">{c.evidenceSource}</code>
                </span>
                <span className="text-gold-bright/80 font-medium">Attorney Review Required</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
