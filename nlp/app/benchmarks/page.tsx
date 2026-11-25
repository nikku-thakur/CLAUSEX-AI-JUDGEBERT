'use client';

import React from 'react';
import {
  BarChart3,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BenchmarkCharts } from '@/components/charts/BenchmarkCharts';
import { BENCHMARK_METRICS_DATA, BENCHMARK_DISCLAIMER } from '@/data/benchmark-data';
import { downloadCsv, downloadJson } from '@/lib/export/export-utils';
import { useToast } from '@/components/ui/Toast';

export default function BenchmarksPage() {
  const { toast } = useToast();

  const handleExportCsv = () => {
    const headers = [
      'Model Name',
      'Language',
      'Pearson r',
      'Spearman rho',
      'MAE',
      'RMSE',
      'Pairs Evaluated',
      'Status',
    ];
    const rows = BENCHMARK_METRICS_DATA.map((m) => [
      m.modelName,
      m.language.toUpperCase(),
      m.pearsonR,
      m.spearmanRho,
      m.mae,
      m.rmse,
      m.evaluatedPairsCount,
      m.status,
    ]);
    downloadCsv(headers, rows, 'clausex-benchmark-metrics.csv');
    toast({
      type: 'success',
      title: 'Metrics Exported',
      message: 'Downloaded benchmark metrics as CSV.',
    });
  };

  const handleExportJson = () => {
    downloadJson(BENCHMARK_METRICS_DATA, 'clausex-benchmark-metrics.json');
    toast({
      type: 'success',
      title: 'Metrics Exported',
      message: 'Downloaded benchmark metrics as JSON.',
    });
  };

  return (
    <AppShell
      pageTitle="Evaluation Benchmarks"
      pageDescription="Comparative performance analysis: JUDGEBERT vs Cosine Similarity and BERTScore baselines."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportJson}
          >
            Export JSON
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Prominent Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-amber-300">
              Benchmark Transparency Notice
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {BENCHMARK_DISCLAIMER} Charts reflect target evaluation criteria designed to show
              the performance divergence between generic similarity and deontic LMP regression.
            </p>
          </div>
        </div>

        {/* Recharts Visualizations */}
        <BenchmarkCharts />

        {/* Detailed Metrics Table */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-gold-bright" />
              <span>Quantitative Evaluation Matrix</span>
            </h3>
            <span className="text-[11px] font-mono text-text-muted">
              Evaluated on Gold-Standard Test Splits
            </span>
          </div>

          <div className="glass-panel rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-950/80 border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Model / Baseline</th>
                  <th className="py-3 px-4 font-semibold">Language</th>
                  <th className="py-3 px-4 font-semibold">Pearson r ↑</th>
                  <th className="py-3 px-4 font-semibold">Spearman ρ ↑</th>
                  <th className="py-3 px-4 font-semibold">MAE ↓</th>
                  <th className="py-3 px-4 font-semibold">RMSE ↓</th>
                  <th className="py-3 px-4 font-semibold">Test Pairs</th>
                  <th className="py-3 px-4 font-semibold">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {BENCHMARK_METRICS_DATA.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-obsidian-900/50 transition-colors ${
                      !row.isBaseline ? 'bg-gold-muted/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-text-primary flex items-center gap-2">
                      {!row.isBaseline && <Scale className="w-3.5 h-3.5 text-gold-bright" />}
                      <span>{row.modelName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-gold-champagne">
                      {row.language}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      {row.pearsonR.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      {row.spearmanRho.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {row.mae.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {row.rmse.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {row.evaluatedPairsCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Illustrative Demo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
