'use strict';

const SOURCES = {
  shopifyWebhooks: {
    title: 'Shopify: Verify webhook deliveries',
    url: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries',
    supports: 'Shopify advises verifying the HMAC before processing and handling repeated deliveries idempotently or by delivery ID.'
  },
  owaspRest: {
    title: 'OWASP REST Security Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
    supports: 'OWASP recommends HTTPS for REST services and discusses browser-facing response headers and cache controls.'
  },
  owaspSessions: {
    title: 'OWASP Session Management Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
    supports: 'OWASP describes Secure and HttpOnly cookie attributes and recommends SameSite=Lax or Strict; None should not be used without Secure.'
  },
  mdnCors: {
    title: 'MDN: Cross-Origin Resource Sharing (CORS)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS',
    supports: 'For credentialed requests, browsers require a specific allowed origin rather than the wildcard; a wildcard can be intentional for non-credentialed public resources.'
  }
};

const RULES = [
  {
    id: 'API-001', section: 'api', title: 'Public API marked as unauthenticated', severity: 'High',
    applies: (c) => c.api?.publiclyReachable === true && c.api?.authenticationRequired === false,
    rationale: 'The supplied configuration says this API is publicly reachable and does not require authentication. If it exposes administrative or sensitive operations, unauthorized callers may be able to invoke them. The input does not establish what the API actually permits.',
    fix: 'Require authentication on every protected operation, enforce authorization server-side for each action and object, and keep management routes private or behind an approved access boundary.',
    evidence: 'OWASP advises avoiding Internet exposure of management endpoints; where exposure is necessary, use strong authentication and restrict access.' , source: 'owaspRest'
  },
  {
    id: 'API-002', section: 'api', title: 'Management API marked as Internet-facing', severity: 'High',
    applies: (c) => c.api?.managementEndpointPublic === true,
    rationale: 'The submitted configuration marks a management endpoint as publicly reachable. This is a high-impact configuration signal, not proof that the endpoint is reachable from the public Internet.',
    fix: 'Prefer a private management plane. If public access is required, add strong authentication, network or identity-based restrictions, least privilege, monitoring, and a documented emergency access path.',
    evidence: 'OWASP says to avoid exposing management endpoints via the Internet; if unavoidable, require strong authentication and restrict access.', source: 'owaspRest'
  },
  {
    id: 'WH-001', section: 'webhooks', title: 'Shopify webhook signature verification is not enabled', severity: 'High',
    applies: (c) => c.webhooks?.provider === 'Shopify' && c.webhooks?.signatureVerification !== 'enabled',
    rationale: 'The supplied Shopify webhook configuration does not say that HMAC verification is enabled. Without verification, the handler should not trust the payload as an authentic Shopify delivery.',
    fix: 'Verify the HMAC-SHA256 signature against the raw request body before processing; reject mismatches. Keep the app secret server-side and do not paste it into this analyzer.',
    evidence: 'Shopify says to verify the HMAC before processing and to reject deliveries whose signatures do not match.', source: 'shopifyWebhooks'
  },
  {
    id: 'WH-002', section: 'webhooks', title: 'Webhook endpoint URL does not use HTTPS', severity: 'High',
    applies: (c) => typeof c.webhooks?.endpointUrl === 'string' && !/^https:\/\//i.test(c.webhooks.endpointUrl),
    rationale: 'The supplied endpoint URL is not HTTPS. If this is the actual delivery URL, transport confidentiality and integrity are not protected by TLS in transit.',
    fix: 'Use a valid HTTPS endpoint with a correctly configured TLS certificate. If TLS terminates at a proxy, confirm that the public delivery URL is HTTPS and the internal hop is appropriately protected.',
    evidence: 'OWASP states that secure REST services should only provide HTTPS endpoints to protect credentials in transit and provide service authentication and integrity.', source: 'owaspRest'
  },
  {
    id: 'WH-003', section: 'webhooks', title: 'Webhook duplicate handling is not enabled', severity: 'Moderate',
    applies: (c) => Boolean(c.webhooks?.provider) && c.webhooks?.duplicateHandling !== 'enabled',
    rationale: 'Webhook systems can retry deliveries, so the same event may be received more than once. Repeated processing can cause duplicate side effects such as repeated fulfillment or messages.',
    fix: 'Make processing idempotent or persist provider delivery IDs and skip already-processed deliveries. Keep deduplication retention long enough for the provider retry window.',
    evidence: 'Shopify notes that duplicate deliveries can occur and recommends idempotent processing or deduplication using the delivery ID.', source: 'shopifyWebhooks'
  },
  {
    id: 'COOKIE-001', section: 'sessionCookie', title: 'Session cookie is not marked Secure', severity: 'High',
    applies: (c) => c.sessionCookie && c.sessionCookie.secure !== true,
    rationale: 'The supplied session-cookie setting is false or absent. A session cookie without Secure may be sent over an unencrypted HTTP connection if one is available.',
    fix: 'Set Secure on session cookies and enforce HTTPS across the application. Check every code path that issues or refreshes the cookie.',
    evidence: 'OWASP says Secure instructs browsers to send the cookie only over HTTPS and is mandatory to help prevent session-ID disclosure over unencrypted traffic.', source: 'owaspSessions'
  },
  {
    id: 'COOKIE-002', section: 'sessionCookie', title: 'Session cookie is not marked HttpOnly', severity: 'Moderate',
    applies: (c) => c.sessionCookie && c.sessionCookie.httpOnly !== true,
    rationale: 'The supplied session-cookie setting is false or absent. Scripts running in the origin may be able to read a cookie that is not HttpOnly; this does not prevent script-driven requests that automatically include cookies.',
    fix: 'Set HttpOnly for session identifiers unless a documented design requires script access. Treat it as one layer, not a substitute for preventing cross-site scripting.',
    evidence: 'OWASP explains that HttpOnly prevents scripts from reading cookies through browser APIs, while noting its limits.', source: 'owaspSessions'
  },
  {
    id: 'COOKIE-003', section: 'sessionCookie', title: 'SameSite=None is configured without Secure', severity: 'Moderate',
    applies: (c) => c.sessionCookie?.sameSite === 'None' && c.sessionCookie?.secure !== true,
    rationale: 'The supplied cookie settings combine SameSite=None with Secure disabled. Modern browser behavior requires Secure for cross-site cookies, and the combination weakens the intended protection.',
    fix: 'Enable Secure. If cross-site cookie use is not required, consider SameSite=Lax or Strict after testing checkout, identity-provider, embedded-app, and payment flows.',
    evidence: 'OWASP advises never using SameSite=None without Secure and recommends Lax or Strict for session cookies.', source: 'owaspSessions'
  },
  {
    id: 'CORS-001', section: 'api', title: 'Wildcard CORS origin is combined with credentials', severity: 'Moderate',
    applies: (c) => c.api?.cors?.allowOrigins?.includes('*') && c.api?.cors?.allowCredentials === true,
    rationale: 'This combination is not valid for credentialed browser requests: browsers block a credentialed response that uses Access-Control-Allow-Origin: *. Treat this primarily as a configuration or integration issue, not as evidence of cross-origin data theft.',
    fix: 'For credentialed browser access, return only an explicit allowlisted origin and the appropriate credential header. If the resource is intentionally public and non-credentialed, disable credentials and document that design.',
    evidence: 'MDN says credentialed responses must specify an explicit origin, not the wildcard; browsers block the wildcard response when credentials are included.', source: 'mdnCors'
  },
  {
    id: 'CORS-002', section: 'api', title: 'Wildcard CORS origin allows any browser origin to read eligible responses', severity: 'Low',
    applies: (c) => c.api?.cors?.allowOrigins?.includes('*') && c.api?.cors?.allowCredentials !== true,
    rationale: 'The configuration permits browser code from any origin to read responses that the browser otherwise allows. This can be appropriate for intentionally public, non-sensitive resources, but may be too broad for private or merchant-specific data.',
    fix: 'Confirm the endpoint serves only intentionally public, non-credentialed data. Otherwise replace the wildcard with an explicit origin allowlist and test preflight behavior.',
    evidence: 'MDN describes * as allowing any origin for requests without credentials; CORS controls browser access and is not a substitute for server-side authorization.', source: 'mdnCors'
  },
  {
    id: 'WEB-001', section: 'browserResponses', title: 'HTML response has no Content Security Policy recorded', severity: 'Moderate',
    applies: (c) => c.browserResponses?.returnsHtml === true && !String(c.browserResponses?.headers?.contentSecurityPolicy || '').trim(),
    rationale: 'The input says the service returns HTML but does not include a Content-Security-Policy value. A well-designed policy can reduce the impact of some injection paths, but a broken policy can also disrupt storefront or checkout functionality.',
    fix: 'Design a policy for the actual scripts, frames, payment providers, and app integrations; begin in report-only mode where supported, review violations, then enforce gradually. Do not copy a generic strict policy into production.',
    evidence: 'OWASP describes Content-Security-Policy as a browser security header for HTML responses and recommends selecting directives appropriate to the application.', source: 'owaspRest'
  },
  {
    id: 'CACHE-001', section: 'browserResponses', title: 'Sensitive response is not marked no-store', severity: 'Moderate',
    applies: (c) => c.api?.returnsSensitiveData === true && String(c.browserResponses?.headers?.cacheControl || '').toLowerCase().split(',').map((x) => x.trim()).includes('no-store') === false,
    rationale: 'The input marks API responses as sensitive but does not record Cache-Control: no-store. Caching behavior can expose stale or private response content on shared or private caches, depending on the response and cache implementation.',
    fix: 'Set Cache-Control: no-store on sensitive responses and review application-managed caches separately; the header does not control every application cache.',
    evidence: 'OWASP recommends Cache-Control: no-store for browser-consumed API responses and cautions that application-managed caches require separate handling.', source: 'owaspRest'
  }
];

