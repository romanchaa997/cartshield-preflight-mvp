# Product steering — CartShield Preflight

## Product purpose
CartShield Preflight is a local-first, explainable preflight review of sanitized or synthetic e-commerce configuration data. The demo helps a developer or store operator notice a small set of configuration signals before release and understand what each signal does—and does not—mean.

## Audience and experience
- Primary users: e-commerce developers, technical operators, and reviewers comfortable supplying structured JSON.
- Keep the experience calm, direct, and usable on desktop and mobile.
- Explain each matched check in plain language with severity, qualitative priority, declaration-based confidence, a suggested next step, and a relevant source.
- Make partial coverage visible. Missing inputs are “not assessed”; a zero-finding report is never a security verdict.

## Non-negotiable scope
- Analyze only JSON explicitly supplied in the browser tab and synthetic fixtures served by the local static demo server.
- Do not probe, fetch, crawl, authenticate to, or otherwise contact a merchant's live store or third-party target.
- Do not add upload APIs, remote analysis, telemetry, accounts, persistence, automatic collection, or secret handling in this demo.
- Do not request or encourage passwords, API keys, webhook secrets, session tokens, customer/payment data, or private URLs. Sample domains use `.invalid`.
- Keep the server bound to localhost by default, static-only, and limited to GET/HEAD requests. Keep the 256 KB input ceiling.

## Trust, privacy, and safety
- All user-provided values are untrusted input. Render them as text nodes / `textContent`, never as HTML.
- New UI code must not send the input off-device. Local fixture loading is the sole application fetch and is same-origin.
- Maintain the existing restrictive response headers and keep third-party source links user-initiated.
- Findings are declaration-based and not runtime-verified. No finding proves exploitability, compromise, or compliance.
- Any future proposal to add active testing, server-side processing, uploads, storage, telemetry, or integrations requires an explicit scope, authorization, privacy, and threat-model redesign before implementation.

## Current demo capabilities
- Paste sanitized JSON, open a local JSON file, or load a synthetic fixture.
- Analyze in the browser; view findings, source links, qualitative priority, confidence, and input coverage.
- Copy or locally download the JSON report; clear the workspace; use Ctrl/Command+Enter to run the review.
- Responsive accessible interface; no third-party runtime packages.
