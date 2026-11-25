import React from 'react';
import Link from 'next/link';
import { FileInput, GitCompare, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const HowItWorksCompact: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Input Clauses',
      icon: <FileInput className="w-5 h-5 text-gold-bright" />,
      description:
        'Paste an English legal clause and generate an editable plain-language draft or enter your own.',
    },
    {
      num: '02',
      title: 'Compare Modality',
      icon: <GitCompare className="w-5 h-5 text-gold-champagne" />,
      description:
        'The engine cross-checks mandatory duties (shall/must), discretionary acts (may), and conditions.',
    },
    {
      num: '03',
      title: 'Explain Evidence',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      description:
        'Receives a 1–10 LMP score with highlighted additions, omissions, and legal significance notes.',
    },
    {
      num: '04',
      title: 'Review & Verify',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      description:
        'Legal counsel reviews flagged alterations, exports a certified report, or saves to local history.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-secondary/30 relative border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Evaluation Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
            How ClauseX AI Evaluates Legal Meaning
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Four transparent, auditable stages designed for informed human legal review.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, idx) => (
            <Card
              key={idx}
              variant="glass"
              className="p-5 flex flex-col justify-between border-border space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-obsidian-950 border border-gold-champagne/25 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-xl font-serif font-bold text-gold-champagne/30">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-sm text-text-primary">{s.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{s.description}</p>
              </div>

              <div className="pt-3 border-t border-border/40 text-[10px] font-mono uppercase text-gold-champagne/80">
                Phase {s.num}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
