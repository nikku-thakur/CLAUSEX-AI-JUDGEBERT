import { AnalysisResult, Language } from '@/types/analysis';
import { DocumentParseResponse } from '@/types/documents';
import { analyzeLegalClause } from './analyzer-engine';
import { EnglishAnalysisPayload } from './english-analysis';

export interface AnalyzePayload {
  originalText: string;
  simplifiedText: string;
  language: 'en' | 'hi' | 'es';
  domain?: string;
  jurisdiction?: string;
  legalContext?: string;
}

export interface SimplifyTranslatePayload {
  originalText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  domain?: string;
  jurisdiction?: string;
  legalContext?: string;
}

export interface SimplifyTranslateResponse {
  originalEnglish: string;
  simplifiedEnglish: string;
  translatedText: string;
  targetLanguage: Language;
  translationCompleted: boolean;
  translationError?: string | null;
  englishVerification: AnalysisResult;
  targetLanguageValidation: string;
  generationNotice: string;
}

export interface BackendStatus {
  connected: boolean;
  modelName: string;
  endpointUrl: string;
  latencyMs?: number;
  mode: 'demo_fallback' | 'production_backend';
  message: string;
}

class ClauseXApiClient {
  private baseUrl: string;
  private demoMode: boolean;
  private modelName: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    this.demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    this.modelName = process.env.NEXT_PUBLIC_MODEL_NAME || 'JUDGEBERT-Multilingual-v1-Backend';
  }

  public async getStatus(): Promise<BackendStatus> {
    const url = this.baseUrl || 'http://localhost:8000/api/v1';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return {
          connected: true,
          modelName: this.modelName,
          endpointUrl: url,
          mode: 'production_backend',
          message: 'Connected to JUDGEBERT FastAPI Inference Service.',
        };
      }
    } catch {
      // Unreachable
    }

    return {
      connected: false,
      modelName: this.modelName,
      endpointUrl: url,
      mode: 'demo_fallback',
      message: 'Backend server unreachable. Using transparent deterministic rule-based demo engine.',
    };
  }

  public async analyze(payload: AnalyzePayload): Promise<{
    result: AnalysisResult;
    source: 'backend_api' | 'demo_engine';
    isDemo: boolean;
  }> {
    const url = this.baseUrl || 'http://localhost:8000/api/v1';

    // If not explicitly forced into offline demo mode, attempt real backend first
    if (!this.demoMode) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${url}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data: AnalysisResult = await response.json();
          return {
            result: data,
            source: 'backend_api',
            isDemo: false,
          };
        }
      } catch (err) {
        console.warn('Backend inference failed or timed out. Falling back to local deterministic demo engine:', err);
      }
    }


    // Explicit deterministic demo fallback with simulation delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = analyzeLegalClause(
      payload.originalText,
      payload.simplifiedText,
      payload.language,
      payload.domain,
      payload.jurisdiction,
      payload.legalContext
    );

    return {
      result,
      source: 'demo_engine',
      isDemo: true,
    };
  }

  /** Calls the existing English backend analysis endpoint without demo fallback. */
  public async analyzeEnglishWithBackend(payload: EnglishAnalysisPayload): Promise<AnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, language: 'en' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let detail = `English analysis failed (HTTP ${response.status}).`;
        try {
          const errorData = await response.json();
          if (errorData.detail) detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } catch {
          // Keep the HTTP status message if the response is not JSON.
        }
        throw new Error(detail);
      }
      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('English analysis timed out. Please try again.');
      }
      throw err;
    }
  }

  /** Calls the direct Hindi/Spanish model route; never falls back to local English rules. */
  public async analyzeMultilingualWithBackend(payload: AnalyzePayload): Promise<AnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let detail = `Multilingual analysis failed (HTTP ${response.status}).`;
        try {
          const errorData = await response.json();
          if (errorData.detail) detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } catch { /* Keep HTTP status message. */ }
        throw new Error(detail);
      }
      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Multilingual analysis timed out. Please try again.');
      throw err;
    }
  }

  public async simplifyAndTranslate(payload: SimplifyTranslatePayload): Promise<SimplifyTranslateResponse> {
    const controller = new AbortController();
    // Local multilingual translation plus local English generation can take a
    // few minutes on CPU-only inference, especially on the first cold request.
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    try {
      const response = await fetch(`${this.baseUrl}/simplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let detail = `Simplification and translation failed (HTTP ${response.status}).`;
        try {
          const errorData = await response.json();
          if (errorData.detail) detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } catch {
          // Keep the HTTP status message if the response is not JSON.
        }
        throw new Error(detail);
      }
      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Simplification and translation timed out. Please try again.');
      }
      throw err;
    }
  }

  public async parseDocument(file: File): Promise<DocumentParseResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const baseUrl = this.baseUrl || 'http://localhost:8000/api/v1';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${baseUrl}/documents/parse`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `Document parsing failed with HTTP status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          }
        } catch {
          // Fallback to generic message
        }
        throw new Error(errorDetail);
      }

      const data: DocumentParseResponse = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Document parsing request timed out after 20 seconds.');
      }
      throw err;
    }
  }
}

export const apiClient = new ClauseXApiClient();
