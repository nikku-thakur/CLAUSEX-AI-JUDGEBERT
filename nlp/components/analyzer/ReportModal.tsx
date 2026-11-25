'use client';

import React from 'react';
import { Printer, Download, FileText, Check, ShieldAlert, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AnalysisResult } from '@/types/analysis';
import { downloadJson, downloadMarkdown, generateAnalysisMarkdownReport } from '@/lib/export/export-utils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, analysis }) => {
  if (!analysis) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    downloadJson(analysis, `clausex-analysis-${analysis.id}.json`);
  };

  const handleDownloadMarkdown = () => {
    const md = generateAnalysisMarkdownReport(analysis);
    downloadMarkdown(md, `clausex-report-${analysis.id}.md`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Legal Meaning Preservation Audit Report"
      description={`Reference: ${analysis.id} • Generated ${new Date(analysis.timestamp).toLocaleDateString()}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-obsidian-900 border border-border">
          <div className="text-xs text-text-muted">
            Export or print this official research audit log for legal review.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadMarkdown}
            >
              Export Markdown
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadJson}
            >
              Export JSON
            </Button>
          </div>
        </div>

        {/* Report Document Paper Simulation */}
        <div className="p-6 sm:p-8 rounded-xl bg-obsidian-950 border border-border text-text-primary space-y-6 select-text">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold-bright tracking-wider">
                CLAUSEX AI
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Explainable English Legal Meaning Preservation (LMP) Using JUDGEBERT
              </p>
            </div>
            <div className="text-right text-xs text-text-muted">
              <div>
                ID: <span className="font-mono text-gold-champagne">{analysis.id}</span>
              </div>
              <div>Language: {analysis.language.toUpperCase()}</div>
              <div>Domain: {analysis.domain}</div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-obsidian-900 border border-border">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                Preservation Score
              </span>
              <span className="text-2xl font-serif font-bold text-gold-bright">
                {analysis.lmpScore.toFixed(1)} / 10.0
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                Preservation Status
              </span>
              <span className="text-sm font-bold uppercase text-text-primary">
                {analysis.preservationStatus.replace('_', ' ')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                Human Review
              </span>
              <span className="text-sm font-semibold text-rose-300">
                {analysis.humanReviewRecommended ? 'Mandatory Before Execution' : 'Routine'}
              </span>
            </div>
          </div>

          {/* Text Comparison */}
          <div className="space-y-4 text-xs leading-relaxed">
            <div>
              <h5 className="font-serif font-bold text-gold-champagne uppercase tracking-wider text-xs mb-1">
                Original Legal Text
              </h5>
              <div className="p-3.5 rounded-lg bg-obsidian-900/80 border border-border text-text-primary">
                {analysis.originalText}
              </div>
            </div>

            <div>
              <h5 className="font-serif font-bold text-gold-champagne uppercase tracking-wider text-xs mb-1">
                Simplified Plain Language Text
              </h5>
              <div className="p-3.5 rounded-lg bg-obsidian-900/80 border border-border text-text-primary">
                {analysis.simplifiedText}
              </div>
            </div>
          </div>

          {/* Critical Differences */}
          <div>
            <h5 className="font-serif font-bold text-gold-champagne uppercase tracking-wider text-xs mb-3">
              Identified Differences & Deontic Shifts ({analysis.criticalChanges.length})
            </h5>
            {analysis.criticalChanges.length === 0 ? (
              <p className="text-xs text-text-muted">No critical legal changes detected.</p>
            ) : (
              <div className="space-y-3">
                {analysis.criticalChanges.map((c, i) => (
                  <div key={c.id} className="p-3 rounded-lg bg-obsidian-900/60 border border-border text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-text-primary">
                      <span>
                        {i + 1}. {c.title}
                      </span>
                      <span className="font-mono uppercase text-gold-champagne">{c.severity}</span>
                    </div>
                    <div className="text-text-secondary text-[11px]">{c.explanation}</div>
                    <div className="text-rose-300 text-[11px]">
                      <strong>Legal Risk:</strong> {c.legalSignificance}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Prototype Disclaimer */}
          <div className="pt-4 border-t border-border flex items-start gap-2.5 text-[11px] text-text-muted">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Evaluation Disclaimer:</strong> This automated analysis is produced by the
              ClauseX AI research prototype. It evaluates text according to deterministic legal
              heuristics and JUDGEBERT evaluation benchmarks. It does not constitute legal advice.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
