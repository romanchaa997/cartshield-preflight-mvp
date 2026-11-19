# Requirements — CartShield Preflight demo experience

## Purpose
Deliver a finished, responsive demo interface and Kiro specification for the existing CartShield Preflight configuration-review scaffold. Preserve the product's local-only, sanitized-or-synthetic input boundary and existing analysis rules.

## Requirement 1 — Explain the review boundary
**User story:** As a demo user, I want to understand what CartShield checks and what it cannot establish before I provide data, so I can use the result responsibly.

### Acceptance criteria
1. The page SHALL state that analysis is a static configuration review and no live store is contacted.
2. The page SHALL identify the covered areas as API/CORS, webhooks, session cookies, and selected response headers.
3. The page SHALL state that findings are not proof of exploitability, compromise, certification, or compliance.
4. The page SHALL warn users not to enter credentials, tokens, customer data, payment data, or private URLs.
5. The page SHALL describe missing sections as not assessed and SHALL NOT imply that an empty result means safe.

## Requirement 2 — Supply only sanitized or synthetic configuration
**User story:** As a reviewer, I want to load a fabricated example, open a local JSON file, or paste sanitized JSON, so I can review configuration assertions without connecting a store.

### Acceptance criteria
1. The interface SHALL provide three synthetic examples: a needs-review configuration, baseline-controls configuration, and CORS edge case.
2. The interface SHALL support choosing a local JSON file and pasting/editing JSON in the browser.
3. The application SHALL reject input larger than 256 KB and SHALL require a JSON object at the root before analysis.
4. The application SHALL analyze the entered object with the existing shared analyzer and SHALL preserve the existing rules and source citations.
5. The application SHALL NOT issue requests to a merchant store, upload user input, or call a remote analysis service. The only application fetch SHALL be for a same-origin synthetic fixture.

## Requirement 3 — Explain findings and coverage
**User story:** As a reviewer, I want each matched signal and the review's limits presented clearly, so I can decide what to validate next.

### Acceptance criteria
1. Every finding SHALL show its identifier, severity, qualitative priority, declaration-based confidence, rationale, suggested next step, and evidence link.
2. Findings SHALL retain severity ordering and distinct priority/confidence labels.
3. The report SHALL show all coverage areas and distinguish provided input from not-assessed areas.
4. A zero-finding report SHALL include a plain-language warning that it is limited and not a clean bill of health.
5. Untrusted labels and text SHALL be rendered using text APIs, not interpreted as HTML.

## Requirement 4 — Make the demo usable and accessible
**User story:** As a demo user on a desktop or phone, I want a polished, keyboard-accessible workspace with clear controls and feedback, so I can complete a review without confusion.

### Acceptance criteria
1. The layout SHALL adapt to narrow screens without horizontal overflow at a 320 px viewport.
2. Every form control SHALL have an accessible name; status and result updates SHALL be announced politely to assistive technology.
3. Keyboard focus SHALL be visible, and Ctrl/Command+Enter SHALL run an enabled analysis.
4. The user SHALL be able to clear the editor and report, copy the report JSON, and download the report as a local JSON file.
5. The interface SHALL show input byte size, the 256 KB limit, parse/size errors, and local-processing feedback.

## Requirement 5 — Preserve a low-dependency local demo
**User story:** As a maintainer, I want the demo to remain easy to run and inspect, so its privacy boundary is auditable.

### Acceptance criteria
1. The project SHALL continue to run with Node.js built-ins and no third-party runtime packages.
2. The local server SHALL bind to `127.0.0.1` by default and only serve static files/fixtures through GET and HEAD.
3. The server SHALL retain restrictive security headers, including CSP, `nosniff`, anti-framing, no-referrer, and `no-store`.
4. Automated tests SHALL pass with `npm test`.
5. The `.kiro/` specification SHALL document product constraints, design decisions, and implementation tasks.


## Requirement 6 — Compare a bounded set of subjects locally
**User story:** As a reviewer, I want to aggregate reports from multiple sanitized configurations and compare their findings and coverage, so I can spot repeated and subject-specific review signals without treating the result as a security score.

### Acceptance criteria
1. The reviewer SHALL be able to add the current report or import multiple local JSON configuration files.
2. The worksheet SHALL accept no more than 10 subjects and no more than 256 KB per imported file, SHALL validate that each root is a JSON object, and SHALL explain skipped files.
3. The worksheet SHALL show per-subject finding counts by severity and supplied/not-assessed coverage, plus distinct and recurring findings across subjects.
4. The worksheet SHALL permit removal of an individual subject and clearing the worksheet independently from the editor.
5. Worksheet entries SHALL be held only in browser-tab memory unless the reviewer explicitly uses a local export; the app SHALL NOT upload, persist, or transmit the data.
6. JSON and CSV exports SHALL contain reports and comparison data, not the original configurations; CSV cells SHALL be escaped against common spreadsheet formula execution.
7. Comparison copy SHALL state that it is declaration-based, not runtime-verified, and is not a safety, compliance, or compromise verdict.
