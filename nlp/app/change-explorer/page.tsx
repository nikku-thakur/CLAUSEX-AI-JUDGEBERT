'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Scale,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Clock,
  Coins,
  Scissors,
  Users,
  Compass,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChangeCategory, SeverityLevel, Language } from '@/types/analysis';

interface LegalChangeItem {
  id: string;
  category: ChangeCategory;
  severity: SeverityLevel;
  title: string;
  language: Language;
  originalExcerpt: string;
  simplifiedExcerpt: string;
  explanation: string;
  legalSignificance: string;
  evidenceSource: string;
  caseRef: string;
}

const ALL_CHANGES: LegalChangeItem[] = [
  {
    id: 'ch-1',
    category: 'obligation',
    severity: 'critical',
    title: 'Mandatory Software Breach Notification Relaxed',
    language: 'en',
    originalExcerpt: 'Licensee shall immediately notify Licensor in writing',
    simplifiedExcerpt: 'customer may contact the software provider',
    explanation: 'Converting shall into may eliminates mandatory reporting duty and contract breach remedies.',
    legalSignificance: 'Precludes damages for unreported security incidents or IP infringement.',
    evidenceSource: 'deontic_shift',
    caseRef: 'sample-2-obligation-weakened',
  },
  {
    id: 'ch-2',
    category: 'permission',
    severity: 'critical',
    title: 'Discretionary Telemetry Logging Made Mandatory',
    language: 'en',
    originalExcerpt: 'Data Processor may, at its reasonable election, archive anonymized telemetry',
    simplifiedExcerpt: 'vendor is required to retain user usage records',
    explanation: 'Elective privilege burdened with continuous retention liability.',
    legalSignificance: 'Potential violation of data minimization and storage limitation regulations.',
    evidenceSource: 'deontic_shift',
    caseRef: 'sample-3-permission-to-obligation',
  },
  {
    id: 'ch-3',
    category: 'prohibition',
    severity: 'critical',
    title: 'Anti-Assignment Bar Erased in Subcontracting',
    language: 'en',
    originalExcerpt: 'Under no circumstances shall Contractor assign or delegate obligations',
    simplifiedExcerpt: 'contractor will carry out the tasks set out in this agreement',
    explanation: 'Negative prohibition against assignment was omitted completely.',
    legalSignificance: 'Principal loses privity of contract and control over performing subcontractors.',
    evidenceSource: 'negation_inversion',
    caseRef: 'diff-3-prohibition-omitted',
  },
  {
    id: 'ch-4',
    category: 'negation',
    severity: 'critical',
    title: 'Consequential Damage Disclaimer Inverted',
    language: 'en',
    originalExcerpt: 'Under no circumstances shall Seller be liable for consequential damages',
    simplifiedExcerpt: 'The seller is liable for indirect or consequential losses',
    explanation: 'Complete polarity inversion of contract risk allocation.',
    legalSignificance: 'Exposes seller to catastrophic uncapped indemnification claims.',
    evidenceSource: 'negation_inversion',
    caseRef: 'sample-4-negation-removed',
  },
  {
    id: 'ch-5',
    category: 'condition',
    severity: 'critical',
    title: 'Timely Mitigation Proof Condition Removed',
    language: 'en',
    originalExcerpt: 'provided that Policyholder delivers immediate proof of timely mitigation',
    simplifiedExcerpt: 'insurance company must pay the policyholder for claims',
    explanation: 'Condition precedent dropped, turning conditional payout into unconditional guarantee.',
    legalSignificance: 'Policyholder can recover without proving duty-to-mitigate adherence.',
    evidenceSource: 'condition_removal',
    caseRef: 'sample-7-condition-removed',
  },
  {
    id: 'ch-6',
    category: 'exception',
    severity: 'critical',
    title: 'Subpoena Disclosure Exception Omitted',
    language: 'en',
    originalExcerpt: 'except where disclosure is mandated by a valid court order or regulatory decree',
    simplifiedExcerpt: 'must keep all secret company information confidential at all times',
    explanation: 'Carve-out for compliance with judicial subpoena removed.',
    legalSignificance: 'Forces receiving party into dilemma between court contempt or contract breach.',
    evidenceSource: 'condition_removal',
    caseRef: 'sample-6-exception-omitted',
  },
  {
    id: 'ch-7',
    category: 'deadline',
    severity: 'warning',
    title: 'Dispute Arbitration Notice Period Doubled',
    language: 'en',
    originalExcerpt: 'thirty (30) business days prior to filing',
    simplifiedExcerpt: 'at least sixty days before filing',
    explanation: 'Waiting period doubled from 30 business days to 60 calendar days.',
    legalSignificance: 'May prejudice statute of limitations deadlines for emergency relief.',
    evidenceSource: 'textual_diff',
    caseRef: 'sample-5-deadline-changed',
  },
  {
    id: 'ch-8',
    category: 'monetary',
    severity: 'critical',
    title: 'Liquidated Damages Reduced by Order of Magnitude',
    language: 'en',
    originalExcerpt: 'forfeit the sum of $250,000 as agreed liquidated damages',
    simplifiedExcerpt: 'must pay $25,000 in fixed penalties',
    explanation: 'Missing zero reduces damages penalty by 90%.',
    legalSignificance: 'Destroys agreed deterrence and contractual remedy calculation.',
    evidenceSource: 'textual_diff',
    caseRef: 'sample-8-monetary-amount-changed',
  },
  {
    id: 'ch-9',
    category: 'entity',
    language: 'en',
    severity: 'critical',
    title: 'Solvent General Contractor Swapped for Unbonded Subcontractors',
    originalExcerpt: 'General Contractor shall indemnify Project Owner for defects',
    simplifiedExcerpt: 'electrical subcontractors will directly pay the property owner',
    explanation: 'Party substitution removes direct contractual privity.',
    legalSignificance: 'Owner cannot attach general master contractor insurance bonds.',
    evidenceSource: 'entity_check',
    caseRef: 'diff-11-responsible-party-changed',
  },
  {
    id: 'ch-10',
    category: 'scope',
    language: 'en',
    severity: 'warning',
    title: 'European Union Non-Compete Scope Confined to London',
    originalExcerpt: 'within any territory across the European Union or the United Kingdom',
    simplifiedExcerpt: 'promises not to work for competitor tech firms located in London',
    explanation: 'Territorial restrictive covenant shrunk to single city.',
    legalSignificance: 'Permits former employee to consult for competitors in Berlin or Paris.',
    evidenceSource: 'textual_diff',
    caseRef: 'diff-9-scope-narrowed',
  },
  {
    id: 'ch-11',
    category: 'omitted_content',
    language: 'en',
    severity: 'critical',
    title: 'Choice of Law & New York Jurisdiction Omitted',
    originalExcerpt: 'shall be interpreted exclusively under the laws of the State of New York',
    simplifiedExcerpt: '[Entire governing law clause dropped]',
    explanation: 'Severability retained but choice of forum omitted.',
    legalSignificance: 'Invites expensive international forum shopping disputes.',
    evidenceSource: 'textual_diff',
    caseRef: 'diff-15-important-clause-omitted',
  },
];

