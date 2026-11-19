# Tasks — CartShield Preflight demo experience

- [x] 1. Establish product boundary and Kiro spec structure
  - [x] 1.1 Document purpose, users, guardrails, and current capabilities in `.kiro/steering/product.md`.
  - [x] 1.2 Capture user needs and testable acceptance criteria in `requirements.md`.
  - [x] 1.3 Record the UI/data flow, architecture, and validation plan in `design.md`.
- [x] 2. Refresh the responsive interface
  - [x] 2.1 Build a clear two-step workspace with input guidance, scope summary, supported-check inventory, and safe-use footer.
  - [x] 2.2 Add responsive styling, visible focus, compact severity treatment, and reduced-motion support without external runtime assets.
  - [x] 2.3 Preserve accessible names, status messaging, and mobile usability.
- [x] 3. Complete local-only interactions
  - [x] 3.1 Support synthetic fixtures, local JSON file selection, paste/edit, byte-limit feedback, and JSON root validation.
  - [x] 3.2 Render findings and coverage with safe text APIs and established analyzer evidence.
  - [x] 3.3 Add report JSON copy/download, clear/reset, and Ctrl/Command+Enter.
- [x] 4. Validate and package
  - [x] 4.1 Preserve the existing analyzer rules, local server boundary, and safe-use statements.
  - [x] 4.2 Run the full Node test suite and verify the local static server routes.
  - [x] 4.3 Build the refreshed ZIP with `.kiro/` specs and source assets; exclude runtime state and dependencies.
