import { Language } from './analysis';

export type BaselineModel =
  | 'cosine_similarity'
  | 'bertscore'
  | 'judgebert_multilingual_regression';

export type DatasetSplit = 'all' | 'train' | 'dev' | 'test' | 'zero_shot_domain';

export interface EvaluationMetricResult {
  modelId: BaselineModel;
  modelName: string;
  isBaseline: boolean;
  language: Language | 'overall';
  pearsonR: number;
  spearmanRho: number;
  mae: number;
  rmse: number;
  status: 'completed' | 'awaiting_backend' | 'illustrative_demo';
  evaluatedPairsCount: number;
}

export interface ResearchExperimentConfig {
  id: string;
  name: string;
  targetLanguage: Language | 'bilingual';
  selectedModel: BaselineModel;
  split: DatasetSplit;
  contextAware: boolean;
  evaluationDate: string;
  isMockData: boolean;
}

export interface ErrorDistributionPoint {
  errorBin: string; // e.g. "-2.0 to -1.5", "-0.5 to 0.0"
  cosineCount: number;
  bertScoreCount: number;
  judgebertCount: number;
}