export default function LegalChangeExplorerPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'All Categories', value: 'all', icon: <Filter className="w-3.5 h-3.5" /> },
    { label: 'Obligations', value: 'obligation', icon: <Scale className="w-3.5 h-3.5" /> },
    { label: 'Permissions', value: 'permission', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { label: 'Prohibitions', value: 'prohibition', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { label: 'Negation', value: 'negation', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { label: 'Conditions', value: 'condition', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Exceptions', value: 'exception', icon: <Scissors className="w-3.5 h-3.5" /> },
    { label: 'Deadlines', value: 'deadline', icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'Monetary', value: 'monetary', icon: <Coins className="w-3.5 h-3.5" /> },
    { label: 'Parties & Entities', value: 'entity', icon: <Users className="w-3.5 h-3.5" /> },
    { label: 'Scope', value: 'scope', icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  const filtered = ALL_CHANGES.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && c.severity !== selectedSeverity) return false;
    if (c.language !== 'en') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.originalExcerpt.toLowerCase().includes(q) ||
        c.simplifiedExcerpt.toLowerCase().includes(q) ||
        c.explanation.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <AppShell
      pageTitle="Legal Change Explorer"
      pageDescription="Taxonomy of operative legal shifts, deontic alterations, and condition removals."
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="p-4 rounded-xl glass-panel border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal changes by excerpt or explanation..."
                className="w-full bg-obsidian-950 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:border-gold-champagne focus:outline-none"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="text-xs bg-obsidian-950 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
              </select>

            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-gold-muted text-gold-bright border border-gold-champagne/40 font-semibold'
                    : 'bg-obsidian-900 text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Change Count Header */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Showing <strong className="text-gold-bright">{filtered.length}</strong> legal change patterns
          </span>
          <span className="text-[11px] font-mono">Illustrative taxonomy dataset</span>
        </div>

        {/* Changes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isCritical = item.severity === 'critical';
            return (
              <Card
                key={item.id}
                variant="glass"
                className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                  isCritical ? 'border-rose-500/30' : 'border-amber-500/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-border">
                      {item.language.toUpperCase()} • {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-text-primary">{item.title}</h4>

                  {/* Excerpts */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-obsidian-950 border border-border">
                      <span className="text-[9px] uppercase text-text-muted block">Original:</span>
                      <span className="text-rose-200">{item.originalExcerpt}</span>
                    </div>
                    <div className="p-2.5 rounded bg-obsidian-950 border border-border">
                      <span className="text-[9px] uppercase text-text-muted block">Simplified:</span>
                      <span className="text-amber-200">{item.simplifiedExcerpt}</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">{item.explanation}</p>

                  <div className="text-[11px] font-semibold text-rose-300 leading-snug">
                    <strong>Jurisprudential Impact:</strong> {item.legalSignificance}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-text-muted">
                    Engine: <code>{item.evidenceSource}</code>
                  </span>
                  <Link href={`/analyzer`}>
                    <Button variant="ghost" size="sm" className="text-xs text-gold-bright hover:underline p-0">
                      Test in Analyzer →
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
