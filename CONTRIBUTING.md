# Contributing

Thanks for helping improve CartShield Preflight. This MVP is intentionally narrow: it analyzes only sanitized or synthetic JSON locally in the browser.

## Before proposing a change

- Keep examples synthetic and use `.invalid` domains; never commit secrets, customer or payment data, private URLs, or real merchant configuration.
- Do not add live-store probing, uploads, remote analysis, telemetry, accounts, persistence, or secret handling without a separately reviewed scope, privacy assessment, and threat-model redesign.
- Keep findings explainable and distinguish configuration assertions from runtime-verified facts.

## Test your changes

Use Node.js 20 or later and run:

```bash
npm test
```

For UI changes, also run `npm start` and review the demo locally at <http://127.0.0.1:4173>. The development server is intended to remain bound to localhost; do not expose it to a public network.

## Pull requests

Describe the behavior changed, include or update tests, and call out any change to data handling, network behavior, supported configuration fields, or security claims. Do not claim that a finding proves exploitability or that an empty report proves a system is secure.
