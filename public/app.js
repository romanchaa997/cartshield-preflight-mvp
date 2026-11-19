'use strict';

const input = document.getElementById('config-input');
const analyzeButton = document.getElementById('analyze-button');
const clearButton = document.getElementById('clear-button');
const inputMessage = document.getElementById('input-message');
const inputSize = document.getElementById('input-size');
const reportNode = document.getElementById('report');
const emptyState = document.getElementById('empty-state');
const resultsTitle = document.getElementById('results-title');
const copyButton = document.getElementById('copy-button');
const exportButton = document.getElementById('export-button');
const fixtureSelect = document.getElementById('fixture-select');
const fileInput = document.getElementById('file-input');
const MAX_BYTES = 256 * 1024;
let latestReport = null;

function bytesOf(text) { return new TextEncoder().encode(text).length; }
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text ?? '');
  return node;
}
function setMessage(text, isError = false) {
  inputMessage.textContent = text;
  inputMessage.classList.toggle('error', isError);
}
function updateSize() {
  const size = bytesOf(input.value);
  inputSize.textContent = `${size.toLocaleString()} bytes`;
  analyzeButton.disabled = size === 0 || size > MAX_BYTES;
  if (size > MAX_BYTES) setMessage('Input exceeds the 256 KB limit.', true);
  else if (!input.value.trim()) setMessage('Ready for a synthetic example or sanitized configuration.');
  else setMessage('Input is local. Review for secrets before analysis.');
}
function resetReport() {
  latestReport = null;
  reportNode.replaceChildren();
  reportNode.classList.add('hidden');
  emptyState.classList.remove('hidden');
  resultsTitle.textContent = 'Preflight report';
  copyButton.disabled = true;
  exportButton.disabled = true;
  copyButton.textContent = 'Copy JSON';
}
async function loadText(text, label) {
  if (bytesOf(text) > MAX_BYTES) throw new Error('File or input exceeds the 256 KB limit.');
  resetReport();
  input.value = text;
  updateSize();
  setMessage(`${label} loaded locally. Review for secrets before analysis.`);
}
fixtureSelect.addEventListener('change', async () => {
  if (!fixtureSelect.value) return;
  try {
    const response = await fetch(`/fixtures/${encodeURIComponent(fixtureSelect.value)}`);
    if (!response.ok) throw new Error('Could not load that local example.');
    await loadText(await response.text(), 'Synthetic example');
  } catch (error) {
    setMessage(error.message, true);
  }
});
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_BYTES) throw new Error('File exceeds the 256 KB limit.');
    await loadText(await file.text(), file.name);
  } catch (error) {
    setMessage(error.message, true);
  }
  fileInput.value = '';
});
input.addEventListener('input', () => {
  const reportWasVisible = latestReport !== null;
  if (reportWasVisible) resetReport();
  updateSize();
  if (reportWasVisible) setMessage('Configuration changed. Analyze it again to refresh the report.');
});

