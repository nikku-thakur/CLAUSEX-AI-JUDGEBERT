'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ArrowLeftRight,
  BookOpen,
  Sparkles,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SAMPLE_CASES } from '@/data/sample-cases';
import { Language, SampleCase } from '@/types/analysis';
import {
  getEnglishOriginalText,
  getEnglishSimplifiedText,
  hasEnglishAnalysisInputs,
} from '@/lib/analysis/english-analysis';

interface ClauseInputPanelProps {
  originalText: string;
  simplifiedText: string;
  englishSimplifiedDraft: string;
  englishOriginalClause: string;
  sourceLanguage: Language;
  domain: string;
  legalContext: string;
  isLoading: boolean;
  isSimplifying: boolean;
  hasGeneratedSimplification: boolean;
  outputLanguage: Language;
  translationNotice: string | null;
  generationNotice: string | null;
  simplificationError: string | null;
  onOriginalChange: (val: string) => void;
  onSimplifiedChange: (val: string) => void;
  onAutoSimplify: () => void;
  onOutputLanguageChange: (language: Language) => void;
  onSourceLanguageChange: (language: Language) => void;
  onDomainChange: (domain: string) => void;
  onLegalContextChange: (ctx: string) => void;
  onSwapTexts: () => void;
  onClear: () => void;
  onLoadSample: (sample: SampleCase) => void;
  onSubmit: () => void;
}

