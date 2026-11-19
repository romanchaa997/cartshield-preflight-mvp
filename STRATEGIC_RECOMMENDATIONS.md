# Strategic improvement recommendations

CartShield Preflight is a useful starting point for explainable configuration review. The next improvements should increase consistency, coverage, and decision usefulness without turning the product into an unbounded scanner or cloud data collector.

## Priority 1 — Make inputs and coverage more reliable

**Add explicit schema validation and field-level applicability.** The current JSON schema describes the intended shape, but the browser analyzer currently relies on the supplied values. Add a small, dependency-free validator (or a carefully reviewed validation dependency) that reports malformed types, unsupported enum values, and unknown fields separately from security findings. Distinguish “section supplied,” “field applicable,” “field missing,” and “invalid input.” Keep unknown or incomplete values as *not assessed*, never as a secure default.

**Version the input contract.** Add a schema version and migration guidance before the input shape expands. Preserve the existing supported fields, document compatibility rules, and test old examples so an updated UI does not silently reinterpret a saved configuration.

## Priority 2 — Improve the quality and reproducibility of rules

**Govern rule changes like product code.** For every rule, record its rationale, applicability, authoritative source, source review date, owner, and test cases. Add tests for boundary values, malformed shapes, false positives, exceptions, and contradictory declarations. Consider a visible ruleset version and include it in each report so worksheets from different releases are not compared as if they used identical checks.

**Keep severity, urgency, and evidence strength separate.** Continue to avoid a single “security score.” If contextual prioritization is expanded, expose assumptions (environment, business impact, exposure, compensating controls, and evidence quality) and show which inputs are missing. A review priority is a triage aid, not a claim of likelihood or compromise.

## Priority 3 — Evolve comparison into a decision worksheet

**Add explicit subject context and stable identifiers.** Let reviewers assign a safe subject label, environment, platform/profile, and optional baseline. Keep identifiers user-controlled and non-sensitive; warn against names that reveal merchant or customer information. Compare only like-for-like ruleset versions and display incomparable/missing fields rather than treating them as passes.

**Add structured, actionable differences.** A future worksheet could compare field-level declarations and show “changed,” “same,” “missing,” and “not applicable,” then link differences to applicable rule explanations. Keep aggregate counts descriptive; do not rank merchants or present a compliance verdict. Include unit tests for duplicate labels, partial coverage, and mixed input quality.

**Support controlled review packs.** After schema versioning, consider exporting a portable bundle of sanitized inputs, reports, rule version, and explicit provenance. Make it opt-in, let the reviewer inspect what will be included, and keep the current no-save-by-default behavior unless a separate retention design is approved.

## Priority 4 — Expand coverage in a bounded way

**Add platform profiles through documented adapters.** Prioritize one platform and configuration source at a time based on user demand. Build local, read-only import adapters that normalize sanitized exports into the stable schema. Never request admin credentials or fetch a merchant account in this local demo. Keep any provider integration in a separately threat-modeled product phase.

**Measure quality before adding many rules.** Maintain synthetic positive, negative, edge-case, and incomplete fixtures. Track reviewer-confirmed false-positive and false-negative examples using approved, de-identified data. Publish supported scope and known gaps next to each rule; do not imply that more rules alone means better protection.

## Priority 5 — Keep privacy and safety properties testable

**Automate local-boundary checks.** Add a test that runs the UI with network observation or a constrained browser context and confirms that input analysis produces no outbound requests. Keep fixture loading same-origin, maintain the input and worksheet caps, and continue rendering untrusted values through text APIs. Test CSV exports against spreadsheet formula injection and validate exports with common spreadsheet software.

**Define a separate gate for any future persistence or active testing.** Before adding browser storage, uploads, telemetry, account connectors, or live validation, write a new data-flow/threat model, retention and deletion rules, authorization scope, operational stop conditions, and user-consent experience. The current worksheet remains tab-memory-only and passive. Any active testing must be a distinct, explicitly authorized workflow and must not be implied by this analyzer.

## Suggested order

1. Schema validation, field-level applicability, and malformed-input tests.
2. Rule provenance, source review cadence, and report/ruleset versioning.
3. Field-level comparison and stable safe subject metadata.
4. One demand-backed local import adapter with synthetic regression fixtures.
5. Reassess persistence or active capabilities only through a separate privacy and authorization review.
