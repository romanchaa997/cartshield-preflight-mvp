# CartShield Preflight — MVP review checklist

This checklist is for reviewing the scaffold itself before extending or deploying it. It does not assert that the user's store has been tested.

## Current boundary

- [x] Uses synthetic fixtures and sanitized JSON input.
- [x] No outbound requests from the analyzer; no live-store probing.
- [x] Analysis runs in the browser tab; local server only serves static assets and fixtures.
- [x] Local server binds to `127.0.0.1` by default and accepts only GET/HEAD.
- [x] Input capped at 256 KB; report rendering uses `textContent` / text nodes.
- [x] Static server sends restrictive CSP, `nosniff`, `no-store`, no-referrer, and anti-framing headers.
- [x] Findings separate severity, environment-adjusted qualitative priority, and declaration-based confidence.
- [x] Missing sections are marked not assessed; no-finding result is not described as certification.

## Before broader distribution

- [ ] Keep browser and Node analyzer rule implementations in sync; consider a shared build step to avoid duplication drift.
- [ ] Add schema validation and field-level applicability states so partial objects cannot be misread as evaluated.
- [ ] Review every rule against source updates and platform-specific behavior; record review date and reviewer.
- [ ] Add unit/property tests for malformed types, empty arrays, contradictory values, and user-supplied markup.
- [ ] Test supported browsers and local clipboard behavior; ensure no external network calls beyond opened source links and user-triggered navigation.
- [ ] Consider a signed rule pack or documented versioning if findings must be reproducible across releases.
- [ ] Define privacy and retention controls before adding persistence, accounts, uploads, telemetry, or remote analysis.
- [ ] Require explicit authorization, bounded assets, safe methods, a time window, stop conditions, and operational approval before any future active validation. Default to passive configuration review.