export const ClauseInputPanel: React.FC<ClauseInputPanelProps> = ({
  originalText,
  simplifiedText,
  englishSimplifiedDraft,
  englishOriginalClause,
  sourceLanguage,
  domain,
  legalContext,
  isLoading,
  isSimplifying,
  hasGeneratedSimplification,
  outputLanguage,
  translationNotice,
  generationNotice,
  simplificationError,
  onOriginalChange,
  onSimplifiedChange,
  onAutoSimplify,
  onOutputLanguageChange,
  onSourceLanguageChange,
  onDomainChange,
  onLegalContextChange,
  onSwapTexts,
  onClear,
  onLoadSample,
  onSubmit,
}) => {
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const origWordCount = originalText.trim().split(/\s+/).filter(Boolean).length;
  const simpWordCount = simplifiedText.trim().split(/\s+/).filter(Boolean).length;

  const domains = [
    'General Commercial / Contract Law',
    'Intellectual Property / Software Licensing',
    'Tenancy & Real Estate (Common Law / India)',
    'Employment & Restrictive Covenants',
    'Banking, Debt & Escrow Agreements',
    'Corporate M&A & Due Diligence',
    'Consumer Protection & Compliance',
    'Arbitration & Dispute Resolution',
  ];

  const handleSelectSample = (sample: SampleCase) => {
    onLoadSample(sample);
    setSampleDropdownOpen(false);
  };

  const englishOriginalForAnalysis = getEnglishOriginalText(sourceLanguage, originalText, englishOriginalClause);
  const englishTextForAnalysis = getEnglishSimplifiedText(outputLanguage, simplifiedText, englishSimplifiedDraft);
  const usesDirectMultilingualAnalysis = sourceLanguage === outputLanguage && (sourceLanguage === 'hi' || sourceLanguage === 'es');
  const hasAnalysisInputs = usesDirectMultilingualAnalysis
    ? Boolean(originalText.trim() && simplifiedText.trim())
    : hasEnglishAnalysisInputs(englishOriginalForAnalysis, englishTextForAnalysis);
  const isSubmitDisabled = !hasAnalysisInputs || isLoading;
  const missingAnalysisMessage = !originalText.trim()
    ? 'Enter the original clause before analyzing.'
    : usesDirectMultilingualAnalysis && !simplifiedText.trim()
      ? 'Enter a simplified clause in the selected language or generate one first.'
      : !usesDirectMultilingualAnalysis && !englishOriginalForAnalysis.trim()
      ? 'Click Auto Simplify to translate the original into English first.'
      : !usesDirectMultilingualAnalysis && !englishTextForAnalysis.trim()
        ? 'Generate a simplification first to create the English draft for analysis.'
        : null;
  const languageNames: Record<Language, string> = {
    en: 'English', hi: 'Hindi', ja: 'Japanese', es: 'Spanish',
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-border">
        {/* Domain Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Original language</span>
            <select
              value={sourceLanguage}
              onChange={(e) => onSourceLanguageChange(e.target.value as Language)}
              disabled={isSimplifying || isLoading}
              className="text-xs bg-obsidian-950 border border-border rounded-lg px-3 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              aria-label="Original clause language"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
          {/* Domain Dropdown */}
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="text-xs bg-obsidian-950 border border-border rounded-lg px-3 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Output language</span>
            <select
              value={outputLanguage}
              onChange={(e) => onOutputLanguageChange(e.target.value as Language)}
              disabled={isSimplifying || isLoading}
              className="text-xs bg-obsidian-950 border border-border rounded-lg px-3 py-1.5 text-text-primary focus:border-gold-champagne focus:outline-none"
              aria-label="Simplification output language"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Preset Samples & Reset Controls */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-gold-bright" />}
              onClick={() => setSampleDropdownOpen(!sampleDropdownOpen)}
            >
              Load Sample Case
            </Button>

            {sampleDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-dropdown rounded-xl border border-gold-champagne/30 shadow-2xl z-50 p-2 max-h-96 overflow-y-auto animate-in fade-in duration-150">
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-gold-champagne border-b border-border/60">
                  Select Illustrative Sample Case
                </div>
                <div className="py-1 space-y-1">
                  {SAMPLE_CASES.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectSample(sc)}
                      className="w-full text-left p-2 rounded-lg hover:bg-obsidian-850 text-xs transition-colors flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary truncate">{sc.title}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-obsidian-800 text-gold-champagne font-mono">
                          EN
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted truncate">{sc.expectedIssue}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSwapTexts}
            className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 text-text-secondary hover:text-gold-bright border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Swap Original and Simplified texts"
            disabled={sourceLanguage !== 'en' || outputLanguage !== 'en'}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 text-text-secondary hover:text-rose-400 border border-border transition-colors"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side by Side Input Textareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider flex items-center gap-1.5">
              <span>Original Legal Clause ({languageNames[sourceLanguage]})</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-text-muted font-mono">
              {origWordCount} words • {originalText.length} chars
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={7}
              value={originalText}
              onChange={(e) => onOriginalChange(e.target.value)}
              placeholder="Paste the original legal clause here..."
              className="w-full bg-obsidian-950/90 border border-border rounded-xl p-4 text-xs text-text-primary leading-relaxed placeholder:text-text-muted/60 focus:border-gold-champagne/80 focus:ring-1 focus:ring-gold-champagne/40 focus:outline-none transition-all resize-y font-sans"
            />
          </div>
        </div>

        {/* Simplified Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-serif font-bold text-gold-champagne uppercase tracking-wider flex items-center gap-1.5">
              <span>Simplified Plain Language Clause ({languageNames[outputLanguage]})</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-text-muted font-mono">
              {simpWordCount} words • {simplifiedText.length} chars
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!originalText.trim() || isSimplifying || isLoading}
              isLoading={isSimplifying}
              onClick={onAutoSimplify}
              leftIcon={hasGeneratedSimplification ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto border-gold-champagne/40 text-gold-bright"
            >
              {isSimplifying
                ? 'Simplifying your legal clause...'
                : hasGeneratedSimplification
                  ? 'Regenerate'
                  : 'Auto Simplify'}
            </Button>
            <span className="text-[10px] leading-relaxed text-text-muted">
              {usesDirectMultilingualAnalysis
                ? `JudgeBERT v3 evaluates the ${languageNames[sourceLanguage]} pair directly (experimental). ${sourceLanguage === 'es' ? 'Spanish rule checks are unavailable.' : 'Hindi rule checks are partial.'}`
                : `${sourceLanguage === 'en' ? 'The English original' : `The ${languageNames[sourceLanguage]} original is translated into English`} is simplified and checked in English${outputLanguage === 'en' ? ' by JudgeBERT v2 and rule checks.' : `, then translated to ${languageNames[outputLanguage]}. JudgeBERT v2 does not validate translated text.`}`}
            </span>
          </div>

          {translationNotice && outputLanguage !== 'en' && (
            <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
              {translationNotice}
            </div>
          )}
          {generationNotice && (
            <p className="text-[10px] leading-relaxed text-text-muted">{generationNotice}</p>
          )}
          {simplificationError && (
            <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-200">
              {simplificationError}
            </div>
          )}

          <div className="relative">
            <textarea
              rows={7}
              value={simplifiedText}
              onChange={(e) => onSimplifiedChange(e.target.value)}
              placeholder={`Enter or edit the simplified ${languageNames[outputLanguage]} version...`}
              className="w-full bg-obsidian-950/90 border border-border rounded-xl p-4 text-xs text-text-primary leading-relaxed placeholder:text-text-muted/60 focus:border-gold-champagne/80 focus:ring-1 focus:ring-gold-champagne/40 focus:outline-none transition-all resize-y font-sans"
            />
          </div>
        </div>
      </div>

      {/* Advanced Optional Context Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-gold-champagne hover:text-gold-bright flex items-center gap-1.5 transition-colors font-medium"
        >
          <span>{showAdvanced ? 'Hide Additional Context' : '+ Add Optional Legal Context & Jurisdiction'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-obsidian-900/60 border border-border space-y-3 animate-in fade-in duration-200">
            <label className="text-[11px] font-semibold text-text-secondary block">
              Contract Recitals / Surrounding Context:
            </label>
            <textarea
              rows={2}
              value={legalContext}
              onChange={(e) => onLegalContextChange(e.target.value)}
              placeholder="e.g. Master Services Agreement governing cloud data retention under GDPR & California Consumer Privacy Act..."
              className="w-full bg-obsidian-950 border border-border rounded-lg p-2.5 text-xs text-text-primary focus:border-gold-champagne focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <HelpCircle className="w-4 h-4 text-gold-champagne shrink-0" />
          <span>
            {usesDirectMultilingualAnalysis
              ? `Experimental JudgeBERT v3 evaluates the ${languageNames[sourceLanguage]} pair directly. It is not legally validated; ${sourceLanguage === 'es' ? 'Spanish rule checks are unavailable.' : 'Hindi rule checks are partial.'}`
              : 'JudgeBERT v2 evaluates only the English original and English draft. It does not validate translated text.'}
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          className="w-full sm:w-auto shadow-gold-md px-8"
          leftIcon={<Sparkles className="w-5 h-5" />}
        >
          {isLoading ? 'Analyzing Operative Force...' : usesDirectMultilingualAnalysis ? `Analyze ${languageNames[sourceLanguage]} Version` : outputLanguage === 'en' ? 'Analyze Legal Meaning' : 'Analyze English Version'}
        </Button>
      </div>
      {missingAnalysisMessage && (
        <p role="status" className="-mt-3 text-right text-[10px] text-amber-200/90">
          {missingAnalysisMessage}
        </p>
      )}
    </div>
  );
};