function renderCoverage(report) {
  const section = element('section', 'coverage');
  const heading = element('div', 'section-title-row');
  heading.append(element('h3', '', 'Assessment coverage'));
  heading.append(element('span', '', 'Only supplied sections are reviewed'));
  section.append(heading);
  const grid = element('div', 'coverage-grid');
  for (const item of report.coverage) {
    const provided = item.status.startsWith('Provided');
    const row = element('div', `coverage-item${provided ? ' provided' : ''}`);
    row.append(element('i', 'coverage-indicator'));
    const copy = element('div', 'coverage-copy');
    copy.append(element('strong', '', item.area));
    copy.append(element('span', '', provided ? 'Inputs provided · checks applied where applicable' : 'Not assessed · no input provided'));
    row.append(copy);
    grid.append(row);
  }
  section.append(grid);
  return section;
}
function renderFinding(finding) {
  const card = element('article', 'finding');
  const top = element('div', 'finding-top');
  top.append(element('span', `badge ${finding.severity.toLowerCase()}`, finding.severity));
  top.append(element('h4', '', finding.title));
  card.append(top);
  const meta = element('div', 'finding-meta');
  meta.append(element('span', '', finding.id));
  meta.append(element('span', '', `Priority: ${finding.riskPriority}`));
  meta.append(element('span', '', `Confidence: ${finding.confidence}`));
  card.append(meta);
  card.append(element('p', '', finding.rationale));
  const fix = element('p', 'fix');
  fix.append(element('strong', '', 'Suggested next step: '));
  fix.append(document.createTextNode(finding.suggestedFix));
  card.append(fix);
  const link = document.createElement('a');
  link.href = finding.evidence.url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = `Evidence: ${finding.evidence.sourceTitle} ↗`;
  card.append(link);
  return card;
}
function renderReport(report) {
  latestReport = report;
  reportNode.replaceChildren();
  emptyState.classList.add('hidden');
  reportNode.classList.remove('hidden');
  resultsTitle.textContent = report.inputLabel;
  copyButton.disabled = false;
  exportButton.disabled = false;

  const banner = element('div', 'report-banner');
  banner.append(element('span', 'report-banner-icon', report.summary.totalFindings ? '!' : '✓'));
  const bannerCopy = element('div', 'report-banner-copy');
  const heading = report.summary.totalFindings ? 'Review signals found' : 'No configured checks raised a finding';
  bannerCopy.append(element('p', 'report-banner-title', heading));
  bannerCopy.append(element('p', 'report-banner-subtitle', 'A configuration-only result. It does not verify live behavior.'));
  banner.append(bannerCopy);
  const count = element('div', 'report-count');
  count.append(element('strong', '', report.summary.totalFindings));
  count.append(document.createTextNode(report.summary.totalFindings === 1 ? 'finding' : 'findings'));
  banner.append(count);
  reportNode.append(banner);

  const context = element('div', 'report-context');
  context.append(element('span', '', `Environment: ${report.environment}`));
  context.append(element('span', 'context-chip', report.synthetic ? 'Synthetic input' : 'User-provided configuration'));
  reportNode.append(context);

  const chips = element('div', 'summary-row');
  for (const [severity, countValue] of Object.entries(report.summary.counts)) {
    if (countValue) chips.append(element('span', `summary-chip ${severity.toLowerCase()}`, `${severity}: ${countValue}`));
  }
  if (!report.summary.totalFindings) chips.append(element('span', 'summary-chip', 'No findings in assessed checks'));
  reportNode.append(chips);
  reportNode.append(element('p', 'assessment-note', report.assessmentNote));
  reportNode.append(renderCoverage(report));

  const findingsHeading = element('div', 'findings-heading');
  findingsHeading.append(element('h3', '', 'Matched checks'));
  findingsHeading.append(element('span', '', report.summary.totalFindings ? 'Sorted by severity' : 'Nothing to display'));
  reportNode.append(findingsHeading);
  if (!report.findings.length) {
    const note = element('div', 'clean-note');
    note.append(element('strong', '', 'A limited result, not a clean bill of health. '));
    note.append(document.createTextNode('Review the coverage above and confirm the supplied values against the effective configuration.'));
    reportNode.append(note);
  }
  for (const finding of report.findings) reportNode.append(renderFinding(finding));
}

analyzeButton.addEventListener('click', () => {
  try {
    if (bytesOf(input.value) > MAX_BYTES) throw new Error('Input exceeds the 256 KB limit.');
    const config = JSON.parse(input.value);
    if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Root JSON value must be an object.');
    const report = window.CartShieldAnalyzer.analyzeConfig(config);
    renderReport(report);
    setMessage('Analysis complete in this browser. No live store was contacted.');
  } catch (error) {
    setMessage(error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : error.message, true);
  }
});
input.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !analyzeButton.disabled) {
    event.preventDefault();
    analyzeButton.click();
  }
});
clearButton.addEventListener('click', () => {
  input.value = '';
  fixtureSelect.value = '';
  resetReport();
  updateSize();
  input.focus();
});
copyButton.addEventListener('click', async () => {
  if (!latestReport) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(latestReport, null, 2));
    copyButton.textContent = 'Copied';
    setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1500);
  } catch {
    setMessage('Clipboard access unavailable. You can still download the report JSON.', true);
  }
});
exportButton.addEventListener('click', () => {
  if (!latestReport) return;
  const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'cartshield-preflight-report.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setMessage('Report downloaded locally as JSON.');
});
updateSize();
