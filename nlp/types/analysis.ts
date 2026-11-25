export type Language = 'en' | 'hi' | 'ja' | 'es';

export type PreservationStatus = 'preserved' | 'subtle_shift' | 'critical_alteration';

export type ChangeCategory =
  | 'obligation'
  | 'permission'
  | 'prohibition'
  | 'negation'
  | 'condition'
  | 'exception'
  | 'deadline'
  | 'monetary'
  | 'entity'
  | 'scope'
  | 'omitted_content'
  | 'added_content';

export type SeverityLevel = 'critical' | 'warning' | 'info';

export interface TextSpan {
  text: string;
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  category?: ChangeCategory;
  severity?: SeverityLevel;
  explanation?: string;
  charStart?: number;
  charEnd?: number;
}

export interface CriticalChange {
  id: string;
  category: ChangeCategory;
  severity: SeverityLevel;
  title: string;
  originalExcerpt: string;
  simplifiedExcerpt: string;
  explanation: string;
  legalSignificance: string;
  evidenceSource: 'textual_diff' | 'deontic_shift' | 'condition_removal' | 'entity_check' | 'negation_inversion';
}

export interface DeonticModalityBreakdown {
  originalObligations: string[];
  simplifiedObligations: string[];
  originalPermissions: string[];
  simplifiedPermissions: string[];
  originalProhibitions: string[];
  simplifiedProhibitions: string[];
  shifts: {
    from: string;
    to: string;
    impact: string;
    severity: SeverityLevel;
  }[];
}

export interface ConditionsExceptionsBreakdown {
  originalConditions: string[];
  simplifiedConditions: string[];
  originalExceptions: string[];
  simplifiedExceptions: string[];
  droppedConditions: string[];
  droppedExceptions: string[];
}

export interface EntitiesDatesAmountsBreakdown {
  originalDates: string[];
  simplifiedDates: string[];
  dateMismatches: string[];
  originalAmounts: string[];
  simplifiedAmounts: string[];
  amountMismatches: string[];
  originalEntities: string[];
  simplifiedEntities: string[];
  entityMismatches: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  language: Language;
  domain?: string;
  jurisdiction?: string;
  originalText: string;
  simplifiedText: string;
  legalContext?: string;
  lmpScore: number; // 1.0 to 10.0 scale
  preservationStatus: PreservationStatus;
  interpretation: string;
  humanReviewRecommended: boolean;
  humanReviewReason?: string;
  ruleExplanation: string;
  sourceEngine: 'deterministic_demo_engine' | 'judgebert_backend_service';
  criticalChanges: CriticalChange[];
  originalSpans: TextSpan[];
  simplifiedSpans: TextSpan[];
  deonticBreakdown: DeonticModalityBreakdown;
  conditionsBreakdown: ConditionsExceptionsBreakdown;
  entitiesBreakdown: EntitiesDatesAmountsBreakdown;
  summaryMetrics: {
    wordsOriginal: number;
    wordsSimplified: number;
    compressionRatio: number;
    criticalDifferencesCount: number;
    warningDifferencesCount: number;
    infoDifferencesCount: number;
  };
  modelAnalysis?: Record<string, any>;
}


export interface SampleCase {
  id: string;
  title: string;
  category: ChangeCategory;
  language: Language;
  domain: string;
  originalText: string;
  simplifiedText: string;
  legalContext?: string;
  expectedStatus: PreservationStatus;
  expectedIssue: string;
  whyItMatters: string;
}

export interface DifficultCase {
  id: string;
  scenarioNumber: number;
  title: string;
  category: ChangeCategory;
  language: Language;
  criticality: SeverityLevel;
  domain: string;
  originalText: string;
  simplifiedText: string;
  expectedIssue: string;
  whyItMatters: string;
  jurisprudentialImpact: string;
  humanReviewQuestion: string;
}
