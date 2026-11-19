'use strict';

const SEVERITY_ORDER = ['High', 'Moderate', 'Low', 'Informational'];
const MAX_SUBJECTS = 10;

function aggregateWorksheet(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Worksheet entries must be an array.');
  if (entries.length > MAX_SUBJECTS) throw new RangeError(`A worksheet can contain at most ${MAX_SUBJECTS} subjects.`);

  const severityTotals = Object.fromEntries(SEVERITY_ORDER.map((severity) => [severity, 0]));
  const findingGroups = new Map();
  const coverageGroups = new Map();
  const subjects = entries.map((entry, index) => {
    const report = entry?.report || entry;
    if (!report || typeof report !== 'object' || !Array.isArray(report.findings) || !Array.isArray(report.coverage)) {
      throw new TypeError(`Worksheet subject ${index + 1} does not contain a valid report.`);
    }
    const label = String(report.inputLabel || `Subject ${index + 1}`).slice(0, 120);
    const environment = String(report.environment || 'Unknown').slice(0, 40);
    const uniqueFindings = new Map();
    for (const finding of report.findings) {
      if (!finding || typeof finding.id !== 'string' || !SEVERITY_ORDER.includes(finding.severity)) continue;
      if (!uniqueFindings.has(finding.id)) uniqueFindings.set(finding.id, finding);
    }
    const severityCounts = Object.fromEntries(SEVERITY_ORDER.map((severity) => [severity, 0]));
    for (const finding of uniqueFindings.values()) {
      severityCounts[finding.severity] += 1;
      severityTotals[finding.severity] += 1;
      if (!findingGroups.has(finding.id)) {
        findingGroups.set(finding.id, { id: finding.id, title: String(finding.title || finding.id), severity: finding.severity, subjectLabels: [] });
      }
      findingGroups.get(finding.id).subjectLabels.push(label);
    }
    const providedAreas = [];
    const notAssessedAreas = [];
    for (const item of report.coverage) {
      if (!item || typeof item.area !== 'string') continue;
      const isProvided = String(item.status || '').startsWith('Provided');
      (isProvided ? providedAreas : notAssessedAreas).push(item.area);
      if (!coverageGroups.has(item.area)) coverageGroups.set(item.area, { area: item.area, providedSubjects: 0 });
      if (isProvided) coverageGroups.get(item.area).providedSubjects += 1;
    }
    return {
      id: String(entry?.id ?? index + 1),
      label,
      environment,
      findingTotal: uniqueFindings.size,
      severityCounts,
      providedAreas,
      notAssessedAreas,
      findingIds: [...uniqueFindings.keys()]
    };
  });

  const findings = [...findingGroups.values()].map((finding) => ({
    ...finding,
    subjectCount: finding.subjectLabels.length,
    subjectTotal: subjects.length,
    common: subjects.length > 0 && finding.subjectLabels.length === subjects.length
  })).sort((a, b) => b.subjectCount - a.subjectCount || SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || a.id.localeCompare(b.id));

  const coverage = [...coverageGroups.values()].map((item) => ({
    ...item,
    notAssessedSubjects: subjects.length - item.providedSubjects,
    subjectTotal: subjects.length
  }));

  return {
    product: 'CartShield Preflight',
    worksheetVersion: 1,
    subjectCount: subjects.length,
    totalFindings: subjects.reduce((total, subject) => total + subject.findingTotal, 0),
    uniqueChecksRaised: findings.length,
    commonFindingCount: findings.filter((finding) => finding.common).length,
    severityTotals,
    coverage,
    subjects,
    findings,
    note: 'Aggregated from static configuration assertions only. Results were not runtime-verified; differences are comparison signals, not proof of safety, exploitability, compromise, or compliance.'
  };
}

function spreadsheetSafe(value) {
  let text = String(value ?? '').replace(/[\r\n]+/g, ' ');
  if (/^[\t ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toComparisonCsv(entries) {
  const aggregate = aggregateWorksheet(entries);
  const headers = ['Subject', 'Environment', 'Total findings', 'High', 'Moderate', 'Low', 'Informational', 'Assessed areas', 'Not assessed areas', ...aggregate.findings.map((finding) => `${finding.id} — ${finding.title}`)];
  const rows = [headers];
  for (const subject of aggregate.subjects) {
    rows.push([
      subject.label,
      subject.environment,
      subject.findingTotal,
      subject.severityCounts.High,
      subject.severityCounts.Moderate,
      subject.severityCounts.Low,
      subject.severityCounts.Informational,
      subject.providedAreas.join('; '),
      subject.notAssessedAreas.join('; '),
      ...aggregate.findings.map((finding) => subject.findingIds.includes(finding.id) ? 'Yes' : 'No')
    ]);
  }
  return `${rows.map((row) => row.map(spreadsheetSafe).join(',')).join('\r\n')}\r\n`;
}

const worksheetApi = { aggregateWorksheet, toComparisonCsv, MAX_SUBJECTS, SEVERITY_ORDER };
if (typeof module !== 'undefined' && module.exports) module.exports = worksheetApi;
if (typeof window !== 'undefined') window.CartShieldWorksheet = worksheetApi;
