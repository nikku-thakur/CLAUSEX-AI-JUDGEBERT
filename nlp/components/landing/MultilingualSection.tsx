import React from 'react';
import { FileText, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const MultilingualSection: React.FC = () => (
  <section className="py-24 bg-secondary/30 relative overflow-hidden border-b border-border/80">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold-champagne/30 text-xs font-semibold text-gold-bright">
          <FileText className="w-3.5 h-3.5" />
          English Legal Clause Review
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary leading-tight">
          Plain language that keeps the details in view.
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          ClauseX helps compare an English legal clause with an editable plain-language version.
          Review obligations, permissions, prohibitions, conditions, exceptions, deadlines, amounts,
          parties, and consequences in the analysis results.
        </p>
        <ul className="space-y-3 text-sm text-text-secondary">
          {[
            'Keep key dates, amounts, and responsible parties visible.',
            'Inspect changes to duties, permissions, and prohibitions.',
            'Use the analyzer to independently review each draft.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link href="/analyzer">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Open Clause Analyzer
          </Button>
        </Link>
      </div>

      <div className="glass-panel-gold rounded-2xl p-6 border border-gold-champagne/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-semibold text-text-primary">Clause Review Checklist</span>
          <ShieldCheck className="w-4 h-4 text-gold-bright" />
        </div>
        {['Obligations and permissions', 'Prohibitions and exceptions', 'Conditions and deadlines', 'Amounts, parties, and consequences'].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-lg bg-obsidian-950/80 border border-border p-3 text-xs text-text-secondary">
            <Check className="w-3.5 h-3.5 text-gold-bright" />
            {item}
          </div>
        ))}
        <p className="text-[10px] text-text-muted leading-relaxed">
          A checklist for review, not a claim that any generated text is legally safe.
        </p>
      </div>
    </div>
  </section>
);
