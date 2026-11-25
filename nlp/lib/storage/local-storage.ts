import { AnalysisResult } from '@/types/analysis';
import { HumanAnnotationRecord } from '@/types/annotations';
import { DocumentItem } from '@/types/documents';
import { INITIAL_ANNOTATION_PAIRS } from '@/data/annotations-data';
import { INITIAL_DOCS } from '@/data/documents-data';
import { SAMPLE_CASES } from '@/data/sample-cases';
import { analyzeLegalClause } from '@/lib/analysis/analyzer-engine';

const STORAGE_KEYS = {
  ANALYSIS_HISTORY: 'clausex_analysis_history',
  ANNOTATIONS: 'clausex_human_annotations',
  USER_SETTINGS: 'clausex_user_settings',
  SAVED_CASES: 'clausex_saved_cases',
  WORKSPACE_DOCUMENTS: 'clausex_workspace_documents',
  IMPORTED_CLAUSE_PAIR: 'clausex_imported_clause_pair',
  IMPORTED_CLAUSE_LEGACY: 'clausex_imported_clause',
} as const;

export interface UserSettings {
  theme: 'obsidian-gold';
  reducedMotion: boolean;
  defaultAnalysisLayout: 'side-by-side' | 'stacked';
  highContrastBorders: boolean;
  autoSaveHistory: boolean;
  exportFormat: 'json' | 'markdown' | 'print';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'obsidian-gold',
  reducedMotion: false,
  defaultAnalysisLayout: 'side-by-side',
  highContrastBorders: false,
  autoSaveHistory: true,
  exportFormat: 'print',
};

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

// Applies active UI settings (highContrastBorders, reducedMotion) to the root document element
export function applySettingsToDOM(settings?: UserSettings): void {
  if (typeof window === 'undefined') return;
  const currentSettings = settings || LocalStorageService.getSettings();
  const root = document.documentElement;

  if (currentSettings.highContrastBorders) {
    root.classList.add('high-contrast-borders');
  } else {
    root.classList.remove('high-contrast-borders');
  }

  if (currentSettings.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
}

// Seed initial history from sample cases if user has no history yet
function generateInitialHistory(): AnalysisResult[] {
  const seedCases = [SAMPLE_CASES[0], SAMPLE_CASES[1], SAMPLE_CASES[4], SAMPLE_CASES[8]];
  return seedCases.map((sc, index) => {
    const res = analyzeLegalClause(
      sc.originalText,
      sc.simplifiedText,
      sc.language,
      sc.domain,
      'Common Law',
      sc.legalContext
    );
    // slightly stagger dates
    const date = new Date(Date.now() - (index + 1) * 3600 * 1000 * 24);
    res.id = `history-seed-${index + 1}`;
    res.timestamp = date.toISOString();
    return res;
  });
}

export const LocalStorageService = {
  // History
  getHistory(): AnalysisResult[] {
    const history = safeGetItem<AnalysisResult[]>(STORAGE_KEYS.ANALYSIS_HISTORY, []).filter(
      (item) => item.language === 'en'
    );
    if (history.length === 0) {
      const seeded = generateInitialHistory();
      safeSetItem(STORAGE_KEYS.ANALYSIS_HISTORY, seeded);
      return seeded;
    }
    return history;
  },

  saveAnalysis(analysis: AnalysisResult): void {
    const history = this.getHistory();
    const existingIndex = history.findIndex((h) => h.id === analysis.id);
    if (existingIndex >= 0) {
      history[existingIndex] = analysis;
    } else {
      history.unshift(analysis);
    }
    // Limit to 50 items
    safeSetItem(STORAGE_KEYS.ANALYSIS_HISTORY, history.slice(0, 50));
  },

  deleteAnalysis(id: string): void {
    const history = this.getHistory().filter((h) => h.id !== id);
    safeSetItem(STORAGE_KEYS.ANALYSIS_HISTORY, history);
  },

  clearHistory(): void {
    safeSetItem(STORAGE_KEYS.ANALYSIS_HISTORY, []);
  },

  // Annotations
  getAnnotations(): HumanAnnotationRecord[] {
    const annotations = safeGetItem<HumanAnnotationRecord[]>(STORAGE_KEYS.ANNOTATIONS, []).filter(
      (pair) => pair.language === 'en'
    );
    if (annotations.length === 0) {
      safeSetItem(STORAGE_KEYS.ANNOTATIONS, INITIAL_ANNOTATION_PAIRS);
      return INITIAL_ANNOTATION_PAIRS;
    }
    return annotations;
  },

  saveAnnotation(annotation: HumanAnnotationRecord): void {
    const list = this.getAnnotations();
    const index = list.findIndex((a) => a.pairId === annotation.pairId);
    if (index >= 0) {
      list[index] = { ...annotation, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...annotation, updatedAt: new Date().toISOString() });
    }
    safeSetItem(STORAGE_KEYS.ANNOTATIONS, list);
  },

  // Workspace Documents Persistence
  getDocuments(): DocumentItem[] {
    const docs = safeGetItem<DocumentItem[]>(STORAGE_KEYS.WORKSPACE_DOCUMENTS, []).filter(
      (doc) => doc.id !== 'doc-2'
    );
    if (docs.length === 0) {
      safeSetItem(STORAGE_KEYS.WORKSPACE_DOCUMENTS, INITIAL_DOCS);
      return INITIAL_DOCS;
    }
    return docs;
  },

  saveDocuments(docs: DocumentItem[]): void {
    safeSetItem(STORAGE_KEYS.WORKSPACE_DOCUMENTS, docs);
  },

  saveDocument(doc: DocumentItem): void {
    const docs = this.getDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    this.saveDocuments(docs);
  },

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    this.saveDocuments(docs);
  },

  // Settings
  getSettings(): UserSettings {
    return safeGetItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS, DEFAULT_USER_SETTINGS);
  },

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    safeSetItem(STORAGE_KEYS.USER_SETTINGS, updated);
    applySettingsToDOM(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clausex_settings_updated', { detail: updated }));
    }

    return updated;
  },

  resetAll(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
      window.localStorage.removeItem(STORAGE_KEYS.ANNOTATIONS);
      window.localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
      window.localStorage.removeItem(STORAGE_KEYS.SAVED_CASES);
      window.localStorage.removeItem(STORAGE_KEYS.WORKSPACE_DOCUMENTS);
      window.localStorage.removeItem(STORAGE_KEYS.IMPORTED_CLAUSE_PAIR);
      window.localStorage.removeItem(STORAGE_KEYS.IMPORTED_CLAUSE_LEGACY);
      applySettingsToDOM(DEFAULT_USER_SETTINGS);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  },
};

