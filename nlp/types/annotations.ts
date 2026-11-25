import { Language, ChangeCategory } from './analysis';

export interface HumanAnnotationRecord {
  pairId: string;
  originalSentence: string;
  simplifiedSentence: string;
  language: Language;
  domain: string;
  legalContext?: string;
  humanRating: number; // 1 to 10 scale
  notes: string;
  criticalTags: ChangeCategory[];
  annotatorId?: string;
  updatedAt: string;
  status: 'draft' | 'submitted';
}

export interface AnnotationGuidelineRule {
  scoreRange: string;
  meaning: string;
  criteria: string;
  example: string;
}
