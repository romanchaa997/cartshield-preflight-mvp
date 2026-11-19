'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { analyzeConfig } = require('../src/analyzer');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8'));
}

test('risky synthetic fixture returns sourced findings with separate severity, priority, and confidence', () => {
  const report = analyzeConfig(fixture('risky-store.json'));
  const ids = report.findings.map((finding) => finding.id);
  assert.ok(ids.includes('WH-001'));
  assert.ok(ids.includes('COOKIE-001'));
  assert.ok(ids.includes('CORS-001'));
  assert.ok(ids.includes('API-002'));
  const high = report.findings.find((finding) => finding.id === 'WH-001');
  assert.equal(high.severity, 'High');
  assert.equal(high.riskPriority, 'Immediate review');
  assert.match(high.confidence, /not runtime-verified/);
  assert.match(high.evidence.url, /^https:\/\//);
  assert.equal(report.synthetic, true);
  assert.match(report.assessmentNote, /No live site was contacted/);
});

test('hardened synthetic fixture has no configured findings but is not called safe', () => {
  const report = analyzeConfig(fixture('hardened-store.json'));
  assert.equal(report.summary.totalFindings, 0);
  assert.equal(report.findings.length, 0);
  assert.match(report.assessmentNote, /not independently verified/);
  assert.ok(report.coverage.every((item) => item.status.startsWith('Provided')));
});

test('wildcard CORS without credentials is a low-priority review, not credentialed exposure', () => {
  const report = analyzeConfig({ api: { cors: { allowOrigins: ['*'], allowCredentials: false } } });
  const finding = report.findings.find((item) => item.id === 'CORS-002');
  assert.ok(finding);
  assert.equal(finding.severity, 'Low');
  assert.equal(finding.evidence.sourceTitle, 'MDN: Cross-Origin Resource Sharing (CORS)');
  assert.equal(report.findings.some((item) => item.id === 'CORS-001'), false);
});

test('missing sections are explicitly not assessed', () => {
  const report = analyzeConfig({ meta: { environment: 'staging' } });
  assert.equal(report.findings.length, 0);
  assert.ok(report.coverage.every((item) => item.status.includes('Not provided')));
});

test('invalid root values are rejected', () => {
  assert.throws(() => analyzeConfig(null), /JSON object/);
  assert.throws(() => analyzeConfig([]), /JSON object/);
});
