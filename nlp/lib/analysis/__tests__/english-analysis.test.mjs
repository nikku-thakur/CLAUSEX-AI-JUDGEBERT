import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEnglishAnalysisPayload,
  getEnglishOriginalText,
  getEnglishSimplifiedText,
  hasEnglishAnalysisInputs,
} from '../english-analysis.ts';
import { apiClient } from '../api-client.ts';

test('uses only the English draft for analysis across every output language', () => {
  const originalText = 'The Tenant shall pay rent by the fifth day.';
  const englishDraft = 'The Tenant must pay rent by the fifth day.';
  const translatedVisibleText = '[translated output sentinel; must never be sent]';

  for (const language of ['en', 'hi', 'ja', 'es']) {
    const visible = language === 'en' ? englishDraft : translatedVisibleText;
    const selectedText = getEnglishSimplifiedText(language, visible, englishDraft);
    const payload = buildEnglishAnalysisPayload(originalText, selectedText, 'Commercial', 'India');

    assert.equal(payload.originalText, originalText, `${language}: original remains English`);
    assert.equal(payload.simplifiedText, englishDraft, `${language}: analysis uses English draft`);
    assert.equal('targetLanguage' in payload, false, `${language}: no translated text is included`);
  }
});

test('keeps the entered original language while selecting its English analysis source', () => {
  const enteredOriginals = {
    en: 'The Tenant shall pay rent.',
    hi: 'किरायेदार किराया देगा।',
    ja: '借主は賃料を支払うものとする。',
    es: 'El inquilino pagará el alquiler.',
  };
  const englishOriginal = 'The tenant must pay rent.';

  for (const language of ['en', 'hi', 'ja', 'es']) {
    assert.equal(
      getEnglishOriginalText(language, enteredOriginals[language], englishOriginal),
      language === 'en' ? enteredOriginals.en : englishOriginal,
      `${language}: analysis source is English while entered text remains available separately`,
    );
  }
});

test('backend analysis request contains only English for all four output selections', async () => {
  const originalFetch = globalThis.fetch;
  const originalText = 'The Tenant shall pay rent by the fifth day.';
  const englishDraft = 'The Tenant must pay rent by the fifth day.';
  const translatedSentinel = '[translated output sentinel; must never be sent]';

  try {
    for (const language of ['en', 'hi', 'ja', 'es']) {
      let requestUrl = '';
      let requestBody = {};
      globalThis.fetch = async (url, options) => {
        requestUrl = String(url);
        requestBody = JSON.parse(options.body);
        return { ok: true, json: async () => ({ id: `analysis-${language}` }) };
      };

      const selectedVisibleText = language === 'en' ? englishDraft : translatedSentinel;
      const englishText = getEnglishSimplifiedText(language, selectedVisibleText, englishDraft);
      const payload = buildEnglishAnalysisPayload(originalText, englishText);
      await apiClient.analyzeEnglishWithBackend(payload);

      assert.match(requestUrl, /\/analyze$/);
      assert.deepEqual(requestBody, {
        originalText,
        simplifiedText: englishDraft,
        language: 'en',
      });
      assert.equal(JSON.stringify(requestBody).includes(translatedSentinel), false);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('multilingual backend route receives the native Hindi or Spanish pair unchanged', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [language, originalText, simplifiedText] of [
      ['hi', 'किरायेदार किराया देगा।', 'किरायेदार को किराया देना होगा।'],
      ['es', 'El inquilino pagará el alquiler.', 'El inquilino debe pagar el alquiler.'],
    ]) {
      let requestBody = {};
      globalThis.fetch = async (_url, options) => {
        requestBody = JSON.parse(options.body);
        return { ok: true, json: async () => ({ id: `analysis-${language}` }) };
      };
      await apiClient.analyzeMultilingualWithBackend({
        originalText, simplifiedText, language, domain: 'Commercial',
      });
      assert.deepEqual(requestBody, { originalText, simplifiedText, language, domain: 'Commercial' });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reports analysis inputs missing when the English draft is empty', () => {
  assert.equal(hasEnglishAnalysisInputs('Original clause', ''), false);
  assert.equal(hasEnglishAnalysisInputs(' ', 'English draft'), false);
  assert.equal(hasEnglishAnalysisInputs('Original clause', 'English draft'), true);
});
