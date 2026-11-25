'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  BookmarkPlus,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  GitCompare,
  Clock,
  Coins,
  Cpu,
} from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';
import { ScoreGauge } from '@/components/charts/ScoreGauge';
import { SynchronizedTextComparison } from './SynchronizedTextComparison';
import { CriticalChangeCards } from './CriticalChangeCards';
import { ReportModal } from './ReportModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { LocalStorageService } from '@/lib/storage/local-storage';

interface AnalysisResultViewProps {
  analysis: AnalysisResult;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'changes' | 'modality' | 'conditions' | 'numbers'>('comparison');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveToHistory = () => {
    LocalStorageService.saveAnalysis(analysis);
    toast({
      type: 'success',
      title: 'Analysis Saved',
      message: 'Analysis record saved to local browser history.',
    });
  };

  const isDemo = analysis.sourceEngine === 'deterministic_demo_engine';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Scorecard */}
      <div className="glass-panel-gold rounded-2xl p-6 sm:p-8 border border-gold-champagne/30 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Col 1: Circular Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-6">
            <ScoreGauge score={analysis.lmpScore} status={analysis.preservationStatus} size={170} />
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-gold-champagne">
              <Cpu className="w-3.5 h-3.5" />
              <span>{isDemo ? 'Deterministic Heuristic Engine' : 'JUDGEBERT Model Inference'}</span>
            </div>
          </div>

          {/* Col 2: Interpretation & Legal Implications */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-serif font-bold text-gold-champagne tracking-wider">
                  Cautious Interpretation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-900 text-text-muted border border-border">
                  {analysis.language.toUpperCase()} • {analysis.domain}
                </span>
              </div>

              {analysis.humanReviewRecommended && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Human Legal Review Recommended
                </span>
              )}
            </div>

            <p className="text-sm text-text-primary leading-relaxed font-sans">
              {analysis.interpretation}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-border">
                <span className="text-[10px] text-text-muted block">Original Words</span>
                <span className="text-sm font-serif font-bold text-text-primary">
                  {analysis.summaryMetrics.wordsOriginal}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-border">
                <span className="text-[10px] text-text-muted block">Simplified Words</span>
                <span className="text-sm font-serif font-bold text-text-primary">
                  {analysis.summaryMetrics.wordsSimplified}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-border">
                <span className="text-[10px] text-text-muted block">Compression Ratio</span>
                <span className="text-sm font-serif font-bold text-gold-bright">
                  {analysis.summaryMetrics.compressionRatio}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-border">
                <span className="text-[10px] text-text-muted block">Critical Differences</span>
                <span
                  className={`text-sm font-serif font-bold ${
                    analysis.summaryMetrics.criticalDifferencesCount > 0
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {analysis.summaryMetrics.criticalDifferencesCount} Flagged
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileText className="w-3.5 h-3.5" />}
                onClick={() => setIsReportOpen(true)}
              >
                Export Audit Report
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BookmarkPlus className="w-3.5 h-3.5" />}
                onClick={handleSaveToHistory}
              >
                Save to History
              </Button>

              <Link href="/change-explorer">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Explore in Change Explorer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2.5 text-xs font-serif font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'comparison'
              ? 'border-gold-bright text-gold-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Synchronized Text Spans
        </button>

        <button
          onClick={() => setActiveTab('changes')}
          className={`px-4 py-2.5 text-xs font-serif font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'changes'
              ? 'border-gold-bright text-gold-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Critical Differences</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-obsidian-850 text-gold-champagne">
            {analysis.criticalChanges.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('modality')}
          className={`px-4 py-2.5 text-xs font-serif font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'modality'
              ? 'border-gold-bright text-gold-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Deontic Modality (Duties vs Discretion)
        </button>

        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-4 py-2.5 text-xs font-serif font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'conditions'
              ? 'border-gold-bright text-gold-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Conditions & Exceptions
        </button>

        <button
          onClick={() => setActiveTab('numbers')}
          className={`px-4 py-2.5 text-xs font-serif font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'numbers'
              ? 'border-gold-bright text-gold-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Dates, Deadlines & Amounts
        </button>
      </div>

      {/* Tab 1: Synchronized Comparison */}
      {activeTab === 'comparison' && (
        <SynchronizedTextComparison
          originalSpans={analysis.originalSpans}
          simplifiedSpans={analysis.simplifiedSpans}
        />
      )}

      {/* Tab 2: Critical Changes */}
      {activeTab === 'changes' && (
        <CriticalChangeCards changes={analysis.criticalChanges} />
      )}

      {/* Tab 3: Deontic Modality */}
      {activeTab === 'modality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" className="p-5 border-border space-y-4">
              <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Original Legal Modality
              </h5>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Mandatory Duties:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.deonticBreakdown.originalObligations.length > 0 ? (
                      analysis.deonticBreakdown.originalObligations.map((o, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono text-xs border border-rose-500/30">
                          {o}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted">None explicitly extracted</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase block mt-3">Discretionary Permissions:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.deonticBreakdown.originalPermissions.length > 0 ? (
                      analysis.deonticBreakdown.originalPermissions.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gold-muted text-gold-bright font-mono text-xs border border-gold-champagne/30">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted">None explicitly extracted</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="glass" className="p-5 border-border space-y-4">
              <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Simplified Plain Language Modality
              </h5>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Mandatory Duties:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.deonticBreakdown.simplifiedObligations.length > 0 ? (
                      analysis.deonticBreakdown.simplifiedObligations.map((o, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono text-xs border border-rose-500/30">
                          {o}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted">None explicitly extracted</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase block mt-3">Discretionary Permissions:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.deonticBreakdown.simplifiedPermissions.length > 0 ? (
                      analysis.deonticBreakdown.simplifiedPermissions.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gold-muted text-gold-bright font-mono text-xs border border-gold-champagne/30">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted">None explicitly extracted</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {analysis.deonticBreakdown.shifts.length > 0 && (
            <Card variant="gold" className="p-5 border-gold-champagne/40 space-y-3">
              <h5 className="text-xs font-serif font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Detected Deontic Modality Inversion
              </h5>
              <div className="space-y-2">
                {analysis.deonticBreakdown.shifts.map((s, i) => (
                  <div key={i} className="text-xs text-text-primary p-3 rounded-lg bg-obsidian-950 border border-border">
                    <span className="font-semibold text-gold-bright">{s.from}</span> →{' '}
                    <span className="font-semibold text-rose-300">{s.to}</span>
                    <p className="text-text-secondary text-[11px] mt-1">{s.impact}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: Conditions & Exceptions */}
      {activeTab === 'conditions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-5 border-border space-y-3">
            <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
              Conditions Precedent Analysis
            </h5>
            <div className="space-y-2 text-xs">
              <span className="text-text-muted block text-[11px]">Original Conditions:</span>
              <p className="font-mono text-text-primary">
                {analysis.conditionsBreakdown.originalConditions.join(', ') || 'No express conditions'}
              </p>

              <span className="text-text-muted block text-[11px] pt-2">Dropped in Simplified:</span>
              <p className="font-mono text-rose-300">
                {analysis.conditionsBreakdown.droppedConditions.join(', ') || 'None dropped'}
              </p>
            </div>
          </Card>

          <Card variant="glass" className="p-5 border-border space-y-3">
            <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
              Carve-Outs & Exceptions Analysis
            </h5>
            <div className="space-y-2 text-xs">
              <span className="text-text-muted block text-[11px]">Original Exceptions:</span>
              <p className="font-mono text-text-primary">
                {analysis.conditionsBreakdown.originalExceptions.join(', ') || 'No express exceptions'}
              </p>

              <span className="text-text-muted block text-[11px] pt-2">Dropped in Simplified:</span>
              <p className="font-mono text-rose-300">
                {analysis.conditionsBreakdown.droppedExceptions.join(', ') || 'None dropped'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Numbers, Dates & Amounts */}
      {activeTab === 'numbers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-5 border-border space-y-3">
            <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-gold-bright" />
              Monetary Caps & Percentages
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Original Amounts:</span>
                <span className="font-mono text-text-primary">
                  {analysis.entitiesBreakdown.originalAmounts.join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Simplified Amounts:</span>
                <span className="font-mono text-text-primary">
                  {analysis.entitiesBreakdown.simplifiedAmounts.join(', ') || 'None'}
                </span>
              </div>
              {analysis.entitiesBreakdown.amountMismatches.length > 0 && (
                <div className="p-2 rounded bg-rose-500/15 text-rose-300 text-[11px] font-mono">
                  Discrepancy: {analysis.entitiesBreakdown.amountMismatches.join(', ')} missing or modified!
                </div>
              )}
            </div>
          </Card>

          <Card variant="glass" className="p-5 border-border space-y-3">
            <h5 className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold-bright" />
              Timeframes & Notice Deadlines
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Original Deadlines:</span>
                <span className="font-mono text-text-primary">
                  {analysis.entitiesBreakdown.originalDates.join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Simplified Deadlines:</span>
                <span className="font-mono text-text-primary">
                  {analysis.entitiesBreakdown.simplifiedDates.join(', ') || 'None'}
                </span>
              </div>
              {analysis.entitiesBreakdown.dateMismatches.length > 0 && (
                <div className="p-2 rounded bg-amber-500/15 text-amber-300 text-[11px] font-mono">
                  Altered timeframe: {analysis.entitiesBreakdown.dateMismatches.join(', ')} modified!
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysis={analysis}
      />
    </div>
  );
};
