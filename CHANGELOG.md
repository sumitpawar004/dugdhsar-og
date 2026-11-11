# DUGDHSAR Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-11

### Added
- **Phase 1 Foundation**: Central typed `AppError` hierarchy, structured JSON logging with automatic PII redaction, outbound fetch circuit breaker, and `/api/health` + `/api/ready` diagnostic probes.
- **Phase 2 Auth & RLS**: 15-minute access JWTs, 30-day rolling refresh tokens, RFC 6238 TOTP 2FA for Super Admin, and ScopedRepository enforcing Row-Level Security across Orders and Subscriptions.
- **Phase 3 Edge Security**: Strict CSP and HSTS headers, Origin & Referer CSRF protection on mutating methods, private IP SSRF blocking, open redirect validation, and anti-XSS JSON-LD escaping.
- **Phase 4 Concurrency & Idempotency**: 3NF normalized D1 SQLite schema, concurrency-safe FEFO inventory allocation, 24-hour SHA-256 idempotency replay protection, 5-minute edge catalog caching, and soft deletes.
- **Phase 5 QA & Engineering Standards**: Zero-dependency feature flags engine, OpenAPI 3.1 REST API specification (`docs/API.md`), k6 load testing script, Disaster Recovery runbook (`docs/DR.md`), and WCAG 2.2 AA skip-to-content links.
- **Phase 6 Observability & Operations**: GitHub Actions CI/CD pipeline (`.github/workflows/deploy.yml`), staging environment configuration in `wrangler.jsonc`, error tracker (`server/errorTracker.ts`), DPDP Act data portability & erasure endpoints (`/api/user/export`, `/api/user/delete`), cost monitoring, and alerting runbooks.

---

## [1.1.0] - 2026-11-05
- Build-time static prerendering for 31 public routes using `scripts/prerender.ts`.
- Multi-viewport testing controls and Google Sheets direct REST sync via pure WebCrypto.

---

## [1.0.0] - 2026-10-15
- Initial production release: A2 Gir Cow Vedic milk delivery subscription platform for Seoni, MP.
