import React from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldAlert,
  Languages,
  Sparkles,
  BarChart3,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Scale className="w-5 h-5 text-gold-bright" />,
      title: 'LMP Preservation Scoring (1–10)',
      description:
        'A dedicated Legal Meaning Preservation metric that measures normative legal fidelity rather than superficial semantic or lexical similarity.',
      link: '/analyzer',
      badge: 'Core Metric',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      title: 'Deontic Shift Detection',
      description:
        'Identifies subtle conversions between obligations (shall, must), permissions (may, can), and prohibitions (shall not, cannot).',
      link: '/change-explorer',
      badge: 'Normative Force',
    },
    {
      icon: <Languages className="w-5 h-5 text-emerald-400" />,
      title: 'Automatic Clause Simplification',
      description:
        'Generate an editable English plain-language draft, then evaluate its legal meaning with the analyzer.',
      link: '/analyzer',
      badge: 'Draft & Review',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-gold-champagne" />,
      title: 'Explainable AI & Evidence Spans',
      description:
        'Transparent token-level highlighting of additions, omissions, and critical changes with legal impact explanations for attorneys.',
      link: '/change-explorer',
      badge: 'Transparent',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
      title: 'JUDGEBERT vs Baselines',
      description:
        'Demonstrates why generic Cosine and BERTScore metrics fail on legal nuances where JUDGEBERT transformer regression succeeds.',
      link: '/benchmarks',
      badge: 'Research',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-gold-bright" />,
      title: '16 Difficult Legal Scenarios',
      description:
        'A curated taxonomy of edge cases covering condition drops, monetary alteration, party substitution, and territorial scope narrowing.',
      link: '/difficult-cases',
      badge: 'Curated Suite',
    },
  ];

  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Architected for Legal Precision
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            A Specialized Legal-Tech Research Platform
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Unlike generic semantic similarity engines, ClauseX AI evaluates the operative legal
            consequence, deontic status, and condition structure of every clause.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <Link key={idx} href={f.link} className="block group">
              <Card
                variant="glass"
                hoverEffect
                className="p-6 h-full flex flex-col justify-between border-border group-hover:border-gold-champagne/40"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-900 border border-gold-champagne/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-gold-champagne/20">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-text-primary group-hover:text-gold-bright transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{f.description}</p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs text-gold-champagne font-medium group-hover:text-gold-bright transition-colors">
                  <span>Explore feature</span>
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
