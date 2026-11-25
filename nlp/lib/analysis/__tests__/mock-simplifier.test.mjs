import test from 'node:test';
import assert from 'node:assert/strict';

test('mock simplifier rewrites legal phrasing while keeping material details', async () => {
  const { simplifyClauseMock } = await import('../mock-simplifier.ts');
  const clause = 'The Supplier shall not disclose records to Acme Ltd. before 30 June 2027, unless Acme Ltd. gives prior written consent, and shall pay $25,000.';
  const simplified = simplifyClauseMock(clause, 0);

  assert.match(simplified, /must not disclose/);
  assert.match(simplified, /Acme Ltd\./);
  assert.match(simplified, /30 June 2027/);
  assert.match(simplified, /unless/);
  assert.match(simplified, /written permission in advance/);
  assert.match(simplified, /\$25,000/);
});

test('regeneration produces an alternate local mock wording', async () => {
  const { simplifyClauseMock } = await import('../mock-simplifier.ts');
  const clause = 'The Supplier shall deliver the records.';
  assert.equal(simplifyClauseMock(clause, 0), 'The Supplier must deliver the records.');
  assert.equal(simplifyClauseMock(clause, 1), 'The Supplier is required to deliver the records.');
});
