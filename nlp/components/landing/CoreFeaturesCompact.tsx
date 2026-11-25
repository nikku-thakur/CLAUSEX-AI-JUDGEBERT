import React from 'react';
import Link from 'next/link';
import { Scale, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const CoreFeaturesCompact: React.FC = () => {
  const features = [
    {
      icon: <Scale className="w-5 h-5 text-gold-bright" />,
      title: 'Legal Meaning Preservation',
      description:
        'A dedicated 1–10 normative fidelity score that verifies whether operative legal obligations survive plain-language simplification.',
      href: '/analyzer',
      badge: 'Core Metric',
      cta: 'Open Analyzer',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      title: 'Automatic Clause Simplification',
      description:
        'Create an editable plain-language draft from an English legal clause, then check it with the legal meaning analyzer.',
      href: '/analyzer',
      badge: 'Draft & Review',
      cta: 'Try Auto Simplify',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-gold-champagne" />,
      title: 'Explainable AI & Evidence Spans',
      description:
        'Transparent token-level highlighting with citations explaining why specific additions or omissions alter legal consequences.',
      href: '/change-explorer',
      badge: 'Transparent',
      cta: 'Explore Evidence',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      title: 'Critical Change Detection',
      description:
        'Audits deontic modality flips (shall to may), condition precedent drops, lost subpoena carve-outs, and truncated liability caps.',
      href: '/difficult-cases',
      badge: '16 Edge Cases',
      cta: 'Browse 16 Scenarios',
    },
  ];

  return (
    <section id="features" className="py-20 bg-background relative border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Specialized Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
            Core Features for Legal Precision
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Engineered specifically to evaluate normative consequence and contractual risk rather than
            superficial lexical similarity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, idx) => (
            <Link key={idx} href={f.href} className="block group h-full">
              <Card
                variant="glass"
                hoverEffect
                className="p-5 h-full flex flex-col justify-between border-border group-hover:border-gold-champagne/50"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-950 border border-gold-champagne/25 flex items-center justify-center group-hover:scale-105 transition-transform shadow-gold-sm">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-900 text-gold-champagne border border-border">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-text-primary group-hover:text-gold-bright transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{f.description}</p>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-gold-champagne group-hover:text-gold-bright transition-colors">
                  <span className="font-medium text-[11px]">{f.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
