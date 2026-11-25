import React from 'react';
import Link from 'next/link';
import { FlaskConical, BarChart3, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ResearchPreviewCompact: React.FC = () => {
  return (
    <section id="research" className="py-20 bg-secondary/30 relative border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 6 cols: Methodology Summary */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold-champagne/30 text-xs font-semibold text-gold-bright">
              <FlaskConical className="w-3.5 h-3.5" />
              Academic Research Architecture
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary leading-tight">
              Why Generic Semantic Similarity <br />
              <span className="text-gold-gradient">Fails in Legal Adjudication</span>
            </h2>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Standard NLP embedding models measure topical relatedness, not normative legal force.
              A single-word substitution from <em>"shall"</em> to <em>"may"</em> retains 95% cosine
              similarity while fundamentally voiding contractual enforceability.
            </p>

            <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-border text-xs text-text-muted space-y-1">
              <div className="flex items-center gap-2 text-text-primary font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Notice on Experimental Status</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Values shown below are <strong>illustrative benchmark previews</strong> demonstrating
                the target divergence between generic baselines and JUDGEBERT transformer regression.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link href="/research">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Explore Research Lab
                </Button>
              </Link>
              <Link href="/benchmarks">
                <Button variant="outline" size="sm" className="text-xs">
                  View Full Benchmark Charts
                </Button>
              </Link>
            </div>
          </div>

          {/* Right 6 cols: Compact Illustrative Benchmark Matrix */}
          <div className="lg:col-span-6">
            <Card variant="glass" className="p-6 border-gold-champagne/30 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold-bright" />
                  <h4 className="text-xs font-serif font-bold text-text-primary uppercase tracking-wider">
                    Model Correlation vs Human LMP (Target Benchmarks)
                  </h4>
                </div>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Illustrative Preview
                </span>
              </div>

              {/* 3 Model Row Comparison */}
              <div className="space-y-3 text-xs">
                {/* Cosine Baseline */}
                <div className="p-3 rounded-xl bg-obsidian-950 border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-text-primary block">
                      Cosine Similarity (Embedding Baseline)
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Blind to deontic flips & conditions precedent
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400">r = 0.412</span>
                    <span className="text-[9px] text-text-muted block">Pearson (EN)</span>
                  </div>
                </div>

                {/* BERTScore Baseline */}
                <div className="p-3 rounded-xl bg-obsidian-950 border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-text-primary block">
                      BERTScore (Contextual F1 Baseline)
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Aligns tokens, misses condition omissions
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400">r = 0.584</span>
                    <span className="text-[9px] text-text-muted block">Pearson (EN)</span>
                  </div>
                </div>

                {/* JUDGEBERT */}
                <div className="p-3.5 rounded-xl bg-gold-muted/20 border border-gold-champagne/40 flex items-center justify-between shadow-gold-sm">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-gold-bright" />
                      <span className="font-serif font-bold text-gold-bright">
                        JUDGEBERT English LMP Regression
                      </span>
                    </div>
                    <span className="text-[10px] text-text-secondary">
                      Multi-task cross-attention trained on legal meaning
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-emerald-400">r = 0.846</span>
                    <span className="text-[9px] text-text-muted block">Pearson (EN)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
