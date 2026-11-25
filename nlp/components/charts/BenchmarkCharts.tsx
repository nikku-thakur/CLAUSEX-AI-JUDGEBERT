'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BENCHMARK_METRICS_DATA, ERROR_DISTRIBUTION_DATA } from '@/data/benchmark-data';

export const BenchmarkCharts: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-80 flex items-center justify-center text-xs text-text-muted">Loading charts...</div>;
  }

  // Filter metrics data for selected language
  const filteredMetrics = BENCHMARK_METRICS_DATA.filter((m) => m.language === 'en');

  const correlationData = filteredMetrics.map((m) => ({
    name: m.modelName.split('(')[0].trim(),
    Pearson: m.pearsonR,
    Spearman: m.spearmanRho,
  }));

  const errorData = filteredMetrics.map((m) => ({
    name: m.modelName.split('(')[0].trim(),
    MAE: m.mae,
    RMSE: m.rmse,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Pearson & Spearman Correlation */}
        <div className="glass-panel p-5 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-serif font-bold text-text-primary">
                Correlation with Human LMP Ratings
              </h4>
              <p className="text-[11px] text-text-muted">
                Higher is better (1.0 = Perfect correlation)
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Pearson / Spearman
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 180, 106, 0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#A4A7B0"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis domain={[0, 1.0]} stroke="#A4A7B0" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101218',
                    borderColor: 'rgba(214, 180, 106, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F4F0E7',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Pearson" fill="#D6B46A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spearman" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: MAE and RMSE Error */}
        <div className="glass-panel p-5 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-serif font-bold text-text-primary">
                Error Metrics (MAE & RMSE)
              </h4>
              <p className="text-[11px] text-text-muted">
                Lower is better on 1–10 point evaluation scale
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Error Score
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 180, 106, 0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#A4A7B0"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis domain={[0, 3.5]} stroke="#A4A7B0" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101218',
                    borderColor: 'rgba(214, 180, 106, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F4F0E7',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="MAE" fill="#F87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="RMSE" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Error Distribution Histogram */}
      <div className="glass-panel p-5 rounded-xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-serif font-bold text-text-primary">
              Prediction Error Distribution Histogram
            </h4>
            <p className="text-[11px] text-text-muted">
              Residual count per error bin (Target: peak at 0.0 ± 0.5)
            </p>
          </div>
          <span className="text-[10px] font-mono text-gold-champagne">Illustrative English Metrics</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ERROR_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 180, 106, 0.1)" />
              <XAxis dataKey="errorBin" stroke="#A4A7B0" fontSize={10} />
              <YAxis stroke="#A4A7B0" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#101218',
                  borderColor: 'rgba(214, 180, 106, 0.3)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#F4F0E7',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="cosineCount" name="Cosine Baseline" fill="#F87171" radius={[2, 2, 0, 0]} />
              <Bar dataKey="bertScoreCount" name="BERTScore" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="judgebertCount" name="JUDGEBERT (LMP)" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
