'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DIFFICULT_CASES } from '@/data/difficult-cases';
import { DifficultCase, SeverityLevel } from '@/types/analysis';

export default function DifficultCasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const router = useRouter();

  const filteredCases = DIFFICULT_CASES.filter((c) => {
    if (selectedSeverity !== 'all' && c.criticality !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.expectedIssue.toLowerCase().includes(q) ||
        c.originalText.toLowerCase().includes(q) ||
        c.simplifiedText.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <AppShell
      pageTitle="Difficult Cases Library"
      pageDescription="A curated benchmark of legal semantic alteration edge cases designed to stress-test plain language simplification."
    >
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="p-4 rounded-xl glass-panel border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search across all ${DIFFICULT_CASES.length} scenarios by title, issue, or text...`}
              className="w-full bg-obsidian-950 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:border-gold-champagne focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs bg-obsidian-950 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
            >
              <option value="all">All Criticalities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>

          </div>
        </div>

        {/* Count Header */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Displaying <strong className="text-gold-bright">{filteredCases.length}</strong> of{' '}
            {DIFFICULT_CASES.length} Curated English Scenarios
          </span>
          <span className="text-[11px] font-mono">English legal clause scenarios</span>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCases.map((c) => {
            const isCritical = c.criticality === 'critical';
            return (
              <Card
                key={c.id}
                variant="glass"
                hoverEffect
                className={`p-6 border flex flex-col justify-between space-y-4 ${
                  isCritical ? 'border-rose-500/30' : 'border-amber-500/30'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-950 text-gold-champagne border border-border">
                      Scenario #{c.scenarioNumber} • {c.category.toUpperCase()} • {c.language.toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {c.criticality}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-text-primary leading-snug">
                    {c.title}
                  </h4>

                  {/* Texts */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-obsidian-950/80 border border-border">
                      <span className="text-[9px] uppercase text-text-muted font-sans font-semibold block mb-1">
                        Original Legal Clause:
                      </span>
                      <p className="text-text-secondary leading-relaxed">{c.originalText}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-obsidian-950/80 border border-border">
                      <span className="text-[9px] uppercase text-text-muted font-sans font-semibold block mb-1">
                        Simplified Plain Text:
                      </span>
                      <p className="text-text-secondary leading-relaxed">{c.simplifiedText}</p>
                    </div>
                  </div>

                  {/* Analysis Breakdown */}
                  <div className="space-y-2 text-xs">
                    <p className="text-rose-300 leading-relaxed">
                      <strong>Expected Issue:</strong> {c.expectedIssue}
                    </p>
                    <p className="text-text-secondary leading-relaxed">
                      <strong>Why It Matters:</strong> {c.whyItMatters}
                    </p>
                    <div className="p-2.5 rounded-lg bg-obsidian-950 border border-border/80 text-[11px] text-gold-champagne">
                      <strong className="text-text-primary">Human Review Question:</strong>{' '}
                      {c.humanReviewQuestion}
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">{c.domain}</span>
                  <Link href={`/analyzer`}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Analyze in Analyzer
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