function priorityFor(severity, environment) {
  const isProduction = String(environment || '').toLowerCase() === 'production';
  if (severity === 'High') return isProduction ? 'Immediate review' : (environment ? 'Before release' : 'High — confirm environment');
  if (severity === 'Moderate') return isProduction ? 'Review soon' : 'Planned remediation';
  if (severity === 'Low') return 'Backlog / verify need';
  return 'Informational';
}

function summarizeCoverage(config) {
  const checks = [
    ['API / CORS', 'api'],
    ['Webhooks', 'webhooks'],
    ['Session cookie', 'sessionCookie'],
    ['Browser responses', 'browserResponses']
  ];
  return checks.map(([label, key]) => ({
    area: label,
    status: config[key] && typeof config[key] === 'object' ? 'Provided; checks applied where inputs were present' : 'Not provided; checks skipped'
  }));
}

function analyzeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Input must be a JSON object.');
  }

  const environment = config.meta?.environment;
  const findings = RULES.filter((rule) => rule.applies(config)).map((rule) => {
    const source = SOURCES[rule.source];
    return {
      id: rule.id,
      area: rule.section,
      title: rule.title,
      severity: rule.severity,
      riskPriority: priorityFor(rule.severity, environment),
      confidence: 'Medium — explicit configuration assertion; not runtime-verified',
      rationale: rule.rationale,
      suggestedFix: rule.fix,
      evidence: { statement: rule.evidence, sourceTitle: source.title, url: source.url }
    };
  });

  const severityOrder = ['High', 'Moderate', 'Low', 'Informational'];
  findings.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity) || a.id.localeCompare(b.id));
  const counts = Object.fromEntries(severityOrder.map((level) => [level, findings.filter((f) => f.severity === level).length]));

  return {
    product: 'CartShield Preflight',
    inputLabel: config.meta?.label || 'Untitled configuration',
    environment: environment || 'Unknown',
    synthetic: config.meta?.synthetic === true,
    assessedAt: new Date().toISOString(),
    assessmentNote: 'Static analysis of the supplied configuration only. Configuration assertions were not independently verified. No live site was contacted, no behavior was tested, and no finding proves exploitability or compromise. Missing fields mean “not assessed,” not “safe.”',
    summary: { totalFindings: findings.length, counts },
    coverage: summarizeCoverage(config),
    findings
  };
}

const analyzerApi = { analyzeConfig, RULES, SOURCES };
if (typeof module !== 'undefined' && module.exports) module.exports = analyzerApi;
if (typeof window !== 'undefined') window.CartShieldAnalyzer = analyzerApi;
