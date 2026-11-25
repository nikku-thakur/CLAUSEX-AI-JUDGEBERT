import React from 'react';
import { AlertTriangle, ShieldX, Scissors, FileX2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
      title: 'Deontic Weakening',
      description:
        'Plain language conversions often turn mandatory legal duties ("shall / must") into polite discretionary options ("may / can"), inadvertently removing breach-of-contract liability.',
    },
    {
      icon: <Scissors className="w-6 h-6 text-amber-400" />,
      title: 'Omission of Exceptions & Carve-Outs',
      description:
        'Crucial safe harbors—such as court-ordered disclosure exceptions in non-disclosure agreements—are trimmed for brevity, leaving parties legally vulnerable.',
    },
    {
      icon: <FileX2 className="w-6 h-6 text-gold-bright" />,
      title: 'Severed Conditions Precedent',
      description:
        'Simplification often drops stipulations like "provided that written notice is given within 10 days", turning conditional obligations into unconditional promises.',
    },
    {
      icon: <ShieldX className="w-6 h-6 text-rose-300" />,
      title: 'Negation Inversion & Liability Swaps',
      description:
        'Phrases like "in no event shall Seller be liable" risk being flipped or omitted, causing accidental assumption of strict liability and massive financial exposure.',
    },
  ];

  return (
    <section id="problem" className="py-20 border-t border-border bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            The Fundamental Dilemma
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            Why Legal Simplification Frequently Destroys Legal Meaning
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Making contracts readable for ordinary citizens is essential, but naive LLM summaries
            or careless drafting can strip away binding covenants, conditional protections, and
            statutory defenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, idx) => (
            <Card
              key={idx}
              variant="glass"
              hoverEffect
              className="p-6 flex flex-col justify-between space-y-4 border-border/80"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-obsidian-900 border border-gold-champagne/20 flex items-center justify-center shadow-gold-sm">
                  {p.icon}
                </div>
                <h3 className="font-serif font-bold text-base text-text-primary">{p.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
              </div>
              <div className="pt-2 text-[10px] uppercase font-mono text-gold-champagne/80 tracking-wider">
                Risk Vector #{idx + 1}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
