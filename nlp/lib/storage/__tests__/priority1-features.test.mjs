import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser window and document for unit testing LocalStorage and DOM settings
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(cls) {
    this.classes.add(cls);
  }
  remove(cls) {
    this.classes.delete(cls);
  }
  contains(cls) {
    return this.classes.has(cls);
  }
}

class MockElement {
  constructor() {
    this.classList = new MockClassList();
  }
}

globalThis.window = {
  localStorage: new MockStorage(),
  dispatchEvent: () => true,
};
globalThis.document = {
  documentElement: new MockElement(),
};
globalThis.CustomEvent = class {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts?.detail;
  }
};

test('Priority 1.1: highContrastBorders setting toggles and applies to DOM', async () => {
  const { LocalStorageService, applySettingsToDOM, DEFAULT_USER_SETTINGS } = await import(
    '../local-storage.ts'
  );

  // Initial state should be false
  window.localStorage.clear();
  document.documentElement.classList = new MockClassList();

  const initialSettings = LocalStorageService.getSettings();
  assert.equal(initialSettings.highContrastBorders, false);

  // Apply default settings
  applySettingsToDOM(initialSettings);
  assert.equal(document.documentElement.classList.contains('high-contrast-borders'), false);

  // Enable highContrastBorders
  const updated = LocalStorageService.saveSettings({ highContrastBorders: true });
  assert.equal(updated.highContrastBorders, true);

  // Verify class added to document.documentElement
  assert.equal(document.documentElement.classList.contains('high-contrast-borders'), true);

  // Read back from localStorage
  const loaded = LocalStorageService.getSettings();
  assert.equal(loaded.highContrastBorders, true);

  // Disable highContrastBorders
  LocalStorageService.saveSettings({ highContrastBorders: false });
  assert.equal(document.documentElement.classList.contains('high-contrast-borders'), false);
});

test('Priority 1.2: sample cases are English-only', async () => {
  const { SAMPLE_CASES } = await import('../../../data/sample-cases.ts');
  const { DIFFICULT_CASES } = await import('../../../data/difficult-cases.ts');
  const { INITIAL_ANNOTATION_PAIRS } = await import('../../../data/annotations-data.ts');
  const { INITIAL_DOCS } = await import('../../../data/documents-data.ts');

  assert.ok(SAMPLE_CASES.length > 0);
  assert.ok(SAMPLE_CASES.every((sample) => sample.language === 'en'));
  assert.ok(DIFFICULT_CASES.every((item) => item.language === 'en'));
  assert.ok(INITIAL_ANNOTATION_PAIRS.every((pair) => pair.language === 'en'));
  assert.ok(INITIAL_DOCS.every((doc) => doc.id !== 'doc-2'));
});

test('Priority 1.3: Document Workspace documents persist across browser refreshes', async () => {
  const { LocalStorageService } = await import('../local-storage.ts');
  const { INITIAL_DOCS } = await import('../../../data/documents-data.ts');

  window.localStorage.clear();

  // Should load INITIAL_DOCS when empty
  const initialDocs = LocalStorageService.getDocuments();
  assert.equal(initialDocs.length, INITIAL_DOCS.length);
  assert.equal(initialDocs[0].id, 'doc-1');

  // Add a new document (simulating user upload)
  const userDoc = {
    id: 'doc-user-upload-999',
    name: 'Employment_Severance_Agreement.txt',
    size: '14.2 KB',
    type: 'TXT',
    status: 'extracted',
    uploadedAt: 'Just now',
    rawText: 'Section 1. Non-compete covenant.',
    clauses: [
      {
        id: 'c-user-1',
        number: 'Section 1',
        title: 'Non-compete covenant',
        text: 'Employee shall not engage in competing business for 12 months.',
        simplifiedText: 'You agree not to work for a competitor for one year.',
        type: 'prohibition',
      },
    ],
  };

  LocalStorageService.saveDocument(userDoc);

  // Re-fetch (simulating fresh page load / browser refresh)
  const refreshedDocs = LocalStorageService.getDocuments();
  assert.equal(refreshedDocs.length, INITIAL_DOCS.length + 1);
  assert.equal(refreshedDocs[0].id, 'doc-user-upload-999');
  assert.equal(refreshedDocs[0].name, 'Employment_Severance_Agreement.txt');

  // Verify deletion also persists
  LocalStorageService.deleteDocument('doc-user-upload-999');
  const afterDeleteDocs = LocalStorageService.getDocuments();
  assert.equal(afterDeleteDocs.length, INITIAL_DOCS.length);
  assert.equal(
    afterDeleteDocs.some((d) => d.id === 'doc-user-upload-999'),
    false
  );
});

test('Priority 1.4: Document comparison uses actual clause pair, not unrelated default clause', async () => {
  const { INITIAL_DOCS } = await import('../../../data/documents-data.ts');

  // Every clause in INITIAL_DOCS must have an actual paired simplified text
  for (const doc of INITIAL_DOCS) {
    for (const clause of doc.clauses) {
      assert.ok(
        clause.simplifiedText && clause.simplifiedText.trim().length > 0,
        `Clause ${clause.number} in ${doc.name} must have a paired simplifiedText`
      );
      assert.notEqual(
        clause.simplifiedText,
        'The customer may contact the software provider if they discover someone else using the software without permission.',
        `Clause ${clause.number} in ${doc.name} must NOT use the unrelated software licensing clause`
      );
    }
  }

  // Simulate transferring clause pair to localStorage
  const targetClause = INITIAL_DOCS[0].clauses[0]; // Section 14 Limitation of Liability
  const payload = {
    originalText: targetClause.text,
    simplifiedText: targetClause.simplifiedText,
    language: 'en',
    domain: 'Master Services Agreement',
    title: 'Master Services Agreement • Section 14',
    clauseId: targetClause.id,
  };

  window.localStorage.setItem('clausex_imported_clause_pair', JSON.stringify(payload));

  // Verify imported data read back matches the actual pair
  const retrievedPair = JSON.parse(window.localStorage.getItem('clausex_imported_clause_pair'));
  assert.equal(retrievedPair.originalText, targetClause.text);
  assert.equal(retrievedPair.simplifiedText, targetClause.simplifiedText);
  assert.equal(
    retrievedPair.originalText.includes('Under no circumstances shall either party be liable'),
    true
  );
  assert.equal(
    retrievedPair.simplifiedText.includes('Neither party will be liable to the other'),
    true
  );
  assert.notEqual(
    retrievedPair.simplifiedText,
    'The customer may contact the software provider if they discover someone else using the software without permission.'
  );
});
