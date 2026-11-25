import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, AlertTriangle, Scale } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DIFFICULT_CASES } from '@/data/difficult-cases';

export const DifficultCasesTeaser: React.FC = () => {
  // Show 3 prominent edge cases
  const sampleCases = [
    DIFFICULT_CASES[0], // Deontic audit duty
    DIFFICULT_CASES[4], // Deadline shortened
    DIFFICULT_CASES[6], // Exception omitted (force majeure)
  ];

  return (
    <section id="difficult-cases" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Stress-Testing Legal AI
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            Curated Difficult-Case Taxonomy (16 Scenarios)
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Real-world legal disputes are rarely caused by obvious errors. They stem from nuanced
            shifts in cure periods, condition precedents, and statutory carve-outs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {sampleCases.map((c) => (
            <Card
              key={c.id}
              variant="glass"
              hoverEffect
              className="p-6 flex flex-col justify-between border-border"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-900 text-gold-champagne border border-border">
                    Scenario #{c.scenarioNumber} • {c.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-status-critical/15 text-rose-300 border border-status-critical/30">
                    {c.criticality}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-sm text-text-primary leading-snug">
                  {c.title}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-obsidian-950 border border-border">
                    <span className="text-[10px] text-text-muted block mb-1">Original:</span>
                    <p className="text-text-secondary line-clamp-3">{c.originalText}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-obsidian-950 border border-border">
                    <span className="text-[10px] text-text-muted block mb-1">Simplified:</span>
                    <p className="text-text-secondary line-clamp-2">{c.simplifiedText}</p>
                  </div>
                </div>

                <p className="text-xs text-rose-300 font-medium leading-relaxed">
                  <strong>Issue:</strong> {c.expectedIssue}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Link href={`/analyzer`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Analyze in Analyzer →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/difficult-cases">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<BookOpen className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Explore All 16 Difficult Cases
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
