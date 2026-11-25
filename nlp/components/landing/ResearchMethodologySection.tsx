import React from 'react';
import Link from 'next/link';
import { FlaskConical, BarChart3, ArrowRight, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ResearchMethodologySection: React.FC = () => {
  return (
    <section id="research" className="py-24 border-t border-border bg-secondary/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-champagne font-semibold">
            Academic Research Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            Why Generic Semantic Similarity Fails in Law
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Standard embedding models measure topical relatedness, not normative legal consequence.
            A one-word change from “shall” to “may” retains 95% cosine similarity, yet completely voids
            enforceability.
          </p>
        </div>

        {/* 3 Model Cards Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Model 1: Cosine */}
          <Card variant="glass" className="p-6 border-border flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-muted">Baseline 01</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-850 text-text-secondary">
                  Generic
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-text-primary">
                Cosine Similarity (Embeddings)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Calculates cosine distance between sentence vectors. Completely blind to single-token
                deontic flips, condition drops, and numerical caps.
              </p>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Pearson r (EN):</span>
                  <span className="font-mono font-bold text-rose-400">0.412</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">MAE Error:</span>
                  <span className="font-mono text-text-secondary">2.18</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-text-muted font-mono">
              Insufficient for legal risk review
            </div>
          </Card>

          {/* Model 2: BERTScore */}
          <Card variant="glass" className="p-6 border-border flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-muted">Baseline 02</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-850 text-text-secondary">
                  Token Matching
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-text-primary">
                BERTScore (Contextual F1)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Aligns pairwise token embeddings with cosine similarity. Captures paraphrasing, but
                fails to penalize subtle omissions of conditions precedent.
              </p>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Pearson r (EN):</span>
                  <span className="font-mono font-bold text-amber-400">0.584</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">MAE Error:</span>
                  <span className="font-mono text-text-secondary">1.64</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-text-muted font-mono">
              Moderate semantic correlation
            </div>
          </Card>

          {/* Model 3: JUDGEBERT */}
          <Card
            variant="gold"
            className="p-6 border-gold-champagne/40 flex flex-col justify-between relative shadow-gold-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gold-bright font-bold">
                  Proposed Architecture
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-muted text-gold-bright border border-gold-champagne/30">
                  English LMP
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-gold-bright">
                JUDGEBERT Transformer Regression
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                A multi-task cross-encoder trained explicitly on paired English legal
                simplification benchmarks, deontic classification, and human legal expert LMP annotations.
              </p>
              <div className="pt-2 border-t border-gold-champagne/20">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gold-champagne">Pearson r (EN):</span>
                  <span className="font-mono font-bold text-emerald-400">0.846</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gold-champagne">MAE Error:</span>
                  <span className="font-mono text-emerald-300">0.78</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-gold-champagne font-mono">
              High legal fidelity & explainability
            </div>
          </Card>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-border flex items-center justify-between text-xs text-text-muted mb-8">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Research Note:</strong> Metrics shown above represent illustrative evaluation
              benchmarks. Connect Python backend to view real test-split execution logs.
            </span>
          </div>
          <Link href="/benchmarks" className="text-gold-bright hover:underline font-medium shrink-0 ml-4">
            View Benchmark Charts →
          </Link>
        </div>

        <div className="text-center">
          <Link href="/research">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<FlaskConical className="w-5 h-5 text-gold-bright" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Research Lab & Architecture Specs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
