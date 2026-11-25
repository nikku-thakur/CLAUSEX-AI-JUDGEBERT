'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Filter,
  Trash2,
  FileText,
  ExternalLink,
  Download,
  AlertTriangle,
  RotateCcw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ReportModal } from '@/components/analyzer/ReportModal';
import { LocalStorageService } from '@/lib/storage/local-storage';
import { AnalysisResult } from '@/types/analysis';
import { useToast } from '@/components/ui/Toast';
import { downloadJson } from '@/lib/export/export-utils';

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'score_asc' | 'score_desc'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedForReport, setSelectedForReport] = useState<AnalysisResult | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const list = LocalStorageService.getHistory();
    setHistory(list);
  };

  const handleDelete = (id: string) => {
    LocalStorageService.deleteAnalysis(id);
    loadHistory();
    setDeleteConfirmId(null);
    toast({
      type: 'info',
      message: 'Analysis deleted from local history.',
    });
  };

  const handleClearAll = () => {
    LocalStorageService.clearHistory();
    setHistory([]);
    toast({
      type: 'info',
      message: 'All local history cleared.',
    });
  };

  const handleExportAll = () => {
    downloadJson(history, 'clausex-all-analyses.json');
    toast({
      type: 'success',
      title: 'History Exported',
      message: 'Downloaded complete analysis history as JSON.',
    });
  };

  const filteredHistory = history
    .filter((item) => {
      if (statusFilter !== 'all' && item.preservationStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.domain?.toLowerCase().includes(q) ||
          item.originalText.toLowerCase().includes(q) ||
          item.simplifiedText.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'score_asc') return a.lmpScore - b.lmpScore;
      if (sortBy === 'score_desc') return b.lmpScore - a.lmpScore;
      return 0;
    });

  return (
    <AppShell
      pageTitle="Analysis History"
      pageDescription="Search, inspect, and export your previous legal meaning preservation evaluations."
      actions={
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportAll}
            >
              Export All
            </Button>
          )}
          <Link href="/analyzer">
            <Button variant="primary" size="sm">
              New Analysis
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="p-4 rounded-xl glass-panel border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by domain, text, or ID..."
                className="w-full bg-obsidian-950 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:border-gold-champagne focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-obsidian-950 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="preserved">Preserved</option>
                <option value="subtle_shift">Subtle Shift</option>
                <option value="critical_alteration">Critical Alteration</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-obsidian-950 border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score (Risk First)</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg bg-obsidian-950 p-1 border border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-gold-muted text-gold-bright' : 'text-text-muted'
                  }`}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-gold-muted text-gold-bright' : 'text-text-muted'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Count & Clear All */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Found <strong className="text-gold-bright">{filteredHistory.length}</strong> stored
            records
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-text-muted hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 && (
          <Card variant="subtle" className="p-12 text-center space-y-3">
            <History className="w-10 h-10 mx-auto text-gold-champagne/40" />
            <h4 className="text-base font-serif font-bold text-text-primary">No Analysis Records Found</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Run an evaluation in the Clause Analyzer to save comparisons to your browser history.
            </p>
            <div className="pt-2">
              <Link href="/analyzer">
                <Button variant="primary" size="sm">
                  Run New Analysis
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* History Items: List or Grid */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card
                key={item.id}
                variant="glass"
                hoverEffect
                className="p-5 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-border">
                      {item.language.toUpperCase()}
                    </span>
                    <span className="text-xs font-serif font-bold text-text-primary truncate">
                      {item.domain}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-obsidian-950 border border-border text-text-secondary line-clamp-2">
                      <strong className="text-[10px] text-text-muted uppercase block">Orig:</strong>
                      {item.originalText}
                    </div>
                    <div className="p-2 rounded bg-obsidian-950 border border-border text-text-secondary line-clamp-2">
                      <strong className="text-[10px] text-text-muted uppercase block">Simp:</strong>
                      {item.simplifiedText}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-serif font-bold text-gold-bright">
                      {item.lmpScore.toFixed(1)} <span className="text-xs text-text-muted">/ 10</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                        item.preservationStatus === 'preserved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {item.preservationStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedForReport(item)}
                      className="text-xs"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      Report
                    </Button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <Card
                key={item.id}
                variant="glass"
                hoverEffect
                className="p-5 border-border flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-850 text-gold-champagne border border-border">
                      {item.language.toUpperCase()}
                    </span>
                    <span className="text-base font-serif font-bold text-gold-bright">
                      {item.lmpScore.toFixed(1)} / 10
                    </span>
                  </div>

                  <h5 className="font-serif font-bold text-xs text-text-primary truncate">
                    {item.domain}
                  </h5>

                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {item.originalText}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedForReport(item)}
                      className="text-xs"
                    >
                      Report
                    </Button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1 rounded text-text-muted hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          title="Confirm Record Deletion"
          description="Are you sure you want to permanently delete this analysis record?"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-text-secondary">
              This action cannot be undone. The record will be removed from your browser storage.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </Modal>

        {/* Report Modal */}
        <ReportModal
          isOpen={selectedForReport !== null}
          onClose={() => setSelectedForReport(null)}
          analysis={selectedForReport}
        />
      </div>
    </AppShell>
  );
}
