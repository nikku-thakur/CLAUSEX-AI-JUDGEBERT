export type OutputLanguage = 'en' | 'hi' | 'ja' | 'es';

export interface EnglishAnalysisPayload {
  originalText: string;
  simplifiedText: string;
  domain?: string;
  legalContext?: string;
}

export function getEnglishOriginalText(
  sourceLanguage: OutputLanguage,
  visibleOriginalText: string,
  englishOriginal: string,
): string {
  return sourceLanguage === 'en' ? visibleOriginalText : englishOriginal;
}

export function getEnglishSimplifiedText(
  outputLanguage: OutputLanguage,
  visibleText: string,
  englishDraft: string,
): string {
  return outputLanguage === 'en' ? visibleText : englishDraft;
}

export function buildEnglishAnalysisPayload(
  originalText: string,
  simplifiedText: string,
  domain?: string,
  legalContext?: string,
): EnglishAnalysisPayload {
  return { originalText, simplifiedText, domain, legalContext };
}

export function hasEnglishAnalysisInputs(originalText: string, simplifiedText: string): boolean {
  return Boolean(originalText.trim() && simplifiedText.trim());
}
