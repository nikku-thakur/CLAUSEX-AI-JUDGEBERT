'use client';

import React, { useState } from 'react';
import { Columns2, Rows2, Eye, ShieldAlert, Info } from 'lucide-react';
import { TextSpan } from '@/types/analysis';

interface SynchronizedTextComparisonProps {
  originalSpans: TextSpan[];
  simplifiedSpans: TextSpan[];
  onSelectSpan?: (span: TextSpan) => void;
}

export const SynchronizedTextComparison: React.FC<SynchronizedTextComparisonProps> = ({
  originalSpans,
  simplifiedSpans,
  onSelectSpan,
}) => {
  const [layout, setLayout] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [hoveredSpan, setHoveredSpan] = useState<TextSpan | null>(null);

  const renderSpan = (span: TextSpan, index: number) => {
    let spanClass = 'transition-colors';
    if (span.severity === 'critical') {
      spanClass += ' span-critical cursor-pointer hover:brightness-125';
    } else if (span.severity === 'warning') {
      spanClass += ' span-warning cursor-pointer hover:brightness-125';
    } else if (span.type === 'removed') {
      spanClass += ' span-removed cursor-pointer hover:brightness-125';
    } else if (span.type === 'added') {
      spanClass += ' span-added cursor-pointer hover:brightness-125';
    }

    return (
      <span
        key={index}
        className={spanClass}
        onClick={() => onSelectSpan && onSelectSpan(span)}
        onMouseEnter={() => span.explanation && setHoveredSpan(span)}
        onMouseLeave={() => setHoveredSpan(null)}
        title={span.explanation}
      >
        {span.text}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Options & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-text-muted">Highlight Legend:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Critical Alteration
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Warning / Softened
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Added Phrasing
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-200 border border-rose-400/20 border-dashed">
            Omitted Word
          </span>
        </div>

        {/* Layout toggle */}
        <div className="flex items-center rounded-lg bg-obsidian-950 p-1 border border-border">
          <button
            onClick={() => setLayout('side-by-side')}
            className={`p-1.5 rounded transition-colors ${
              layout === 'side-by-side'
                ? 'bg-gold-muted text-gold-bright'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Side by side layout"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('stacked')}
            className={`p-1.5 rounded transition-colors ${
              layout === 'stacked'
                ? 'bg-gold-muted text-gold-bright'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Stacked layout"
          >
            <Rows2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Synchronized Text Boxes */}
      <div
        className={`grid gap-6 ${
          layout === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Original Text Box */}
        <div className="p-5 rounded-xl bg-obsidian-950/80 border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <span className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Original Legal Clause (Enforceable Standard)
              </span>
              <span className="text-[10px] text-text-muted font-mono">Original</span>
            </div>

            <div className="text-xs sm:text-sm text-text-primary leading-relaxed select-text">
              {originalSpans.map(renderSpan)}
            </div>
          </div>
        </div>

        {/* Simplified Text Box */}
        <div className="p-5 rounded-xl bg-obsidian-950/80 border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <span className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Simplified Plain Language (Candidate)
              </span>
              <span className="text-[10px] text-text-muted font-mono">Simplified</span>
            </div>

            <div className="text-xs sm:text-sm text-text-primary leading-relaxed select-text">
              {simplifiedSpans.map(renderSpan)}
            </div>
          </div>
        </div>
      </div>

      {/* Active Span Tooltip Drawer */}
      {hoveredSpan && hoveredSpan.explanation && (
        <div className="p-3 rounded-lg bg-obsidian-900 border border-gold-champagne/30 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
          <Info className="w-4 h-4 text-gold-bright shrink-0" />
          <span className="text-text-primary">
            <strong>Token Insight:</strong> {hoveredSpan.explanation}
          </span>
        </div>
      )}
    </div>
  );
};
