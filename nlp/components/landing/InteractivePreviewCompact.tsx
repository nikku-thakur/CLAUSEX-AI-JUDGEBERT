import React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const InteractivePreviewCompact: React.FC = () => (
  <section className="py-20 bg-background relative border-b border-border/80">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
          English Clause Preview
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
          Simplify, Edit, Then Check the Meaning
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary">
          Auto Simplify creates an editable draft. ClauseX then checks it for changes to duties,
          conditions, exceptions, and other legal details.
        </p>
      </div>

      <div className="glass-panel-gold rounded-2xl p-6 sm:p-7 border border-gold-champagne/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-obsidian-950 border border-gold-champagne/25 flex items-center justify-center">
              <Scale className="w-4 h-4 text-gold-bright" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-text-primary">
                Confidentiality • Notice Requirement
              </h4>
              <span className="text-[10px] font-mono text-gold-champagne">
                EN • Commercial Agreement
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
            Illustrative Example
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-obsidian-950/85 border border-border space-y-2">
            <span className="text-[10px] font-serif font-bold text-gold-champagne uppercase tracking-wider block">
              Original Legal Clause
            </span>
            <p className="text-text-primary leading-relaxed">
              The Licensee shall promptly notify the Licensor in writing of any unauthorized
              disclosure of the Licensed Technology.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-obsidian-950/85 border border-border space-y-2">
            <span className="text-[10px] font-serif font-bold text-gold-champagne uppercase tracking-wider block">
              Simplified Plain Language
            </span>
            <p className="text-text-primary leading-relaxed">
              The Licensee must quickly tell the Licensor in writing if someone discloses the
              Licensed Technology without permission.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-obsidian-950/90 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-text-secondary text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
            <span>
              Illustrative text only. Generated drafts require review, and the analyzer should be
              used to check whether legal meaning changed.
            </span>
          </div>
          <Link href="/analyzer" className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              className="text-xs"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Clause Analyzer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);
