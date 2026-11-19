'use strict';
const input = document.getElementById('config-input');
const analyzeButton = document.getElementById('analyze-button');
const addWorksheetButton = document.getElementById('add-worksheet-button');
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
const worksheetNode = document.getElementById('worksheet-content');
const worksheetStatus = document.getElementById('worksheet-status');
const worksheetFiles = document.getElementById('worksheet-files');
const clearWorksheetButton = document.getElementById('clear-worksheet-button');
const copyWorksheetButton = document.getElementById('copy-worksheet-button');
const exportWorksheetButton = document.getElementById('export-worksheet-button');
const exportWorksheetCsvButton = document.getElementById('export-worksheet-csv-button');
const MAX_BYTES = 256 * 1024;
const MAX_SUBJECTS = window.CartShieldWorksheet.MAX_SUBJECTS;
let latestReport = null;
let worksheet = [];
let nextWorksheetId = 1;

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
function setWorksheetStatus(text) { worksheetStatus.textContent = text; }
function updateSize() {
  const size = bytesOf(input.value);
  inputSize.textContent = `${size.toLocaleString()} bytes`;
  analyzeButton.disabled = size === 0 || size > MAX_BYTES;
  if (size > MAX_BYTES) setMessage('Input exceeds the 256 KB limit.', true);
  else if (!input.value.trim()) setMessage('Ready for a synthetic example or sanitized configuration.');
  else setMessage('Input is local. Review for secrets before analysis.');
}
function updateWorksheetControls() {
  addWorksheetButton.disabled = !latestReport || worksheet.length >= MAX_SUBJECTS;
  const hasSubjects = worksheet.length > 0;
  clearWorksheetButton.disabled = !hasSubjects;
  copyWorksheetButton.disabled = !hasSubjects;
  exportWorksheetButton.disabled = !hasSubjects;
  exportWorksheetCsvButton.disabled = !hasSubjects;
  worksheetFiles.disabled = worksheet.length >= MAX_SUBJECTS;
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
  updateWorksheetControls();
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
  updateWorksheetControls();

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

function appendCell(row, tag, text, className) {
  const cell = element(tag, className || '', text);
  row.append(cell);
  return cell;
}
function makeTable(headers, className) {
  const wrap = element('div', 'worksheet-table-wrap');
  const table = element('table', `worksheet-table ${className || ''}`);
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach((header) => appendCell(headerRow, 'th', header));
  thead.append(headerRow);
  table.append(thead);
  const tbody = document.createElement('tbody');
  table.append(tbody);
  wrap.append(table);
  return { wrap, tbody };
}
function renderWorksheet() {
  worksheetNode.replaceChildren();
  if (!worksheet.length) {
    worksheetNode.append(element('p', 'worksheet-empty', 'No subjects yet. Analyze a configuration and add it, or import several sanitized JSON files from your device.'));
    updateWorksheetControls();
    return;
  }
  const aggregate = window.CartShieldWorksheet.aggregateWorksheet(worksheet);
  const stats = element('div', 'worksheet-stats');
  stats.append(element('span', '', `${aggregate.subjectCount} / ${MAX_SUBJECTS} subjects`));
  stats.append(element('span', '', `${aggregate.totalFindings} total finding occurrences`));
  stats.append(element('span', '', `${aggregate.uniqueChecksRaised} distinct checks`));
  stats.append(element('span', '', `${aggregate.commonFindingCount} checks in every subject`));
  worksheetNode.append(stats);

  const severityRow = element('div', 'summary-row worksheet-severity');
  for (const [severity, count] of Object.entries(aggregate.severityTotals)) {
    if (count) severityRow.append(element('span', `summary-chip ${severity.toLowerCase()}`, `${severity}: ${count} across subjects`));
  }
  if (!aggregate.totalFindings) severityRow.append(element('span', 'summary-chip', 'No configured findings in the worksheet'));
  worksheetNode.append(severityRow);

  const subjectHeading = element('h3', 'worksheet-subheading', 'Subject comparison');
  worksheetNode.append(subjectHeading);
  const subjectsTable = makeTable(['Subject', 'Environment', 'Findings', 'High', 'Moderate', 'Low', 'Informational', 'Coverage', 'Action'], 'subject-table');
  for (const subject of aggregate.subjects) {
    const row = document.createElement('tr');
    appendCell(row, 'th', subject.label, 'subject-name');
    appendCell(row, 'td', subject.environment);
    appendCell(row, 'td', subject.findingTotal);
    for (const severity of window.CartShieldWorksheet.SEVERITY_ORDER) appendCell(row, 'td', subject.severityCounts[severity]);
    appendCell(row, 'td', `${subject.providedAreas.length} / ${subject.providedAreas.length + subject.notAssessedAreas.length} assessed`);
    const action = appendCell(row, 'td', '');
    const removeButton = element('button', 'remove-subject-button', 'Remove');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remove ${subject.label} from worksheet`);
    removeButton.addEventListener('click', () => {
      worksheet = worksheet.filter((entry) => entry.id !== subject.id);
      renderWorksheet();
      setWorksheetStatus(`${subject.label} removed. Worksheet remains only in this browser tab.`);
    });
    action.append(removeButton);
    subjectsTable.tbody.append(row);
  }
  worksheetNode.append(subjectsTable.wrap);

  const findingsHeading = element('h3', 'worksheet-subheading', 'Aggregated checks');
  worksheetNode.append(findingsHeading);
  if (!aggregate.findings.length) {
    worksheetNode.append(element('p', 'worksheet-empty compact', 'No configured checks were raised across the included subjects. Missing coverage is still not assessed.'));
  } else {
    const findingsTable = makeTable(['Check', 'Severity', 'Subjects affected', 'Comparison'], 'finding-aggregation-table');
    for (const finding of aggregate.findings) {
      const row = document.createElement('tr');
      appendCell(row, 'td', `${finding.id} · ${finding.title}`);
      appendCell(row, 'td', finding.severity);
      appendCell(row, 'td', `${finding.subjectCount} / ${finding.subjectTotal}`);
      appendCell(row, 'td', finding.common ? 'Present in every subject' : finding.subjectLabels.join(', '));
      findingsTable.tbody.append(row);
    }
    worksheetNode.append(findingsTable.wrap);
  }
  const note = element('p', 'worksheet-note', aggregate.note);
  worksheetNode.append(note);
  updateWorksheetControls();
}
function addReport(report) {
  if (worksheet.length >= MAX_SUBJECTS) return false;
  worksheet.push({ id: `subject-${nextWorksheetId++}`, report });
  renderWorksheet();
  return true;
}
addWorksheetButton.addEventListener('click', () => {
  if (!latestReport) return;
  if (!addReport(latestReport)) return setWorksheetStatus(`Worksheet limit reached (${MAX_SUBJECTS} subjects). Remove one before adding another.`);
  setWorksheetStatus(`Added “${latestReport.inputLabel}” to the in-memory worksheet. Nothing was saved or sent.`);
});
worksheetFiles.addEventListener('change', async () => {
  const files = Array.from(worksheetFiles.files || []);
  if (!files.length) return;
  const available = MAX_SUBJECTS - worksheet.length;
  const selected = files.slice(0, available);
  let added = 0;
  const skipped = [];
  for (const file of selected) {
    try {
      if (file.size > MAX_BYTES) throw new Error('over the 256 KB per-file limit');
      const config = JSON.parse(await file.text());
      if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('root JSON value must be an object');
      if (!config.meta || typeof config.meta !== 'object' || Array.isArray(config.meta)) config.meta = {};
      if (!String(config.meta.label || '').trim()) config.meta.label = file.name;
      const report = window.CartShieldAnalyzer.analyzeConfig(config);
      if (addReport(report)) added += 1;
    } catch (error) {
      skipped.push(`${file.name}: ${error.message}`);
    }
  }
  const notSelected = files.length - selected.length;
  const details = [...skipped, ...(notSelected ? [`${notSelected} file(s) not added because the ${MAX_SUBJECTS}-subject limit was reached`] : [])];
  setWorksheetStatus(`${added} file(s) added locally.${details.length ? ` Skipped: ${details.join('; ')}` : ''}`);
  worksheetFiles.value = '';
});
clearWorksheetButton.addEventListener('click', () => {
  worksheet = [];
  renderWorksheet();
  setWorksheetStatus('Worksheet cleared. It was held only in this browser tab.');
});
function worksheetPayload() {
  return {
    product: 'CartShield Preflight',
    generatedAt: new Date().toISOString(),
    aggregation: window.CartShieldWorksheet.aggregateWorksheet(worksheet),
    subjects: worksheet.map(({ id, report }) => ({ id, report }))
  };
}
function downloadText(text, type, filename) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
copyWorksheetButton.addEventListener('click', async () => {
  if (!worksheet.length) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(worksheetPayload(), null, 2));
    setWorksheetStatus('Worksheet JSON copied locally.');
  } catch {
    setWorksheetStatus('Clipboard access unavailable. Use a local worksheet download instead.');
  }
});
exportWorksheetButton.addEventListener('click', () => {
  if (!worksheet.length) return;
  downloadText(JSON.stringify(worksheetPayload(), null, 2), 'application/json', 'cartshield-preflight-worksheet.json');
  setWorksheetStatus('Worksheet JSON downloaded locally.');
});
exportWorksheetCsvButton.addEventListener('click', () => {
  if (!worksheet.length) return;
  downloadText(window.CartShieldWorksheet.toComparisonCsv(worksheet), 'text/csv;charset=utf-8', 'cartshield-preflight-comparison.csv');
  setWorksheetStatus('Comparison CSV downloaded locally. Spreadsheet text is escaped to reduce formula injection risk.');
});

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
  downloadText(JSON.stringify(latestReport, null, 2), 'application/json', 'cartshield-preflight-report.json');
  setMessage('Report downloaded locally as JSON.');
});
updateSize();
renderWorksheet();
setWorksheetStatus(`Worksheet is temporary to this tab. Add up to ${MAX_SUBJECTS} subjects; nothing is saved automatically.`);
