'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ClauseInputPanel } from '@/components/analyzer/ClauseInputPanel';
import { AnalysisResultView } from '@/components/analyzer/AnalysisResultView';
import { apiClient } from '@/lib/analysis/api-client';
import { AnalysisResult, Language, SampleCase } from '@/types/analysis';
import { SAMPLE_CASES } from '@/data/sample-cases';
import { LocalStorageService } from '@/lib/storage/local-storage';
import { useToast } from '@/components/ui/Toast';
import {
  buildEnglishAnalysisPayload,
  getEnglishOriginalText,
  getEnglishSimplifiedText,
  hasEnglishAnalysisInputs,
} from '@/lib/analysis/english-analysis';

export default function AnalyzerPage() {
  const [originalText, setOriginalText] = useState(SAMPLE_CASES[1].originalText);
  const [simplifiedText, setSimplifiedText] = useState(SAMPLE_CASES[1].simplifiedText);
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en');
  const [englishOriginalClause, setEnglishOriginalClause] = useState(SAMPLE_CASES[1].originalText);
  const [englishSimplifiedDraft, setEnglishSimplifiedDraft] = useState(SAMPLE_CASES[1].simplifiedText);
  const [outputLanguage, setOutputLanguage] = useState<Language>('en');
  const [targetLanguageValidation, setTargetLanguageValidation] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [simplificationError, setSimplificationError] = useState<string | null>(null);
  const [domain, setDomain] = useState(SAMPLE_CASES[1].domain);
  const [legalContext, setLegalContext] = useState(SAMPLE_CASES[1].legalContext || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [hasGeneratedSimplification, setHasGeneratedSimplification] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { toast } = useToast();
  const usesDirectMultilingualAnalysis = sourceLanguage === outputLanguage && (sourceLanguage === 'hi' || sourceLanguage === 'es');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Check for structured clause pair import from Document Workspace
      const importedPairStr = localStorage.getItem('clausex_imported_clause_pair');
      if (importedPairStr) {
        try {
          const pair = JSON.parse(importedPairStr);
          if (pair.originalText) {
            setOriginalText(pair.originalText);
            // Use actual paired simplified text, or clear so user is not comparing against an unrelated default clause
            setSimplifiedText(pair.simplifiedText || '');
            setEnglishSimplifiedDraft(pair.simplifiedText || '');
            setEnglishOriginalClause(pair.originalText);
            setSourceLanguage('en');
            setOutputLanguage('en');
            setTargetLanguageValidation(null);
            setGenerationNotice(null);
            setSimplificationError(null);
            if (pair.domain) setDomain(pair.domain);
            setAnalysisResult(null);
            localStorage.removeItem('clausex_imported_clause_pair');
            localStorage.removeItem('clausex_imported_clause');
            toast({
              type: 'success',
              title: 'Document Clause Pair Imported',
              message: pair.simplifiedText
                ? `Loaded "${pair.title || 'Clause'}" and its paired simplified text.`
                : `Loaded "${pair.title || 'Clause'}". Please enter candidate simplified text to compare.`,
            });
            return;
          }
        } catch (e) {
          console.error('Error parsing imported clause pair', e);
        }
      }

      // Legacy fallback
      const imported = localStorage.getItem('clausex_imported_clause');
      if (imported) {
        setOriginalText(imported);
        setSimplifiedText(''); // Cleared so it does not evaluate against an unrelated default clause
        setEnglishSimplifiedDraft('');
        setEnglishOriginalClause('');
        setSourceLanguage('en');
        setOutputLanguage('en');
        setSimplificationError(null);
        setAnalysisResult(null);
        localStorage.removeItem('clausex_imported_clause');
        toast({
          type: 'success',
          title: 'Document Clause Imported',
          message: 'Clause loaded into Original field. Enter candidate simplified text to compare.',
        });
        return;
      }

      // The analyzer is English-only; legacy language preferences are ignored.
    }
  }, [toast]);

  const handleSwap = () => {
    if (sourceLanguage !== 'en' || outputLanguage !== 'en') return;
    const temp = originalText;
    setOriginalText(simplifiedText);
    setSimplifiedText(temp);
    setEnglishSimplifiedDraft(temp);
    toast({
      type: 'info',
      message: 'Original and simplified text swapped.',
    });
  };

  const handleClear = () => {
    setOriginalText('');
    setSimplifiedText('');
    setSourceLanguage('en');
    setEnglishOriginalClause('');
    setEnglishSimplifiedDraft('');
    setLegalContext('');
    setAnalysisResult(null);
    setHasGeneratedSimplification(false);
    setTargetLanguageValidation(null);
    setGenerationNotice(null);
    setSimplificationError(null);
    toast({
      type: 'info',
      message: 'Clause input fields cleared.',
    });
  };

  const handleLoadSample = (sample: SampleCase) => {
    setOriginalText(sample.originalText);
    setSimplifiedText(sample.simplifiedText);
    setSourceLanguage('en');
    setEnglishOriginalClause(sample.originalText);
    setEnglishSimplifiedDraft(sample.simplifiedText);
    setOutputLanguage('en');
    setDomain(sample.domain);
    setLegalContext(sample.legalContext || '');
    setAnalysisResult(null);
    setHasGeneratedSimplification(false);
    setTargetLanguageValidation(null);
    setGenerationNotice(null);
    setSimplificationError(null);
    toast({
      type: 'success',
      title: 'Sample Case Loaded',
      message: `Loaded "${sample.title}"`,
    });
  };

  const handleAutoSimplify = async () => {
    if (!originalText.trim()) return;
    setIsSimplifying(true);
    setSimplificationError(null);
    setEnglishOriginalClause('');
    setEnglishSimplifiedDraft('');
    setAnalysisResult(null);
    if (outputLanguage !== 'en') setSimplifiedText('');
    try {
      const response = await apiClient.simplifyAndTranslate({
        originalText,
        sourceLanguage,
        targetLanguage: outputLanguage,
        domain,
        legalContext,
      });
      setEnglishOriginalClause(response.originalEnglish);
      setEnglishSimplifiedDraft(response.simplifiedEnglish);
      setOutputLanguage(response.targetLanguage);
      setSimplifiedText(response.translationCompleted ? response.translatedText : '');
      // In same-language Hindi/Spanish mode, this is only English verification.
      // Do not render it under the native-language results heading; wait for the
      // user's direct Hindi/Spanish analysis request.
      setAnalysisResult(usesDirectMultilingualAnalysis ? null : response.englishVerification);
      setTargetLanguageValidation(response.translationCompleted ? response.targetLanguageValidation : null);
      setGenerationNotice(response.generationNotice);
      setSimplificationError(response.translationError || null);
      setHasGeneratedSimplification(true);
      toast({
        type: response.translationCompleted ? 'success' : 'info',
        title: response.translationCompleted ? 'Simplification Ready' : 'English Pair Ready for Review',
        message: response.translationCompleted
          ? `Generated and analyzed the English pair; output is in ${response.targetLanguage.toUpperCase()}.`
          : response.translationError || 'Translation was paused. The English pair remains available for analysis.',
      });
    } catch (error) {
      setTargetLanguageValidation(null);
      setGenerationNotice(null);
      setSimplificationError(error instanceof Error ? error.message : 'Could not simplify and translate this clause.');
      toast({
        type: 'error',
        title: 'Simplification Unavailable',
        message: error instanceof Error ? error.message : 'Could not simplify and translate this clause.',
      });
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleAnalyze = async () => {
    if (usesDirectMultilingualAnalysis) {
      if (!originalText.trim() || !simplifiedText.trim()) {
        toast({ type: 'info', title: 'Clause Pair Required', message: 'Enter both the original and simplified clause in the selected language.' });
        return;
      }
      setIsLoading(true);
      try {
        const result = await apiClient.analyzeMultilingualWithBackend({
          originalText, simplifiedText, language: sourceLanguage, domain, legalContext,
        });
        setAnalysisResult(result);
        LocalStorageService.saveAnalysis(result);
        toast({ type: 'success', title: 'Multilingual Analysis Complete', message: `${sourceLanguage === 'hi' ? 'Hindi' : 'Spanish'} pair evaluated directly with the experimental multilingual model.` });
      } catch (e) {
        toast({ type: 'error', title: 'Analysis Failed', message: e instanceof Error ? e.message : 'Could not complete multilingual clause evaluation.' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const englishOriginalForAnalysis = getEnglishOriginalText(
      sourceLanguage,
      originalText,
      englishOriginalClause,
    );
    const englishTextForAnalysis = getEnglishSimplifiedText(
      outputLanguage,
      simplifiedText,
      englishSimplifiedDraft,
    );
    if (!hasEnglishAnalysisInputs(englishOriginalForAnalysis, englishTextForAnalysis)) {
      toast({
        type: 'info',
        title: 'English Draft Required',
        message: outputLanguage === 'en'
          ? 'Enter an English simplified clause or generate one before analyzing.'
          : 'Generate a simplification first to create the English draft for analysis.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = buildEnglishAnalysisPayload(
        englishOriginalForAnalysis,
        englishTextForAnalysis,
        domain,
        legalContext,
      );
      const result = sourceLanguage === 'en' && outputLanguage === 'en'
        ? (await apiClient.analyze({ ...payload, language: 'en' })).result
        : await apiClient.analyzeEnglishWithBackend(payload);

      setAnalysisResult(result);
      // Auto-save to local history
      LocalStorageService.saveAnalysis(result);

      toast({
        type: 'success',
        title: 'Analysis Complete',
        message: `English version evaluated with score ${result.lmpScore.toFixed(1)}/10. Translated text was not analyzed.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Analysis Failed',
        message: e instanceof Error ? e.message : 'Could not complete clause evaluation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell
      pageTitle="Clause Analyzer"
      pageDescription="Evaluate whether simplified legal text preserves the operative duties, conditions, and intent of the original."
    >
      <div className="space-y-10">
        {/* Input Panel */}
        <ClauseInputPanel
          originalText={originalText}
          simplifiedText={simplifiedText}
          sourceLanguage={sourceLanguage}
          englishOriginalClause={englishOriginalClause}
          englishSimplifiedDraft={englishSimplifiedDraft}
          domain={domain}
          legalContext={legalContext}
          isLoading={isLoading}
          isSimplifying={isSimplifying}
          hasGeneratedSimplification={hasGeneratedSimplification}
          outputLanguage={outputLanguage}
          translationNotice={targetLanguageValidation}
          generationNotice={generationNotice}
          simplificationError={simplificationError}
          onOriginalChange={(value) => {
            setOriginalText(value);
            setEnglishOriginalClause('');
            setEnglishSimplifiedDraft('');
            if (outputLanguage !== 'en') setSimplifiedText('');
            setHasGeneratedSimplification(false);
            setTargetLanguageValidation(null);
            setGenerationNotice(null);
            setSimplificationError(null);
            setAnalysisResult(null);
          }}
          onSimplifiedChange={(value) => {
            setSimplifiedText(value);
            if (outputLanguage === 'en') {
              setEnglishSimplifiedDraft(value);
              setAnalysisResult(null);
            }
          }}
          onAutoSimplify={handleAutoSimplify}
          onOutputLanguageChange={(language) => {
            setOutputLanguage(language);
            setSimplifiedText(language === 'en' ? englishSimplifiedDraft : '');
            setTargetLanguageValidation(null);
            setGenerationNotice(null);
            setSimplificationError(null);
          }}
          onSourceLanguageChange={(language) => {
            setSourceLanguage(language);
            setEnglishOriginalClause('');
            setEnglishSimplifiedDraft('');
            setSimplifiedText('');
            setHasGeneratedSimplification(false);
            setAnalysisResult(null);
            setTargetLanguageValidation(null);
            setGenerationNotice(null);
            setSimplificationError(null);
          }}
          onDomainChange={setDomain}
          onLegalContextChange={setLegalContext}
          onSwapTexts={handleSwap}
          onClear={handleClear}
          onLoadSample={handleLoadSample}
          onSubmit={handleAnalyze}
        />

        {!usesDirectMultilingualAnalysis && (sourceLanguage !== 'en' || outputLanguage !== 'en') && (englishOriginalClause || englishSimplifiedDraft) && (
          <section className="rounded-xl border border-border bg-obsidian-950/70 p-4 sm:p-5 space-y-4" aria-labelledby="english-verified-draft-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="english-verified-draft-heading" className="text-xs font-semibold uppercase tracking-wider text-gold-champagne">
                {analysisResult?.modelAnalysis?.is_multilingual
                  ? `Native ${analysisResult.language === 'hi' ? 'Hindi' : 'Spanish'} pair analyzed by JudgeBERT v3` : analysisResult?.modelAnalysis?.is_v2
                  ? 'English pair analyzed by JudgeBERT v2'
                  : analysisResult
                    ? 'English pair analysis results'
                    : 'English pair for analysis'}
              </h3>
              <span className="text-[10px] text-text-muted">English analysis only · translated text is not independently validated</span>
            </div>
            {englishOriginalClause && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">English original sent for analysis</p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-primary">{englishOriginalClause}</p>
              </div>
            )}
            {englishSimplifiedDraft && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">English simplified draft sent for analysis</p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-primary">{englishSimplifiedDraft}</p>
              </div>
            )}
          </section>
        )}

        {/* Results View */}
        {analysisResult && (
          <div className="pt-6 border-t border-border">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-text-primary">
              {usesDirectMultilingualAnalysis
                ? `${sourceLanguage === 'hi' ? 'Hindi' : 'Spanish'} Evaluation Findings`
                : outputLanguage === 'en' ? 'Evaluation Findings & Explainability' : 'English Verification & Explainability'}
              </h3>
              <span className="text-xs font-mono text-gold-champagne">
                ID: {analysisResult.id}
              </span>
            </div>
            {usesDirectMultilingualAnalysis ? (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
                JudgeBERT v3 multilingual evaluates this {sourceLanguage === 'hi' ? 'Hindi' : 'Spanish'} pair directly. It is experimental and not legally validated. {sourceLanguage === 'es' ? 'Spanish rule-based checks are unavailable.' : 'Hindi rule checks are partial.'}
              </p>
            ) : outputLanguage !== 'en' && (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
                These results apply only to the original English clause and its English draft. They do not validate the translated text.
              </p>
            )}
            <AnalysisResultView analysis={analysisResult} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
