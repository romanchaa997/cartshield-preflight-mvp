# Design — CartShield Preflight demo experience

## Experience overview
A single-page local workspace with three steps: (1) add a sanitized JSON configuration, (2) review its preflight report, and (3) optionally aggregate and compare up to 10 subjects in a temporary worksheet. A short hero explains the value and boundary; the workspace is followed by a compact inventory of supported checks and a privacy/safe-use footer.

Visual direction: restrained forest-green and warm-neutral palette, high-contrast headings, compact technical labels, clear severity chips, and responsive cards. No remote fonts, image assets, or UI dependencies. Inline SVG is limited to decorative, static interface icons.

## User flow
1. User pastes JSON, opens a local `.json` file, or selects a named synthetic fixture.
2. UI displays byte count and input status; the 256 KB client-side ceiling remains in force.
3. User presses **Analyze config** or Ctrl/Command+Enter.
4. Client parses JSON, rejects non-object roots, and invokes `CartShieldAnalyzer.analyzeConfig` in the current browser tab.
5. Report shows total findings, severity counts, environment/input context, explicit assessment caveat, all four coverage areas, and each finding's metadata, rationale, action, and citation.
6. User may copy the report JSON, download it locally, add it to the worksheet, or clear the editor/report.
7. User may also import several local JSON objects into the worksheet. Each file is independently size- and root-checked; invalid files are skipped with a local status message.
8. Worksheet compares up to 10 reports, reports per-subject severity/coverage, highlights recurring and subject-specific checks, and can be copied or downloaded as JSON or CSV. A subject can be removed without clearing the input or other subjects.

## Component and data flow
- `public/index.html`: semantic, accessible page structure and descriptions of scope, import, and worksheet limits.
- `public/styles.css`: responsive visual system, focus states, comparison tables, reduced-motion support, mobile layout.
- `public/app.js`: input handling, same-origin fixture fetch, local multi-file parsing, size and JSON validation, safe DOM rendering, report/worksheet exports, clearing, keyboard shortcut.
- `src/analyzer.js`: single shared browser/Node analysis implementation; analyzer rules remain unchanged.
- `src/worksheet.js`: pure aggregation of analyzer reports, severity totals, coverage, and rule occurrence by subject; usable from Node tests and browser through the local `/worksheet.js` static route.
- `server.js`: localhost static server only; serves public assets, analyzer and worksheet modules, and fixtures.
- `fixtures/*.json`: synthetic `.invalid` examples only.
- `config.schema.json`: supported sanitized input shape.

User input is parsed as JSON and rendered through `textContent`/text nodes. Evidence links are fixed analyzer metadata and open only after a user click. The worksheet retains report objects in tab memory and does not store the original configuration object. User data is not transmitted or automatically persisted. Loading a sample makes a same-origin request to the local fixture endpoint; analysis and worksheet aggregation require no request.

## Report and worksheet presentation
- Summary banners and aggregate counts are signal counts, not safety scores.
- Severity, qualitative environment-based priority, and medium declaration-based confidence remain distinct labels.
- A report always displays the analyzer caveat and coverage, including when findings are zero.
- “Provided” means the section was present, not that all individual properties were populated or verified. The copy says checks are applied where applicable; individual checks remain narrow.
- Worksheet tables show subjects, environment, finding totals by severity, and coverage proportions. An aggregated check identifies its occurrence count and the subject labels where it appeared.
- Empty or partial comparison remains explicit; missing coverage is not treated as a pass. No cross-subject ranking or security score is calculated.
- JSON exports contain aggregation and report objects, not original configuration files. CSV exports represent one row per subject and one column per aggregated check; values are quoted and formula-like cells are prefixed defensively.
- Copy and download create temporary browser data and do not persist worksheet content in the app.

## Security and privacy constraints
- Keep the editor and each imported file capped at 256 KiB; cap a worksheet at 10 subjects.
- No live-target URLs, active tests, remote APIs, upload endpoint, telemetry, or third-party runtime libraries.
- Retain server's localhost bind, GET/HEAD allowlist, CSP and response security headers.
- Never use `innerHTML` with input, subject labels, report values, or aggregation values.
- The warning about secrets and synthetic/sanitized data remains visible before analysis.
- Worksheet is in-memory only, and its exports are user-initiated. Do not add automatic storage or transmission.

## Validation plan
- Run `npm test` for analyzer, aggregation, and static UI contract checks.
- Start the server and verify the UI plus `/analyzer.js`, `/worksheet.js`, and synthetic fixture route are served successfully with restrictive headers.
- Inspect mobile layout and test the needs-review, baseline, malformed JSON, non-object root, over-limit, import limit, per-subject removal, CSV formula escaping, copy/download, and clear paths where browser tooling is available.
- Confirm the archive contains source/specification assets only and no credentials, dependencies, or generated environment state.
