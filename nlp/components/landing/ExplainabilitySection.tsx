import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Eye, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ExplainabilitySection: React.FC = () => {
  const categories = [
    {
      title: 'Obligations & Discretions',
      badge: 'Critical',
      badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      example: 'shall immediately notify → may contact',
      rationale:
        'Converts actionable legal duties into discretionary choices, stripping breach remedies.',
    },
    {
      title: 'Conditions Precedent',
      badge: 'Critical',
      badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      example: 'provided that written notice is given → [dropped]',
      rationale:
        'Transforms a qualified condition into an absolute, unconditional legal guarantee.',
    },
    {
      title: 'Statutory Exceptions',
      badge: 'Critical',
      badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      example: 'except under valid court subpoena → [dropped]',
      rationale:
        'Deprives the party of lawful safe harbors and judicial compliance carve-outs.',
    },
    {
      title: 'Deadlines & Cure Windows',
      badge: 'Warning',
      badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      example: 'thirty (30) business days → 10 days',
      rationale:
        'Compromises procedural rights and can forfeit contractual cure defenses.',
    },
    {
      title: 'Monetary Liability Caps',
      badge: 'Critical',
      badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      example: 'capped at $1,000,000 → $100,000',
      rationale:
        'A single missing zero shrinks available damages by 90% during contract disputes.',
    },
    {
      title: 'Negation Polarity',
      badge: 'Critical',
      badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      example: 'in no event shall Seller be liable → Seller is liable',
      rationale:
        'Complete inversion of commercial risk allocation and insurance coverage assumption.',
    },
  ];

  return (
    <section id="explainability" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Zero Black-Box Guesswork
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            Explainable AI with Evidence-Based Citations
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            ClauseX AI doesn’t just output an opaque similarity score. Every detected difference
            is explicitly tied to verbatim textual evidence, statutory implications, and severity
            assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((cat, idx) => (
            <Card
              key={idx}
              variant="glass"
              hoverEffect
              className="p-6 flex flex-col justify-between border-border"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-text-primary">
                    {cat.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${cat.badgeColor}`}
                  >
                    {cat.badge}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-obsidian-950 font-mono text-[11px] text-gold-champagne/90 border border-border">
                  {cat.example}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">{cat.rationale}</p>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-text-muted">
                <Eye className="w-3.5 h-3.5 text-gold-bright" />
                <span>Textual Evidence Tracked</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/change-explorer">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Legal Change Explorer
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
