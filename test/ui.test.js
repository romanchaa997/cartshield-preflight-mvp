'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('demo page exposes accessible local input, report, and worksheet controls', () => {
  const html = read('public/index.html');
  for (const id of ['config-input', 'input-message', 'input-size', 'fixture-select', 'file-input', 'clear-button', 'analyze-button', 'add-worksheet-button', 'copy-button', 'export-button', 'empty-state', 'report', 'worksheet-files', 'worksheet-status', 'worksheet-content', 'clear-worksheet-button', 'copy-worksheet-button', 'export-worksheet-button', 'export-worksheet-csv-button']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing UI control: ${id}`);
  }
  assert.match(html, /No store is contacted/);
  assert.match(html, /Never include secrets or customer data/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /256 KB/);
  assert.match(html, /Nothing is saved automatically/);
  assert.match(html, /multiple aria-describedby="worksheet-guidance"/);
});

test('UI analyzes locally, loads fixtures same-origin, and renders values without HTML injection', () => {
  const app = read('public/app.js');
  assert.equal((app.match(/\bfetch\s*\(/g) || []).length, 1);
  assert.match(app, /fetch\(`\/fixtures\/\$\{encodeURIComponent\(fixtureSelect\.value\)\}`\)/);
  assert.doesNotMatch(app, /\binnerHTML\b/);
  assert.match(app, /textContent/);
  assert.match(app, /createTextNode/);
  assert.match(app, /analyzeConfig\(config\)/);
  assert.match(app, /cartshield-preflight-report\.json/);
  assert.match(app, /cartshield-preflight-worksheet\.json/);
  assert.match(app, /cartshield-preflight-comparison\.csv/);
  assert.match(app, /worksheet\.length >= MAX_SUBJECTS/);
  assert.match(app, /256 KB per-file limit/);
  assert.match(read('src/worksheet.js'), /function toComparisonCsv/);
  assert.match(read('src/worksheet.js'), /spreadsheetSafe/);
  const html = read('public/index.html');
  assert.match(html, /src="\/worksheet\.js"/);
  assert.match(read('server.js'), /url\.pathname === '\/worksheet\.js'/);
});

test('browser scripts compile together in page load order without global lexical collisions', () => {
  const browserScripts = ['src/analyzer.js', 'src/worksheet.js', 'public/app.js'].map(read).join('\n;\n');
  assert.doesNotThrow(() => new vm.Script(browserScripts));
});

test('demo exposes four coverage areas and three synthetic fixture files', () => {
  const html = read('public/index.html');
  for (const label of ['API &amp; CORS', 'Webhooks', 'Session cookies', 'Response headers']) assert.match(html, new RegExp(label));
  const fixtures = ['risky-store.json', 'hardened-store.json', 'cors-demo.json'];
  for (const name of fixtures) {
    assert.ok(fs.existsSync(path.join(root, 'fixtures', name)), `missing fixture ${name}`);
    const data = JSON.parse(read(`fixtures/${name}`));
    assert.equal(data.meta.synthetic, true);
  }
});

test('Kiro steering and requirements, design, and task specs are present', () => {
  for (const file of [
    '.kiro/steering/product.md',
    '.kiro/specs/demo-experience/requirements.md',
    '.kiro/specs/demo-experience/design.md',
    '.kiro/specs/demo-experience/tasks.md'
  ]) assert.ok(fs.statSync(path.join(root, file)).size > 100, `missing or empty ${file}`);
  const steering = read('.kiro/steering/product.md');
  assert.match(steering, /Do not probe, fetch, crawl, authenticate to/);
  assert.match(steering, /256 KB/);
});
