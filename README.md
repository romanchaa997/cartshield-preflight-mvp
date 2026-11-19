# CartShield Preflight MVP

A small, local-first starter for reviewing sanitized or synthetic e-commerce configuration data. CartShield turns selected configuration assertions into explainable findings, evidence links, coverage notes, and practical remediation suggestions.

> **Scope:** This is a static configuration review, not a scanner, penetration test, compliance assessment, or incident detector. It does not contact a store or test live behavior. A report with no findings is not a security verdict.

## Run locally

Requires Node.js 20 or later. There are no third-party runtime packages.

```bash
git clone https://github.com/romanchaa997/cartshield-preflight-mvp.git
cd cartshield-preflight-mvp
npm test
npm start
```

Open <http://127.0.0.1:4173>. The server binds to localhost by default; set `PORT` to change the port. Do not expose this demo server to a public network.

## What it does

- Accepts sanitized JSON by paste or local file, or loads one of the synthetic examples.
- Analyzes the input in the browser and shows findings, source citations, qualitative priority, confidence caveats, and which areas were assessed.
- Copies or downloads a JSON report locally; no account, upload, telemetry, remote analysis, or persistence is included.
- Serves static UI files and synthetic fixtures through a small Node.js server limited to `GET` and `HEAD` requests.
- Enforces a 256 KB input limit and includes Node built-in tests.

Current checks cover public or management API flags, Shopify webhook HTTPS/HMAC/duplicate handling assertions, session-cookie Secure/HttpOnly/SameSite flags, wildcard CORS behavior, Content Security Policy presence for HTML, and `no-store` for responses marked sensitive. See [`config.schema.json`](./config.schema.json) for the current input shape and [`SECURITY_REVIEW_CHECKLIST.md`](./SECURITY_REVIEW_CHECKLIST.md) for known review work.

## Safe-use boundary

Use only fabricated or sanitized values. Never paste passwords, API keys, webhook secrets, session tokens, customer or payment data, or private URLs. Example domains use `.invalid` and are not live targets.

The tool does not probe, fetch, crawl, or authenticate to a store. It does not authorize testing any system. Findings are based on supplied declarations, are not runtime-verified, and do not establish exploitability, compromise, or compliance. A supplied value may be stale or incomplete; missing sections are marked not assessed, and “no findings” means only that none of the implemented rules matched the supplied fields. Rules are intentionally narrow and may not fit platforms beyond the documented cases.

## Evidence sources

- Shopify, [Verify webhook deliveries](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries): HMAC verification, duplicate delivery handling, and HTTPS guidance.
- OWASP, [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html): HTTPS, management endpoint exposure, response headers, and `Cache-Control: no-store`.
- OWASP, [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): Secure, HttpOnly, and SameSite cookie attributes.
- MDN, [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): wildcard origins and credentialed requests.

## Development

```bash
npm test
npm start
```

The analyzer is in `src/analyzer.js`; the UI is in `public/`; fixtures are in `fixtures/`. Tests use Node's built-in test runner. The `.kiro/` directory contains product steering and demo-experience specifications used by the project tests.

## License

This project is licensed under the MIT License. See [`LICENSE`](./LICENSE). Copyright © 2026 ТОВ «АудиторСЕК».
