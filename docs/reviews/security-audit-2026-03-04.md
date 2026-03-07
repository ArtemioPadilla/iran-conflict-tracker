# Security Audit: Iran Conflict Tracker
**Date**: 2026-03-04
**Reviewer**: Centinela (QA Agent)
**Scope**: Full codebase — `src/`, `scripts/`, `.github/workflows/`

## Summary

This is a static public-read intelligence dashboard with no user accounts, no authentication, and no database. The attack surface is narrow. The most significant finding is a medium-severity XSS vector via AI-generated HTML injected with `set:html` into the hero heading. All other findings are low severity.

---

## OWASP Top 10 Assessment

### A01 — Broken Access Control
**Status: N/A**
No access control exists by design. This is a fully public read-only static site. GitHub Pages does not support authenticated routes.

### A02 — Cryptographic Failures
**Status: PASS**
- No personal data is stored or transmitted.
- API keys are stored as GitHub Actions secrets, not in code.
- External tile server (Carto CDN) uses HTTPS.
- No encryption requirements apply to this use case.

### A03 — Injection
**Status: MEDIUM — one finding**

- **[SEC-1] XSS via AI-generated `heroHeadline` rendered with `set:html`**
  - File: `src/components/static/Hero.astro:12`
  - Code: `<h1 set:html={meta.heroHeadline} />`
  - Context: `heroHeadline` in `src/data/meta.json` is updated by the nightly AI script. The script does NOT sanitize the AI response for HTML safety before writing to `meta.json`. Astro's `set:html` bypasses its default escaping and renders the string as raw HTML.
  - Impact: If the Anthropic/OpenAI API is compromised, produces unexpected output (e.g., via prompt injection in a web search result), or if the JSON file is tampered with via a compromised GitHub Actions token, a malicious script tag could be injected into the built page. This is a stored XSS vector in the build artifact.
  - Severity: **Medium** — not directly exploitable by end users (static build, no runtime execution path), but the build pipeline itself is the trust boundary. A compromised AI response could poison the build.
  - Fix option A (preferred): Sanitize `heroHeadline` in `updateMeta()` in `scripts/update-data.ts` using a server-side HTML sanitizer (e.g., `he` package for entity encoding, or strip tags entirely). Alternatively, restrict allowed tags to `<em>`, `<strong>`, `<br>` using a dedicated sanitizer.
  - Fix option B (stronger): Store `heroHeadline` as plain text and apply `<em>` / `<br>` formatting via structured fields in the schema (e.g., `heroHeadlineItalic: string` for the italic portion), removing the need for `set:html` entirely.

- **[SEC-2] No input validation on `UPDATE_SECTIONS` workflow input**
  - File: `.github/workflows/update-data.yml:37`
  - Code: `UPDATE_SECTIONS: ${{ github.event.inputs.sections || 'all' }}`
  - Impact: The value is passed as an environment variable and split by comma in `update-data.ts:435`. The section names are matched against a fixed list of string literals — there is no code execution path from the input. This is low risk. A malicious string (e.g., path traversal like `../etc`) would simply not match any section name and be silently ignored.
  - Severity: **Low** — no practical exploitation path, but the input is undocumented and unvalidated.
  - Fix: Add a `choices` constraint to the workflow input (GitHub Actions supports `options` for `choice`-type inputs in `workflow_dispatch`).

### A04 — Insecure Design
**Status: LOW — one finding**

- **[SEC-3] Nightly update script overwrites JSON files non-atomically**
  - File: `scripts/update-data.ts:66–68`
  - `writeFileSync` is used directly. If the process crashes mid-write, a JSON file could be partially written, causing the next build to fail (Zod parse will throw).
  - Severity: **Low** — the deploy workflow would fail loudly at build time rather than silently.
  - Fix: Write to a temp file first (`filename.json.tmp`), then rename atomically with `fs.renameSync`.

### A05 — Security Misconfiguration
**Status: LOW — two findings**

- **[SEC-4] No Content Security Policy (CSP) headers**
  - The dashboard loads Google Fonts (external CDN), Carto map tiles (external CDN), and custom SVG data URIs. No CSP is configured.
  - Severity: **Low** — static site on GitHub Pages has limited CSP control (no server-side headers), but `<meta http-equiv="Content-Security-Policy">` in `BaseLayout.astro` would provide defense-in-depth.
  - Fix: Add a CSP meta tag allowing `font-src: https://fonts.gstatic.com`, `img-src: https://*.basemaps.cartocdn.com`, `connect-src: 'none'`.

- **[SEC-5] Leaflet `attributionControl={false}` suppresses tile provider attribution**
  - File: `src/components/islands/LeafletMap.tsx:56`
  - Carto's dark tile layer requires attribution under its terms of service. Removing the attribution control is a ToS violation.
  - Severity: **Low** (legal risk rather than security risk)
  - Fix: Remove `attributionControl={false}` and style the attribution to match the dark theme (CSS overrides already exist in `global.css` for `.leaflet-control-attribution`).

