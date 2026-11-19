# Design — CartShield Preflight demo experience

## Experience overview
A single-page local workspace with a deliberate two-step hierarchy: (1) add a sanitized JSON configuration, then (2) review the preflight report. A short hero explains the value and boundary; the workspace is followed by a compact inventory of supported checks and a privacy/safe-use footer.

Visual direction: restrained forest-green and warm-neutral palette, high-contrast headings, compact technical labels, clear severity chips, and responsive cards. No remote fonts, image assets, or UI dependencies. Inline SVG is limited to decorative, static interface icons.

## User flow
1. User pastes JSON, opens a local `.json` file, or selects a named synthetic fixture.
2. UI displays byte count and input status; the 256 KB client-side ceiling remains in force.
3. User presses **Analyze config** or Ctrl/Command+Enter.
4. Client parses JSON, rejects non-object roots, and invokes `CartShieldAnalyzer.analyzeConfig` in the current browser tab.
5. Report shows total findings, severity counts, environment/input context, explicit assessment caveat, all four coverage areas, and each finding's metadata, rationale, action, and citation.
6. User may copy the report JSON, download it locally, or clear the editor/report.

## Component and data flow
- `public/index.html`: semantic, accessible page structure and descriptions of scope.
- `public/styles.css`: responsive visual system, focus states, reduced-motion support, mobile layout.
- `public/app.js`: input handling, same-origin fixture fetch, size and JSON validation, safe DOM rendering, report export/copy, clearing, keyboard shortcut.
- `src/analyzer.js`: single shared browser/Node analysis implementation; unchanged by the UI refresh.
- `server.js`: localhost static server only; serves public assets, the shared analyzer, and fixtures.
- `fixtures/*.json`: synthetic `.invalid` examples only.
- `config.schema.json`: supported sanitized input shape.

User input is parsed as JSON and rendered through `textContent`/text nodes. Evidence links are fixed analyzer metadata and open only after a user click. User data is not stored or transmitted. Loading a sample makes a same-origin request to the local fixture endpoint; the analysis itself requires no request.

## Report presentation
- Summary banner is a signal count, not a safety score.
- Severity, qualitative environment-based priority, and medium declaration-based confidence remain distinct labels.
- A report always displays the analyzer caveat and coverage, including when findings are zero.
- “Provided” means the section was present, not that all individual properties were populated or verified. The copy says checks are applied where applicable; individual checks remain narrow.
- Each finding includes the source link already associated with its rule.
- Copy and download export the analyzer's JSON report; export creates a temporary browser `Blob` and does not persist input in the app.

## Security and privacy constraints
- Keep `MAX_BYTES` at 256 KiB in the browser input path.
- No live-target URLs, active tests, remote APIs, upload endpoint, telemetry, or third-party runtime libraries.
- Retain server's localhost bind, GET/HEAD allowlist, CSP and response security headers.
- Never use `innerHTML` with input or report values.
- The warning about secrets and synthetic/sanitized data remains visible before analysis.

## Validation plan
- Run `npm test` for analyzer tests and static UI contract checks.
- Start the server and verify the UI plus `/analyzer.js` and the synthetic fixture route are served successfully.
- Inspect mobile layout and test the needs-review, baseline, malformed JSON, non-object root, over-limit, copy/download, and clear paths where browser tooling is available.
- Confirm the archive contains source/specification assets only and no credentials, dependencies, or generated environment state.
