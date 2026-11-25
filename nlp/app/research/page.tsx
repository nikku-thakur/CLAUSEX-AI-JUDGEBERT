'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  BarChart3,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  FileCheck,
  Cpu,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BaselineModel, DatasetSplit } from '@/types/research';
import { DATASET_SPLIT_OVERVIEW } from '@/data/benchmark-data';
import { useToast } from '@/components/ui/Toast';

export default function ResearchLabPage() {
  const [selectedModel, setSelectedModel] = useState<BaselineModel>('judgebert_multilingual_regression');
  const [selectedSplit, setSelectedSplit] = useState<DatasetSplit>('test');
  const [contextAware, setContextAware] = useState(true);
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);

  const { toast } = useToast();

  const handleSimulateRun = () => {
    setIsSimulatingRun(true);
    setTimeout(() => {
      setIsSimulatingRun(false);
      toast({
        type: 'info',
        title: 'Backend Experiment Required',
        message: 'Experiment parameter set logged. Connect GPU backend for cluster execution.',
      });
    }, 1200);
  };

  return (
    <AppShell
      pageTitle="Research Lab"
      pageDescription="Theoretical formulation, dataset curation splits, and JUDGEBERT model architecture for English legal text."
    >
      <div className="space-y-8">
        {/* Research Objective Hero */}
        <div className="glass-panel-gold rounded-2xl p-6 sm:p-8 border border-gold-champagne/30 shadow-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold-champagne/30 text-xs font-semibold text-gold-bright">
            <FlaskConical className="w-3.5 h-3.5" />
            Empirical Formulation: Legal Meaning Preservation (LMP)
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
            Explainable English Legal Meaning Preservation Using JUDGEBERT
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
            We formalize the evaluation of legal text simplification not as a generic text-generation
            summarization task, but as an explainable, normative constraint preservation problem.
            The model investigates whether simplified clauses preserve legal duties (deontic modality),
            contingent conditions precedent, exceptions, statutory safe harbors, and liability ceilings.
          </p>
        </div>

        {/* Experiment Configuration Panel */}
        <Card variant="glass" className="p-6 border-border space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-serif font-bold text-text-primary">
                Experiment Configuration & Inference Parameters
              </h3>
              <p className="text-xs text-text-muted">
                Configure hyperparameters and baseline models for offline or connected GPU evaluation.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Research Controls
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Model Architecture */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Evaluation Baseline / Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="w-full text-xs bg-obsidian-950 border border-border rounded-lg p-2.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              >
                <option value="judgebert_multilingual_regression">
                  JUDGEBERT (Multi-Task Regression)
                </option>
                <option value="bertscore">BERTScore (Contextual F1 Baseline)</option>
                <option value="cosine_similarity">Cosine Similarity (Embedding Baseline)</option>
              </select>
            </div>

            {/* Split */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Evaluation Dataset Split:</label>
              <select
                value={selectedSplit}
                onChange={(e) => setSelectedSplit(e.target.value as any)}
                className="w-full text-xs bg-obsidian-950 border border-border rounded-lg p-2.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              >
                <option value="test">Gold Standard Test Split (350 Pairs)</option>
                <option value="dev">Development / Validation (200 Pairs)</option>
                <option value="zero_shot_domain">Zero-Shot Out-of-Domain (250 Pairs)</option>
                <option value="train">Training Corpus (1,100 Pairs)</option>
              </select>
            </div>

            {/* Context Aware Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Context Conditioning:</label>
              <button
                type="button"
                onClick={() => setContextAware(!contextAware)}
                className={`w-full text-xs rounded-lg p-2.5 border transition-colors flex items-center justify-between ${
                  contextAware
                    ? 'bg-gold-muted text-gold-bright border-gold-champagne/40 font-semibold'
                    : 'bg-obsidian-950 text-text-secondary border-border'
                }`}
              >
                <span>Context-Aware Evaluation</span>
                <span className="text-[10px] uppercase font-mono">{contextAware ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-border gap-4">
            <span className="text-xs text-text-muted">
              Status for selected configuration: <strong className="text-amber-400">Awaiting Backend Execution</strong>
            </span>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSimulatingRun}
              onClick={handleSimulateRun}
              leftIcon={<Cpu className="w-3.5 h-3.5" />}
            >
              Trigger Evaluation Run
            </Button>
          </div>
        </Card>

        {/* Dataset Split Overview Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-gold-bright" />
              <span>English Legal Corpus & Evaluation Splits</span>
            </h3>
            <span className="text-xs font-mono text-gold-champagne">N = 1,800 English Pairs</span>
          </div>

          <div className="glass-panel rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-950/80 border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Corpus Split</th>
                  <th className="py-3 px-4 font-semibold">English Pairs</th>
                  <th className="py-3 px-4 font-semibold">Annotation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DATASET_SPLIT_OVERVIEW.map((item, idx) => (
                  <tr key={idx} className="hover:bg-obsidian-900/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">{item.split}</td>
                    <td className="py-3 px-4 font-mono text-gold-champagne">{item.count}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Architecture Deep-Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6 border-border space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-bright" />
              <h4 className="font-serif font-bold text-sm text-text-primary">
                JUDGEBERT Transformer Architecture
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              JUDGEBERT uses a dual-encoder cross-attention backbone fine-tuned with a multi-task
              objective for English legal text:
            </p>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-champagne mt-1.5 shrink-0" />
                <span>
                  <strong>Task 1 (LMP Score Regression):</strong> Predicts continuous legal fidelity
                  from 1.0 to 10.0 calibrated against expert attorney ratings.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-champagne mt-1.5 shrink-0" />
                <span>
                  <strong>Task 2 (Deontic Modality Shift Classification):</strong> Predicts obligation,
                  permission, and prohibition transitions.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-champagne mt-1.5 shrink-0" />
                <span>
                  <strong>Task 3 (Span Alignment & Explainability):</strong> Cross-attends to tokens
                  responsible for legal meaning deviation.
                </span>
              </li>
            </ul>
          </Card>

          <Card variant="glass" className="p-6 border-border space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-bright" />
              <h4 className="font-serif font-bold text-sm text-text-primary">
                Scientific Integrity & Disclaimers
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              To preserve research integrity, ClauseX AI maintains a strict demarcation between
              tested experimental runs and interactive UI simulations:
            </p>
            <div className="p-3.5 rounded-lg bg-obsidian-950 border border-border text-xs text-text-muted space-y-2">
              <p>
                • <strong>No Fabricated Confidence:</strong> When backend inference is disconnected,
                evaluations explicitly identify as client-side heuristic rules.
              </p>
              <p>
                • <strong>Public Gold Standards:</strong> Annotation guidelines and difficult-case
                templates are open for peer reproduction and review.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/benchmarks">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Inspect Recharts Benchmark Visualizations →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
