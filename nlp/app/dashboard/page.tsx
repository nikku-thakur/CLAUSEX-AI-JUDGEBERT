'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  ArrowRight,
  BookOpen,
  History,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Cpu,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocalStorageService } from '@/lib/storage/local-storage';
import { AnalysisResult } from '@/types/analysis';
import { DIFFICULT_CASES } from '@/data/difficult-cases';

export default function DashboardPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [annotationsCount, setAnnotationsCount] = useState(0);

  useEffect(() => {
    const list = LocalStorageService.getHistory();
    setHistory(list);
    const annotations = LocalStorageService.getAnnotations();
    setAnnotationsCount(annotations.length);
  }, []);

  const totalAnalyses = history.length;
  const criticalCount = history.filter((h) => h.preservationStatus === 'critical_alteration').length;
  const preservedCount = history.filter((h) => h.preservationStatus === 'preserved').length;


  return (
    <AppShell
      pageTitle="Research Dashboard"
      pageDescription="Overview of legal meaning preservation analyses, research benchmarks, and model connection."
      actions={
        <Link href="/analyzer">
          <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
            New Analysis
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Welcome & Model Connection Status Banner */}
        <div className="glass-panel-gold rounded-2xl p-6 sm:p-8 border border-gold-champagne/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold-champagne/30 text-xs font-semibold text-gold-bright">
                <Cpu className="w-3.5 h-3.5" />
                JUDGEBERT English LMP Platform • Research Prototype
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
                Legal Meaning Preservation Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Investigating normative fidelity and condition shifts across simplified legal clauses
                in English legal clauses.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-obsidian-950/80 border border-gold-champagne/20 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-mono text-text-muted">Inference Engine:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Deterministic Demo Active
                </span>
              </div>
              <p className="text-[10px] text-text-secondary max-w-xs">
                Transparent heuristic analyzer running client-side. Python FastAPI backend optional.
              </p>
              <Link href="/analyzer">
                <Button variant="primary" size="sm" className="w-full text-xs mt-1">
                  Start Clause Comparison →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card variant="glass" className="p-5 border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-text-muted uppercase tracking-wider">
                Total Analyses
              </span>
              <History className="w-4 h-4 text-gold-bright" />
            </div>
            <div className="text-3xl font-serif font-bold text-text-primary">{totalAnalyses}</div>
            <p className="text-[10px] text-text-muted font-mono">
              Sample & local session records
            </p>
          </Card>

          <Card variant="glass" className="p-5 border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-text-muted uppercase tracking-wider">
                Critical Alterations
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-rose-400">{criticalCount}</div>
            <p className="text-[10px] text-text-muted font-mono">
              {totalAnalyses > 0 ? `${Math.round((criticalCount / totalAnalyses) * 100)}% of tested pairs` : '0%'}
            </p>
          </Card>

          <Card variant="glass" className="p-5 border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-text-muted uppercase tracking-wider">
                Annotated Pairs
              </span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-serif font-bold text-text-primary">{annotationsCount}</div>
            <p className="text-[10px] text-text-muted font-mono">
              Human gold-standard records
            </p>
          </Card>

          <Card variant="glass" className="p-5 border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-text-muted uppercase tracking-wider">
                Difficult Cases
              </span>
              <BookOpen className="w-4 h-4 text-gold-champagne" />
            </div>
            <div className="text-3xl font-serif font-bold text-gold-bright">{DIFFICULT_CASES.length}</div>
            <p className="text-[10px] text-text-muted font-mono">
              16 curated edge-case scenarios
            </p>
          </Card>
        </div>

        {/* Middle Section: Recent Analyses & Language Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Analyses (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-text-primary flex items-center gap-2">
                <History className="w-4 h-4 text-gold-bright" />
                <span>Recent Clause Evaluations</span>
              </h3>
              <Link href="/history" className="text-xs text-gold-champagne hover:underline">
                View All History →
              </Link>
            </div>

            <div className="space-y-3">
              {history.slice(0, 4).map((h) => (
                <Card
                  key={h.id}
                  variant="glass"
                  hoverEffect
                  className="p-4 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-lg truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-border">
                        {h.language.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {h.domain}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{h.originalText}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-serif font-bold text-gold-bright">
                        {h.lmpScore.toFixed(1)} / 10
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                          h.preservationStatus === 'preserved'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-300 bg-rose-500/10'
                        }`}
                      >
                        {h.preservationStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <Link href={`/analyzer`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Col: Language Distribution & Research Status */}
          <div className="space-y-6">
            {/* Language Distribution Card */}
            <Card variant="glass" className="p-5 border-border space-y-4">
              <h4 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-bright" />
                English Clause Analyses
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-primary">English Legal Clauses</span>
                    <span className="font-mono text-gold-bright">{totalAnalyses} analyses</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-obsidian-950 overflow-hidden">
                    <div
                      className="h-full bg-gold-champagne rounded-full"
                      style={{
                        width: `${totalAnalyses > 0 ? 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

              </div>
            </Card>

            {/* Quick Access to Difficult Cases */}
            <Card variant="glass" className="p-5 border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                  Difficult Cases Suite
                </h4>
                <Link href="/difficult-cases" className="text-[11px] text-gold-bright hover:underline">
                  View {DIFFICULT_CASES.length} →
                </Link>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Test your simplified clauses against curated legal edge cases, including obligation
                weakening, dropped exceptions, and liability caps.
              </p>
              <Link href="/difficult-cases">
                <Button variant="secondary" size="sm" className="w-full text-xs mt-1">
                  Browse Edge Cases Library
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
