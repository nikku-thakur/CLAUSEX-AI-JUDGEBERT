import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const FinalCtaCompact: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background via-obsidian-900 to-obsidian-950 relative overflow-hidden border-b border-border/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
          Begin Your Evaluation
        </span>

        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary tracking-tight">
          Safeguard Legal Intent <br />
          <span className="text-gold-gradient">Before Agreements Are Finalized</span>
        </h2>

        <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
          Draft a plain-language version, check it with our deterministic analyzer, or explore the
          JUDGEBERT research benchmarks for English legal clauses.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link href="/analyzer" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-sm shadow-gold-md"
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Analyze a Clause
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm">
              Open Research Dashboard
            </Button>
          </Link>
        </div>

        {/* Responsible AI Disclaimer */}
        <div className="pt-6 max-w-2xl mx-auto">
          <div className="p-3.5 rounded-xl bg-obsidian-950/90 border border-border flex items-start gap-2.5 text-xs text-text-muted text-left">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Responsible Use Statement:</strong> ClauseX AI is an experimental academic
              research prototype for explainable meaning evaluation. It is not an attorney and does
              not provide legal advice. All analyses should be verified by qualified legal professionals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
