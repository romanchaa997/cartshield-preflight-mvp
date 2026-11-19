'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { analyzeConfig } = require('../src/analyzer');
const { aggregateWorksheet, toComparisonCsv, MAX_SUBJECTS } = require('../src/worksheet');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8'));
}

test('aggregates per-subject severity, recurring checks, and coverage without changing reports', () => {
  const risky = analyzeConfig(fixture('risky-store.json'));
  const cors = analyzeConfig(fixture('cors-demo.json'));
  const before = JSON.stringify([risky, cors]);
  const result = aggregateWorksheet([
    { id: 'one', report: risky },
    { id: 'two', report: cors }
  ]);
  assert.equal(result.subjectCount, 2);
  assert.equal(result.totalFindings, risky.summary.totalFindings + cors.summary.totalFindings);
  assert.equal(result.uniqueChecksRaised, new Set([...risky.findings, ...cors.findings].map((item) => item.id)).size);
  assert.ok(result.findings.find((finding) => finding.id === 'CORS-001').common);
  assert.equal(result.commonFindingCount, 1);
  assert.equal(result.subjects[0].findingTotal, risky.summary.totalFindings);
  assert.equal(result.coverage[0].providedSubjects, 2);
  assert.equal(result.subjects[0].providedAreas.length, 4);
  assert.equal(JSON.stringify([risky, cors]), before);
  assert.match(result.note, /not runtime-verified/);
});

test('hardened and risky subjects compare with distinct findings and coverage', () => {
  const result = aggregateWorksheet([
    { report: analyzeConfig(fixture('hardened-store.json')) },
    { report: analyzeConfig(fixture('risky-store.json')) }
  ]);
  assert.equal(result.subjects[0].findingTotal, 0);
  assert.equal(result.subjects[1].findingTotal, result.totalFindings);
  assert.equal(result.commonFindingCount, 0);
  assert.ok(result.findings.every((finding) => !finding.common));
  assert.deepEqual(result.severityTotals, {
    High: result.subjects[1].severityCounts.High,
    Moderate: result.subjects[1].severityCounts.Moderate,
    Low: result.subjects[1].severityCounts.Low,
    Informational: result.subjects[1].severityCounts.Informational
  });
});

test('rejects malformed worksheets and enforces a maximum of ten subjects', () => {
  assert.throws(() => aggregateWorksheet({}), /array/);
  assert.throws(() => aggregateWorksheet([{}]), /valid report/);
  assert.throws(() => aggregateWorksheet(Array.from({ length: MAX_SUBJECTS + 1 }, () => ({ report: { findings: [], coverage: [] } }))), /at most 10/);
});

test('CSV export escapes spreadsheet formulas and contains report data rather than raw configuration', () => {
  const sentinel = 'raw-config-only-sentinel';
  const report = analyzeConfig({
    meta: { label: '=HYPERLINK("https://example.invalid")', environment: '+SUM(1,1)', synthetic: true },
    privateFixtureValue: sentinel
  });
  const csv = toComparisonCsv([{ report }]);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.invalid""\)"/);
  assert.match(csv, /"'\+SUM\(1,1\)"/);
  assert.doesNotMatch(csv, new RegExp(sentinel));
  assert.match(csv, /\r\n/);
});
