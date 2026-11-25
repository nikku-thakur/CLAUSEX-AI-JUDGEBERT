'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  BookOpen,
  HelpCircle,
  Sparkles,
  Check,
  Tag,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LocalStorageService } from '@/lib/storage/local-storage';
import { HumanAnnotationRecord } from '@/types/annotations';
import { ANNOTATION_GUIDELINES } from '@/data/annotations-data';
import { ChangeCategory } from '@/types/analysis';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv, downloadJson } from '@/lib/export/export-utils';

export default function HumanAnnotationsPage() {
  const [annotations, setAnnotations] = useState<HumanAnnotationRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  // Form state for current pair
  const [currentRating, setCurrentRating] = useState<number>(8.0);
  const [currentNotes, setCurrentNotes] = useState<string>('');
  const [currentTags, setCurrentTags] = useState<ChangeCategory[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const list = LocalStorageService.getAnnotations();
    setAnnotations(list);
    if (list.length > 0) {
      loadPairIntoForm(list[0]);
    }
  }, []);

  const loadPairIntoForm = (pair: HumanAnnotationRecord) => {
    setCurrentRating(pair.humanRating || 8.0);
    setCurrentNotes(pair.notes || '');
    setCurrentTags(pair.criticalTags || []);
  };

  const handleSelectIndex = (index: number) => {
    if (index < 0 || index >= annotations.length) return;
    setCurrentIndex(index);
    loadPairIntoForm(annotations[index]);
  };

  const handleToggleTag = (tag: ChangeCategory) => {
    if (currentTags.includes(tag)) {
      setCurrentTags(currentTags.filter((t) => t !== tag));
    } else {
      setCurrentTags([...currentTags, tag]);
    }
  };

  const handleSaveDraft = () => {
    if (annotations.length === 0) return;
    const current = annotations[currentIndex];
    const updated: HumanAnnotationRecord = {
      ...current,
      humanRating: currentRating,
      notes: currentNotes,
      criticalTags: currentTags,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    LocalStorageService.saveAnnotation(updated);
    const updatedList = [...annotations];
    updatedList[currentIndex] = updated;
    setAnnotations(updatedList);
    toast({
      type: 'info',
      title: 'Draft Saved',
      message: `Saved draft for pair ${current.pairId}.`,
    });
  };

  const handleSubmit = () => {
    if (annotations.length === 0) return;
    const current = annotations[currentIndex];
    const updated: HumanAnnotationRecord = {
      ...current,
      humanRating: currentRating,
      notes: currentNotes,
      criticalTags: currentTags,
      status: 'submitted',
      updatedAt: new Date().toISOString(),
    };
    LocalStorageService.saveAnnotation(updated);
    const updatedList = [...annotations];
    updatedList[currentIndex] = updated;
    setAnnotations(updatedList);

    toast({
      type: 'success',
      title: 'Annotation Submitted',
      message: `Pair ${current.pairId} marked as finalized.`,
    });

    if (currentIndex < annotations.length - 1) {
      handleSelectIndex(currentIndex + 1);
    }
  };

  const handleExportJson = () => {
    downloadJson(annotations, 'clausex-human-annotations.json');
    toast({
      type: 'success',
      title: 'Export Complete',
      message: 'Downloaded annotations as JSON.',
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Pair ID',
      'Language',
      'Domain',
      'Original Sentence',
      'Simplified Sentence',
      'Human Rating (1-10)',
      'Critical Tags',
      'Notes',
      'Status',
    ];
    const rows = annotations.map((a) => [
      a.pairId,
      a.language.toUpperCase(),
      a.domain,
      a.originalSentence,
      a.simplifiedSentence,
      a.humanRating,
      a.criticalTags.join('; '),
      a.notes,
      a.status,
    ]);
    downloadCsv(headers, rows, 'clausex-human-annotations.csv');
    toast({
      type: 'success',
      title: 'Export Complete',
      message: 'Downloaded annotations as CSV.',
    });
  };

  const currentPair = annotations[currentIndex];

  const availableTags: { tag: ChangeCategory; label: string }[] = [
    { tag: 'obligation', label: 'Obligation Shift (Shall/May)' },
    { tag: 'permission', label: 'Permission Conversion' },
    { tag: 'prohibition', label: 'Prohibition Omitted' },
    { tag: 'negation', label: 'Negation Inverted' },
    { tag: 'condition', label: 'Condition Removed' },
    { tag: 'exception', label: 'Exception Dropped' },
    { tag: 'deadline', label: 'Deadline Changed' },
    { tag: 'monetary', label: 'Monetary Cap Altered' },
    { tag: 'entity', label: 'Party / Entity Substituted' },
    { tag: 'scope', label: 'Scope Narrowed / Broadened' },
  ];

  if (!currentPair) {
    return (
      <AppShell pageTitle="Human Annotation Workspace">
        <div className="p-12 text-center text-text-muted">Loading annotations...</div>
      </AppShell>
    );
  }

  const submittedCount = annotations.filter((a) => a.status === 'submitted').length;

  return (
    <AppShell
      pageTitle="Human Annotation Workspace"
      pageDescription="Gold-standard pairwise curation: Score legal meaning preservation from 1.0 (fatal loss) to 10.0 (perfect fidelity)."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            onClick={() => setIsRubricOpen(true)}
          >
            Scoring Rubric
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportJson}
          >
            Export JSON
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress & Pagination Bar */}
        <div className="p-4 rounded-xl glass-panel border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-serif font-bold text-gold-bright">
              {currentPair.pairId}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-950 text-gold-champagne border border-border">
              {currentPair.language.toUpperCase()} • {currentPair.domain}
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                currentPair.status === 'submitted'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              {currentPair.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-text-muted">Annotated Progress: </span>
              <strong className="text-text-primary">
                {submittedCount} / {annotations.length}
              </strong>{' '}
              <span className="text-[10px] text-text-muted">(Supports 300+ pairs)</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentIndex === 0}
                onClick={() => handleSelectIndex(currentIndex - 1)}
                className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 disabled:opacity-30 text-text-secondary hover:text-text-primary border border-border transition-colors"
                title="Previous pair"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-text-muted">
                {currentIndex + 1} of {annotations.length}
              </span>
              <button
                disabled={currentIndex === annotations.length - 1}
                onClick={() => handleSelectIndex(currentIndex + 1)}
                className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 disabled:opacity-30 text-text-secondary hover:text-text-primary border border-border transition-colors"
                title="Next pair"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pair Sentence Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6 border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Original Legal Sentence
              </span>
              <span className="text-[10px] text-text-muted font-mono">Legalese</span>
            </div>
            <p className="text-xs sm:text-sm text-text-primary leading-relaxed font-serif select-text">
              {currentPair.originalSentence}
            </p>
            {currentPair.legalContext && (
              <p className="text-[11px] text-text-muted italic pt-2 border-t border-border/50">
                Context: {currentPair.legalContext}
              </p>
            )}
          </Card>

          <Card variant="glass" className="p-6 border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider">
                Simplified Plain Language Sentence
              </span>
              <span className="text-[10px] text-text-muted font-mono">Plain Language</span>
            </div>
            <p className="text-xs sm:text-sm text-text-primary leading-relaxed font-serif select-text">
              {currentPair.simplifiedSentence}
            </p>
          </Card>
        </div>

        {/* Human Rating Input Form */}
        <Card variant="gold" className="p-6 border-gold-champagne/40 space-y-6">
          {/* Rating Slider & Numeric Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-gold-bright">
                  Human Meaning Preservation (LMP) Score (1.0 to 10.0)
                </h4>
                <p className="text-xs text-text-muted">
                  1.0 = Fatal loss of legal intent / voided rights • 10.0 = Perfect operative legal fidelity
                </p>
              </div>
              <div className="text-3xl font-serif font-bold text-gold-bright">
                {currentRating.toFixed(1)} <span className="text-xs text-text-muted">/ 10</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.1"
              value={currentRating}
              onChange={(e) => setCurrentRating(parseFloat(e.target.value))}
              className="w-full accent-gold-champagne cursor-pointer h-2 bg-obsidian-950 rounded-lg"
            />

            {/* Quick buttons */}
            <div className="flex items-center justify-between text-xs text-text-muted">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentRating(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors ${
                    Math.round(currentRating) === num
                      ? 'bg-gold-bright text-obsidian-950 font-bold shadow-gold-sm'
                      : 'bg-obsidian-900 text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Critical Change Tags Multi-Select */}
          <div className="space-y-2 pt-2 border-t border-gold-champagne/20">
            <label className="text-xs font-semibold text-text-secondary block">
              Tag Critical Changes / Meaning Shifts Detected:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((item) => {
                const isSelected = currentTags.includes(item.tag);
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleToggleTag(item.tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gold-muted text-gold-bright border border-gold-champagne/40 font-semibold'
                        : 'bg-obsidian-950 text-text-secondary hover:text-text-primary border border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-gold-bright" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Annotation Notes */}
          <div className="space-y-2 pt-2 border-t border-gold-champagne/20">
            <label className="text-xs font-semibold text-text-secondary block">
              Annotator Reviewer Rationale & Notes:
            </label>
            <textarea
              rows={3}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Explain the legal reasoning behind your score (e.g. 'Preserves the core obligation, but softened the 30-day cure period to vague reasonable timeframe')..."
              className="w-full bg-obsidian-950 border border-border rounded-xl p-3 text-xs text-text-primary focus:border-gold-champagne focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gold-champagne/20">
            <span className="text-[11px] text-text-muted">
              Auto-saved to browser local storage. Compatible with batch CSV export.
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckSquare className="w-4 h-4" />}
                onClick={handleSubmit}
              >
                Submit Annotation
              </Button>
            </div>
          </div>
        </Card>

        {/* Scoring Rubric Reference Modal */}
        <Modal
          isOpen={isRubricOpen}
          onClose={() => setIsRubricOpen(false)}
          title="Gold-Standard LMP Scoring Rubric Guidance"
          description="Guidelines to ensure high inter-annotator agreement (Cohen's Kappa / Fleiss' Kappa) across reviewers."
          maxWidth="xl"
        >
          <div className="space-y-4">
            {ANNOTATION_GUIDELINES.map((rule, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-obsidian-900 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-gold-bright">
                    {rule.scoreRange}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-950 text-gold-champagne border border-border">
                    {rule.meaning}
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed">{rule.criteria}</p>
                <div className="p-2 rounded bg-obsidian-950 text-text-muted font-mono text-[11px]">
                  {rule.example}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
