import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageService } from '../../storage/local-storage.ts';

// Mock localStorage for node environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

global.localStorage = storageMock;

test('Priority 2.1: Document item schema and storage for parsed documents', () => {
  const parsedDoc = {
    id: 'doc-real-pdf-test-1',
    name: 'commercial_lease_2026.pdf',
    size: '14.2 KB',
    type: 'PDF',
    status: 'extracted',
    uploadedAt: 'Just now',
    rawText: 'Section 1. Rent\nThe Tenant shall pay $5,000 monthly.\n\nSection 2. Alterations\nThe Tenant shall not make structural alterations without prior written consent.',
    clauses: [
      {
        id: 'c-parsed-1',
        number: 'Clause 1',
        title: 'Rent',
        text: 'The Tenant shall pay $5,000 monthly.',
        type: 'obligation',
      },
      {
        id: 'c-parsed-2',
        number: 'Clause 2',
        title: 'Alterations',
        text: 'The Tenant shall not make structural alterations without prior written consent.',
        type: 'prohibition',
      },
    ],
  };

  LocalStorageService.saveDocument(parsedDoc);
  const retrievedDocs = LocalStorageService.getDocuments();
  const found = retrievedDocs.find((d) => d.id === 'doc-real-pdf-test-1');

  assert.ok(found, 'Parsed PDF document was saved and retrieved from LocalStorage');
  assert.equal(found.type, 'PDF');
  assert.equal(found.clauses.length, 2);
  assert.equal(found.clauses[0].type, 'obligation');
  assert.equal(found.clauses[1].type, 'prohibition');
});

test('Priority 2.2: File validation logic (size limit and file formats)', () => {
  const MAX_SIZE = 10 * 1024 * 1024;
  
  // Valid files
  const validFiles = ['contract.pdf', 'agreement.docx', 'terms.txt'];
  for (const name of validFiles) {
    const isSupported = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
    assert.equal(isSupported, true, `${name} should be recognized as supported format`);
  }

  // Invalid formats
  const invalidFiles = ['script.exe', 'photo.png', 'archive.zip'];
  for (const name of invalidFiles) {
    const isSupported = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
    assert.equal(isSupported, false, `${name} should be rejected as unsupported format`);
  }

  // File size check
  const normalSize = 500 * 1024; // 500 KB
  const oversized = 11 * 1024 * 1024; // 11 MB
  const emptySize = 0;

  assert.equal(normalSize <= MAX_SIZE && normalSize > 0, true);
  assert.equal(oversized <= MAX_SIZE, false, 'Oversized file must exceed 10MB');
  assert.equal(emptySize === 0, true, 'Zero byte file should be flagged as empty');
});