### A06 — Vulnerable Components
**Status: LOW — 5 moderate findings in dev-only chain**

```
npm audit output:
  5 moderate severity vulnerabilities
  All in: lodash → yaml-language-server → volar-service-yaml → @astrojs/language-server → @astrojs/check
  All are devDependencies only — not shipped to end users
  Lodash prototype pollution (GHSA-xxjr-mmjv-4gpg)
```

- Severity: **Low** — these packages are only used during local development and type-checking (`npm run build` type-check phase). They are never included in the `dist/` output shipped to users.
- Fix: Monitor for `@astrojs/check` update that pins a safe `lodash` version. Do not use `npm audit fix --force` as it would downgrade `@astrojs/check`.

Runtime dependency audit:
- `leaflet` 1.9.4 — no known CVEs
- `react` 19.2.4 — no known CVEs
- `react-leaflet` 5.0.0 — no known CVEs

### A07 — Authentication Failures
**Status: N/A**
No authentication system exists. Public read-only dashboard.

### A08 — Software and Data Integrity Failures
**Status: LOW — one finding**

- **[SEC-6] AI-generated JSON is written directly to the repository without human review**
  - The nightly update script writes AI responses directly to `src/data/*.json` and commits them. While Zod validation guards against schema violations, it cannot detect factually incorrect, misleading, or intentionally manipulated data from a compromised AI response.
  - Severity: **Low** — this is an inherent design tradeoff of the autonomous update architecture, not a code defect. Documented here for awareness.
  - Mitigation already in place: Zod schema validation before writing; bounds checking on map coordinates; timestamp validation.

### A09 — Security Logging and Monitoring Failures
**Status: LOW**

- **[SEC-7] Error logging in `update-data.ts` may expose sensitive stack traces to GitHub Actions logs**
  - File: `scripts/update-data.ts:163`
  - `console.error('[kpis] Error:', err)` — if `err` contains API response data (including potential PII in news search results), it would appear in GitHub Actions logs.
  - Severity: **Low** — logs are not public unless the repository is public and log visibility is not restricted.
  - Fix: Log only `err.message` rather than the full error object for caught exceptions.

### A10 — Server-Side Request Forgery (SSRF)
**Status: N/A**
No server-side request handling exists. The update script runs as a GitHub Actions job, not a web server.

---

## Secrets Scan

| Check | Result |
|---|---|
| Hardcoded API keys in source | Not found |
| API keys in workflow files | Not found — uses `${{ secrets.ANTHROPIC_API_KEY }}` |
| `.env` files committed | Not found |
| `.env` in `.gitignore` | **NOT present** — low risk since no `.env` currently exists, but should be added |

**Recommendation**: Add `.env` and `.env.local` to `.gitignore` as a preventive measure.

---

## Dependency Audit Summary

| Package | Type | Status | Notes |
|---|---|---|---|
| `astro` 5.18.0 | Runtime | Clean | No CVEs |
| `leaflet` 1.9.4 | Runtime | Clean | No CVEs |
| `react` 19.2.4 | Runtime | Clean | No CVEs |
| `react-leaflet` 5.0.0 | Runtime | Clean | No CVEs |
| `@anthropic-ai/sdk` 0.78.0 | Dev | Clean | No CVEs |
| `openai` 6.25.0 | Dev | Clean | No CVEs |
| `zod` 3.25.76 | Dev | Clean | Major version 4 available |
| `@astrojs/check` | Dev | Moderate | Lodash chain (dev-only, no user impact) |

---

## Architecture Security Review

- No business logic is exposed to the client. All data processing happens at build time.
- The update script does not accept external user input — it reads from AI APIs only.
- The React islands handle only display logic; no data mutation occurs client-side.
- No local storage, cookies, or session storage is used.

---

## Security Verification Checklist (DO-CONFIRM)

- [x] No hardcoded secrets or API keys in code — PASS
- [x] All user input validated — PASS (no user input; AI input is Zod-validated)
- [x] No SQL/NoSQL injection vectors — N/A
- [x] Authentication enforced — N/A
- [x] No known critical CVEs in runtime dependencies — PASS

---

## Verdict

**APPROVED WITH CONDITIONS**

No critical security findings. One medium finding (SEC-1, XSS via `set:html`) should be resolved before this dashboard is linked publicly, particularly given that the AI update script runs nightly with web search access and could be influenced by adversarial content in search results.

Required before wider publication:
1. **SEC-1**: Sanitize or restructure `heroHeadline` to eliminate `set:html`.
2. **SEC-5**: Restore Leaflet attribution (ToS compliance).
3. Add `.env` to `.gitignore`.
