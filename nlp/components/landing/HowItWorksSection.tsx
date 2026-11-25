import React from 'react';
import { FileInput, GitCompare, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: <FileInput className="w-6 h-6 text-gold-bright" />,
      title: 'Input Legal Clauses',
      description:
        'Paste an English legal clause, generate an editable plain-language draft, or enter your own candidate. Add an optional legal domain.',
    },
    {
      step: '02',
      icon: <GitCompare className="w-6 h-6 text-gold-champagne" />,
      title: 'Compare Normative Force',
      description:
        'The engine parses deontic modals (shall vs may), conditions precedent, exception carve-outs, numbers, dates, and negation polarity across both clauses.',
    },
    {
      step: '03',
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: 'Explain Evidence Spans',
      description:
        'Receives a 1–10 LMP score with highlighted additions, deletions, and critical changes. Explanations clarify why each difference alters legal consequences.',
    },
    {
      step: '04',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: 'Review & Verify',
      description:
        'Attorneys and researchers review the flagged discrepancies, export an audit report, or add the sentence pair to human annotation benchmarks.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Methodical Evaluation Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            How ClauseX AI Evaluates Legal Meaning
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            From raw legal drafting to actionable, explainable evidence in four transparent stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, index) => (
            <Card
              key={index}
              variant="glass"
              hoverEffect
              className="p-6 relative flex flex-col justify-between border-border"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-obsidian-900 border border-gold-champagne/20 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-2xl font-serif font-bold text-gold-champagne/40">
                    {s.step}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-text-primary">{s.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{s.description}</p>
              </div>

              <div className="pt-4 border-t border-border/50 text-[10px] font-mono uppercase text-gold-champagne tracking-wider">
                Stage {s.step} • Pipeline
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
