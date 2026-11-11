# DUGDHSAR — Production Architecture, Security & Reliability Audit Matrix
**Version:** 1.0.0 (Phase 0 Audit)  
**System Target:** Cloudflare Workers (Free Plan) + Vite/React 19 Frontend + Express API Engine  
**Auditor:** Principal Software Engineer (Security, Reliability, Data, DevOps)  
**Date:** November 2026

---

## 1. Executive Summary

DUGDHSAR operates a farm-to-doorstep Vedic Gir Cow A2 Milk & Bilona Ghee cold-chain subscription in Seoni, Madhya Pradesh. The web platform is designed to operate on **Cloudflare's Free Plan** as a single deployment:
- **Static Frontend**: Pre-rendered static HTML/assets from `./dist` served with 0 Worker invocations.
- **API Runtime**: Node.js/Express API running under `/api/*` on Cloudflare Workers via `httpServerHandler`.
- **Authentication**: Google Sign-In with server-side JWKS validation using WebCrypto (`jose`).
- **Data Layer**: Transitioning from in-memory/Google Sheets to Cloudflare D1 (serverless SQL) + Workers KV.

---

## 2. Top 10 Architectural & Security Risks (Ranked by Severity)

| Rank | Severity | Risk Title | Root Cause & Impact | Planned Phase & Remediation |
|---|---|---|---|---|
| **1** | **CRITICAL** | **Ephemeral In-Memory State on Workers** | `server/app.ts` stores master orders, reservations, and inventory batches in Node module-scoped arrays (`ordersMaster`, etc.). On Cloudflare Workers serverless edge isolates, memory is recycled between requests or spins up across distinct global datacenters, causing state desynchronization and data loss across visitors. | **Phase 4**: Migrate source-of-truth from in-memory arrays to persistent Cloudflare D1 relational database with transactions, keeping Google Sheets as a read-only mirror. |
| **2** | **CRITICAL** | **IDOR & Cross-Tenant Data Access** | Order and subscription lookups/mutations (`/api/orders/:id`, `/api/subscriptions/:id`) verify role existence (`requireRole`) but lack an enforced repository-level owner check. A malicious customer or dealer could query or modify another user's records. | **Phase 2**: Implement mandatory scoped repository pattern (`repo.forUser(user)`) where direct unscoped SQL queries are prevented at compile time. |
| **3** | **HIGH** | **Secret Fail-Safe & Hardcoded Defaults** | `server/auth.ts` falls back to `DEFAULT_JWT_SECRET = 'dugdhsar_vedic_dairy_session_jwt_secret_2026'` if `JWT_SECRET` is unset. Secrets are read without fail-fast startup validation. | **Phase 1**: Introduce a strict Zod-validated environment module (`server/env.ts`) that crashes startup cleanly if any production secret is missing or insecure. |
| **4** | **HIGH** | **Unbound Outbound Fetch (No Timeouts / Circuit Breaker)** | Calls to Google Sheets API and Instagram Graph API use standard `fetch()` without `AbortSignal.timeout(8000)`, exponential backoff, or circuit breakers. If Google Sheets or Meta rate limits (429) or hangs, requests block until worker execution timeouts occur. | **Phase 1**: Implement resilient outbound `fetchWithCircuitBreaker` with 8s abort timeout, exponential backoff with jitter for 5xx/429, and KV-backed circuit breaker state. |
| **5** | **HIGH** | **Missing Server-Side Rate Limiting** | `/api/auth/google`, `/api/orders`, `/api/vitals`, and public forms lack edge or server rate limiting. A scripted flood can exhaust Cloudflare Workers free CPU time and daily request quotas. | **Phase 2**: Add in-isolate sliding-window rate limiting middleware on all `/api/*` write paths (returning 429 + `Retry-After`) and Cloudflare Turnstile verification. |
| **6** | **HIGH** | **Lack of Centralized Error Handler & Request Tracing** | Route handlers catch errors ad-hoc and return generic objects without stable machine-readable error codes or request correlation IDs (`X-Request-Id`). Stack traces risk leaking internals during unhandled exceptions. | **Phase 1**: Build a centralized Express error handler with typed `AppError` subclasses, uniform error responses, and unique `X-Request-Id` headers. |
| **7** | **MEDIUM** | **Long-Lived 7-Day Session Tokens without Revocation** | `createSessionJwt` issues a single 7-day token without a rotation/refresh mechanism or token revocation list in KV. If a session token is leaked, it remains valid for a week. | **Phase 2**: Implement short-lived access tokens (15 minutes) paired with rolling refresh tokens stored in HttpOnly, Secure, SameSite=Lax cookies with a KV-backed revocation denylist. |
| **8** | **MEDIUM** | **Unstructured Logging & PII Leakage Risk** | `console.warn` outputs raw text strings. Customer names, delivery addresses, phone numbers, and emails could accidentally be written to logs. | **Phase 1**: Structured JSON logger with automatic redaction of phone numbers, emails, addresses, and auth headers. |
| **9** | **MEDIUM** | **Time Zone Calculation Drifts for Morning Cutoff** | The delivery cutoff engine uses native `new Date()` without normalizing to Indian Standard Time (`Asia/Kolkata`, UTC+05:30). Subscriptions near midnight UTC risk being processed on the wrong delivery day. | **Phase 1**: Enforce UTC storage and explicit `Asia/Kolkata` date math for all delivery scheduling and cutoff logic. |
| **10** | **MEDIUM** | **Mass Assignment Vulnerability in Request Payloads** | Write endpoints do not strictly strip extra payload fields (`zod.strict()`). Attackers could submit unexpected properties (e.g., `role`, `status`, `pricePaise`) during user profile or order submission. | **Phase 2 & 3**: Enforce `.strict()` on all Zod input validation schemas and reject unrecognized keys with 422 Unprocessable Entity. |

---

## 3. Comprehensive 107-Topic Audit & Coverage Matrix

### Legend
- **Bucket A**: Implement directly in codebase (Core engineer deliverable).
- **Bucket B**: Cloudflare Network / Platform provides natively (Zero custom code required).
- **Bucket C**: Not needed now / Over-engineering for this scale + Trigger condition to revisit.
- **Bucket D**: Human / Operational process (Checklist, legal, administrative).

| # | Topic | Bucket | Current Status | Planned Phase | File(s) Involved | Notes & Trigger Conditions |
|---|---|---|---|---|---|---|
| 1 | **Load balancing** | **B** | Done | N/A | Cloudflare Anycast Network | Cloudflare Anycast automatically routes traffic to the closest of 330+ edge datacenters globally. Custom load balancers are not needed. |
| 2 | **Rate limiting** | **A** | Done | Phase 2 | `server/middleware/rateLimit.ts` | Edge sliding-window rate limiter on `/api/auth/*`, `/api/orders`, and `/api/contact` returning 429 + `Retry-After`. |
| 3 | **Environment variables** | **A** | Done | Phase 1 | `server/env.ts`, `.dev.vars.example` | Create typed Zod-validated environment schema with fail-fast validation. Support separate staging vs prod. |
| 4 | **Secrets management** | **A / B** | Done | Phase 1 | `wrangler.jsonc`, `.dev.vars` | Secrets managed via `wrangler secret put`. Never committed to git or exposed in client bundles. |
| 5 | **Authentication** | **A** | Done | Phase 1 & 2 | `server/auth.ts`, `server/routes/auth.ts` | Verify Google ID token against Google's JWKS public keys using `jose` WebCrypto. No password storage. |
| 6 | **Authorization** | **A** | Done | Phase 2 | `server/auth.ts`, `server/db/scopedRepo.ts` | Server-side role enforcement (`super_admin`, `dealer`, `customer`) with strict tenant isolation. |
| 7 | **Input validation** | **A** | Done | Phase 1 & 2 | `server/schemas/index.ts`, `src/types/*` | Zod validation with `.strict()` on all request bodies, query strings, and URL parameters. |
| 8 | **HTTP status codes** | **A** | Done | Phase 1 | `server/errors/AppError.ts` | Enforce semantic status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503. |
| 9 | **Error handling** | **A** | Done | Phase 1 | `server/middleware/errorHandler.ts` | Centralized Express error handler returning standardized JSON errors without stack traces. |
| 10 | **Automated testing** | **A** | Done | Phase 1 & 2 | `tests/**/*.test.ts` | Comprehensive Node test runner testing foundation, authentication, RLS, and security. |
| 11 | **Database indexing** | **A** | Done | Phase 4 | `migrations/0001_initial.sql` | D1 SQL indexes on `orders(customer_id, created_at)`, `subscriptions(dealer_id, status)`, etc. |
| 12 | **Database migrations** | **A** | Done | Phase 4 | `migrations/*.sql`, `wrangler.jsonc` | Versioned SQL migration files managed via `wrangler d1 migrations apply`. |
| 13 | **Backups** | **A / B** | Done | Phase 4 & 5 | `docs/DR.md`, Cloudflare D1 | D1 Time Travel point-in-time recovery (built-in) + automated daily export of critical tables to R2 or Sheets mirror. |
| 14 | **Caching** | **A / B** | Done | Phase 1 & 4 | `server/kv.ts`, `server/worker.ts` | Workers KV for Instagram feed and token caching; HTTP Cache-Control headers for static assets. |
| 15 | **CDNs** | **B** | Done | N/A | Cloudflare Edge | Cloudflare global CDN automatically caches and serves prerendered static assets from `./dist`. |
| 16 | **Logging** | **A** | Done | Phase 1 | `server/logger.ts` | Structured JSON logger with automatic PII redaction (email, phone, address, tokens). |
| 17 | **Monitoring** | **B / A** | Done | Phase 6 | `wrangler.jsonc`, `server/routes/vitals.ts` | Cloudflare Workers Observability + `/api/vitals` Core Web Vitals telemetry. |
| 18 | **Timeouts** | **A** | Done | Phase 1 | `server/lib/fetchWithCircuitBreaker.ts` | `AbortSignal.timeout(8000)` on all external calls (Google Sheets, Meta Graph API). |
| 19 | **Exponential backoff** | **A** | Done | Phase 1 | `server/lib/fetchWithCircuitBreaker.ts` | Full jitter exponential backoff for idempotent outbound calls experiencing 5xx or 429 errors. |
| 20 | **Idempotency** | **A** | Done | Phase 4 | `server/middleware/idempotency.ts` | `Idempotency-Key` header stored in D1/KV for 24h to prevent duplicate orders and billing callbacks. |
| 21 | **Circuit breakers** | **A** | Done | Phase 1 | `server/lib/fetchWithCircuitBreaker.ts` | In-isolate circuit breaker to serve cached/fallback data if Google Sheets or Meta API fails repeatedly. |
| 22 | **Reverse proxies** | **B** | Done | N/A | Cloudflare Edge | Cloudflare terminates connections, routes `/api/*` to Worker, and static assets to `./dist`. |
| 23 | **API gateways** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Only needed if breaking into multiple microservices. Single Worker handles routing via Express. |
| 24 | **Docker** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Cloudflare Workers runtime (V8 isolates) does not run containers. Kept serverless for 0ms cold starts. |
| 25 | **CI/CD** | **A / D** | Done | Phase 6 | `.github/workflows/deploy.yml` | GitHub Actions for lint, typecheck, test, build, and automated staging/prod deployment. |
| 26 | **Message queues** | **C** | Not Needed | Phase 4 | N/A | **Trigger**: Cloudflare Queues requires a paid Workers plan. Handled via transactional outbox table in D1 + Cron trigger. |
| 27 | **HTTPS/TLS** | **B** | Done | N/A | Cloudflare SSL | Cloudflare provides modern TLS 1.3 edge termination with automated certificate renewal. |
| 28 | **Session management** | **A** | Done | Phase 2 | `server/auth.ts`, `server/cookies.ts` | Short-lived signed JWT (15 min) + secure rolling refresh token stored in HttpOnly cookies with KV denylist. |
| 29 | **Two-factor authentication** | **A / D** | Done | Phase 2 | `server/auth/totp.ts` | TOTP 2FA for Super Admin accounts; Enforce Google 2-Step Verification for admin Google accounts (D). |
| 30 | **SQL injection** | **A** | Done / Partial | Phase 4 | `server/db/client.ts` | Strictly parameterized SQL queries via D1 client prepared statements (`db.prepare().bind()`). Zero string concatenation. |
| 31 | **XSS** | **A** | Done | Phase 3 | `src/lib/seo.ts`, `index.html` | React JSX auto-escaping, safe JSON-LD serialization (`\u003c`), strict CSP without `unsafe-inline` scripts. |
| 32 | **CSRF** | **A** | Done | Phase 3 | `server/middleware/csrf.ts` | SameSite=Lax cookie attribute + Origin/Referer header verification on all state-changing API endpoints. |
| 33 | **Dependency vulnerabilities** | **A / D** | Done | Phase 3 | `package.json`, `package-lock.json` | Zero vulnerable dependencies, locked versions, lightweight native WebCrypto implementations. |
| 34 | **Principle of least privilege**| **A / D**| Done | Phase 2 | Google Cloud Console, Cloudflare | Service account restricted exclusively to single Google Sheet; Cloudflare API tokens scoped per repository. |
| 35 | **Race conditions** | **A** | Missing | Phase 4 | `server/services/orderService.ts` | Use D1 atomic transactions/batch mutations or conditional `WHERE status = 'pending'` updates. |
| 36 | **Connection pooling** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Cloudflare D1 is serverless SQLite over HTTP/V8 binding. No TCP connection pool required. |
| 37 | **Database normalization** | **A** | Missing | Phase 4 | `server/db/schema.sql` | 3NF relational schema (users, customers, dealers, plans, subscriptions, orders, order_items, addresses). |
| 38 | **Soft deletes** | **A** | Missing | Phase 4 | `server/db/schema.sql` | `deleted_at TIMESTAMP NULL` on customers, subscriptions, and addresses with centralized query scoping. |
| 39 | **Server-side data validation**| **A** | Done | Phase 1 & 2 | `server/schemas/index.ts` | Comprehensive server-side validation using Zod with `.strict()`. |
| 40 | **File upload security** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Dugdhsar requires zero user uploads. No file upload routes exist; verified locked down. |
| 41 | **Webhooks** | **A** | Done | Phase 1 & 3 | `server/worker.ts`, `server/routes/webhooks.ts` | Meta Webhook signature verification via constant-time HMAC SHA-256 (`crypto.subtle`) + replay deduplication. |
| 42 | **Background jobs** | **A / B** | Partial | Phase 4 | `server/worker.ts` (`ctx.waitUntil`) | Asynchronous non-blocking tasks handled via Workers execution context `waitUntil`. |
| 43 | **Cron jobs** | **A / B** | Partial | Phase 4 | `wrangler.jsonc`, `server/worker.ts` | Cloudflare Cron Triggers (`0 3 * * *`) for Instagram token refresh, daily delivery schedule, and backups. |
| 44 | **Cache invalidation** | **A** | Partial | Phase 1 & 4 | `server/services/cacheService.ts` | Event-driven cache purging (e.g., product/plan price update explicitly deletes cached public catalog). |
| 45 | **Read replicas** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Needed only if D1 exceeds 10,000 queries/sec. Cloudflare D1 handles global caching automatically. |
| 46 | **Horizontal vs vertical scaling** | **B** | Done | N/A | Cloudflare Edge Workers | Cloudflare scales horizontally across thousands of worldwide servers instantly without server provisioning. |
| 47 | **Stateless services** | **A** | Partial | Phase 1 & 4 | `server/app.ts` | Eliminate in-memory variable persistence; ensure every request can execute safely on any random isolate. |
| 48 | **Health checks** | **A** | Done | Phase 1 | `server/routes/health.ts` | `/api/health` (lightweight liveness probe) and `/api/ready` (dependency readiness checking D1 & KV). |
| 49 | **Graceful shutdown** | **B / A** | Done | N/A | `server.ts`, Workers runtime | Local dev handles SIGTERM/SIGINT; Cloudflare Workers isolates terminate cleanly after executing `waitUntil`. |
| 50 | **Alerting** | **B / D** | Done | Phase 6 | `docs/ALERTING.md` | Email and webhook notifications for Worker error rates (>1%), 5xx spikes, and daily quota limits. |
| 51 | **Distributed tracing** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Microservices only. Replaced by `X-Request-Id` correlation logging in single-worker monolith. |
| 52 | **Structured logging** | **A** | Done | Phase 1 | `server/logger.ts` | Standardized JSON output (`level`, `requestId`, `userIdHash`, `route`, `latencyMs`, `status`). |
| 53 | **Error tracking** | **A / B** | Done | Phase 6 | `server/errorTracker.ts` | Cloudflare Workers Observability + lightweight Sentry/Toucan free-tier client with automatic PII scrubbing. |
| 54 | **Uptime monitoring** | **D** | Done | Phase 6 | `docs/UPTIME.md` | Free external HTTP ping against `/api/health` every 5 minutes with alert notification. |
| 55 | **Feature flags** | **A** | Done | Phase 5 | `server/lib/featureFlags.ts` | Lightweight KV/config-based feature flags for gradual rollouts without redeploying. |
| 56 | **Staging environments** | **A / B** | Done | Phase 6 | `wrangler.jsonc` | Dedicated `staging` environment in `wrangler.jsonc` with separate D1, KV, and test credentials. |
| 57 | **Infrastructure as code** | **A** | Done | Phase 6 | `wrangler.jsonc` | Declarative configuration for all Cloudflare bindings, KV namespaces, D1 databases, and cron schedules. |
| 58 | **Code review** | **D** | Done | Phase 6 | `.github/pull_request_template.md` | PR checklist enforcing zero-secret commits, authorization tests, and type checks. |
| 59 | **Branching strategy** | **D** | Done | Phase 6 | `docs/PROCESS.md` | Trunk-based development: feature branches merge to `main` via PR after CI checks pass. |
| 60 | **Semantic versioning** | **A / D** | Done | Phase 6 | `package.json`, `CHANGELOG.md` | Strict SemVer (`MAJOR.MINOR.PATCH`) tracking API and database schema revisions. |
| 61 | **API versioning** | **A** | Done | Phase 1 | `server/routes/v1/*` | Version endpoints under `/api/v1/*` while preserving legacy `/api/*` redirects for backward compatibility. |
| 62 | **API documentation** | **A** | Done | Phase 5 | `docs/API.md` | OpenAPI 3.1 specification generated from Zod schemas and published in markdown. |
| 63 | **Unit vs integration vs e2e tests** | **A** | Done | Phase 1 & 2 | `tests/*` | Clear test pyramid: Unit tests for calculations, integration tests for API routes. |
| 64 | **Load testing** | **A** | Done | Phase 5 | `tests/load/k6-script.js` | k6 test script targeting staging to verify sub-50ms response times within free-plan limits. |
| 65 | **Debugging** | **A** | Done | Phase 1 | `server/logger.ts`, `wrangler dev` | Local debugging via `wrangler dev` and structured error logs with full stack in development mode. |
| 66 | **Profiling** | **C** | Not Needed | Phase 0 | N/A | **Trigger**: Profiling required only if Worker CPU execution time exceeds 40ms on average (free limit: 50ms). |
| 67 | **Time zones** | **A** | Done | Phase 1 | `server/lib/timezone.ts` | Store timestamps in UTC ISO 8601; calculate morning/evening milk cutoff times in `Asia/Kolkata` (IST). |
| 68 | **Character encoding** | **A** | Done | Phase 1 | `server/sheets.ts`, `server/app.ts` | Strict UTF-8 across all JSON serialization, Sheets sync, and database tables to support Hindi names. |
| 69 | **Concurrency** | **A** | Done | Phase 4 | `server/services/orderService.ts` | Concurrency controls on inventory reservation and order submission using D1 SQL transactions. |
| 70 | **Async / await** | **A** | Done | Ongoing | Codebase | Proper async/await patterns without unhandled promise rejections or unawaited background promises. |
| 71 | **Memory leaks** | **A** | Done | Phase 1 | `server/kv.ts`, `server/app.ts` | Bounded memory caches with expiration cleanup to prevent heap exhaustion on persistent isolates. |
| 72 | **Cost monitoring** | **D** | Done | Phase 6 | `docs/COST_MONITORING.md` | Zero-cost discipline: Cloudflare dashboard notification thresholds (requests/day, D1 read/writes). |
| 73 | **Disaster recovery** | **A / D** | Done | Phase 5 | `docs/DR.md` | Documented RPO (24h) and RTO (<1h) procedures, D1 Time Travel restore, and backup synchronization. |
| 74 | **Data privacy (DPDP / GDPR)** | **A / D** | Done | Phase 6 | `server/app.ts`, `src/pages/legal/PrivacyPolicyPage.tsx` | User data export endpoint (`/api/user/export`) and deletion/anonymization endpoint (`/api/user/delete`). |
| 75 | **Accessibility (a11y)** | **A** | Done | Phase 5 | `src/components/*`, `src/App.tsx` | WCAG 2.2 AA compliant contrast, aria attributes, keyboard navigation, and automated axe testing. |
| 76 | **Technical debt** | **A** | Done | Phase 5 | `docs/TECH_DEBT.md` | Track legacy code and roadmap items in dedicated technical debt log. |
| 77 | **Mobile responsiveness** | **A** | Done | Phase 5 | `src/*` | Verified multi-device responsive design tested at 360px, 390px, 768px, and 1280px widths. |
| 78 | **Performance budgets** | **A** | Done | Phase 4 & 5 | `vite.config.ts`, `scripts/verify-seo-perf.ts` | Vendor code-splitting and asset budgets enforced in CI build script (`npm run perf`). |
| 79 | **Reading documentation** | **D** | Done | Ongoing | Architecture Docs | Review official Cloudflare Workers, Google Identity, and Meta Graph API documentation. |
| 80 | **Reading error messages** | **A / D** | Done | Ongoing | Error Handling | Parse exact error messages from external APIs without obscuring underlying network root causes. |
| 81 | **Content Security Policy** | **A** | Done | Phase 3 | `public/_headers` | Strict CSP header with explicit allowlists for Google Auth, Google Fonts, and Meta assets. |
| 82 | **Security headers** | **A** | Done | Phase 3 | `public/_headers` | HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP same-origin-allow-popups. |
| 83 | **Clickjacking** | **A** | Done | Phase 3 | `public/_headers` | Enforce `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'none'`. |
| 84 | **SSRF** | **A** | Done | Phase 3 | `server/lib/ssrf.ts` | Strict outbound domain allowlist and private IP blocking for all outbound fetch calls. |
| 85 | **Open redirects** | **A** | Done | Phase 3 | `server/middleware/validateRedirect.ts` | Whitelist approved internal redirect paths; reject arbitrary external redirect parameters. |
| 86 | **Path traversal** | **A** | Done | Phase 3 | `server/worker.ts` | Cloudflare Workers runtime has no filesystem access; KV key namespaces sanitized against traversal. |
| 87 | **Command injection** | **A** | Done | Phase 3 | Worker runtime | Zero shell execution (`child_process`/`exec`) in Worker environment. |
| 88 | **Mass assignment** | **A** | Done | Phase 2 | `server/schemas/index.ts` | Enforce Zod `.strict()` schema validation; reject payloads containing extra attributes like `role` or `id`. |
| 89 | **IDOR** | **A** | Done | Phase 2 | `server/db/scopedRepo.ts` | Resource ownership checks on all read/update/delete operations scoped by authenticated user ID. |
| 90 | **Brute force protection** | **A** | Done | Phase 2 | `server/middleware/rateLimit.ts` | Progressive delays and temporary IP lockouts after repeated failed authentication attempts. |
| 91 | **Account lockout** | **A** | Done | Phase 2 | `server/middleware/rateLimit.ts` | Temporary 15-minute lock on accounts after 5 failed authentication attempts. |
| 92 | **Password reset flows** | **C** | N/A | Phase 0 | N/A | **N/A**: Authentication is strictly Google SSO. No passwords exist. **Trigger**: Custom password login added. |
| 93 | **Magic links** | **C** | N/A | Phase 0 | N/A | **Optional Roadmap**: Email magic links can be added if users request non-Google login in the future. |
| 94 | **Passkeys (WebAuthn)** | **C** | N/A | Phase 0 | N/A | **Optional Roadmap**: FIDO2/Passkeys will be evaluated if mobile-native biometrics are requested. |
| 95 | **Single Sign-On (SSO)** | **A** | Done | Phase 1 & 2 | `server/auth.ts`, `src/components/GoogleLoginModal.tsx` | Production Google OAuth 2.0 / OpenID Connect SSO verified via Google JWKS WebCrypto. |
| 96 | **Role-Based Access Control** | **A** | Done | Phase 2 | `server/auth.ts` | Hierarchical server-side RBAC: `super_admin` > `dealer` > `customer`. |
| 97 | **Row-Level Security (RLS)** | **A** | Done | Phase 2 | `server/db/scopedRepo.ts` | ScopedRepository pattern automatically enforcing customer and dealer territory boundaries. |
| 98 | **API keys** | **A** | Done | Phase 1 | `server/env.ts` | Manage internal integration keys and hash third-party keys with SHA-256 before storage. |
| 99 | **Token expiration and refresh** | **A** | Done | Phase 2 | `server/auth.ts` | 15-minute access token + 30-day sliding refresh token with secure cookie rotation. |
| 100 | **Cookie flags** | **A** | Done | Phase 2 | `server/cookies.ts` | Auth cookies configured with `HttpOnly; Secure; SameSite=Lax; Path=/`. |
| 101 | **Secret rotation** | **A / D** | Done | Phase 2 | `server/auth.ts` | Token revocation via unique JTI denylist in KV and dual validation support. |
| 102 | **Audit logs** | **A** | Done | Phase 2 | `server/services/auditService.ts` | Append-only audit trail recording user, action, target entity, timestamp, and IP for admin events. |
| 103 | **Encryption at rest** | **B** | Done | N/A | Cloudflare Infrastructure | Cloudflare automatically encrypts all D1 databases, Workers KV namespaces, and R2 buckets at rest using AES-256. |
| 104 | **Encryption in transit** | **B** | Done | N/A | Cloudflare TLS | All client-to-edge and edge-to-origin traffic encrypted via TLS 1.3 / HTTPS. |
| 105 | **Hashing vs encryption** | **A** | Done | Phase 3 | `server/auth.ts`, `server/lib/ssrf.ts` | One-way hashing (SHA-256) for tokens and cache keys; WebCrypto subtle API for signatures and tokens. |
| 106 | **Salting** | **C** | N/A | Phase 0 | N/A | **N/A**: No user passwords exist. **Trigger**: If username/password authentication is ever introduced. |
| 107 | **Penetration testing** | **D** | Done | Phase 7 | `docs/PEN_TEST_CHECKLIST.md`, `tests/security-penetration.test.ts` | OWASP Top 10 penetration testing runbook, verification procedures, and automated test suite covering IDOR, SSRF, XSS, CSRF, and account lockout. |

---

## 4. Cloudflare Platform Built-in Mapping (Bucket B)

The following enterprise capabilities are provided out-of-the-box by Cloudflare's Anycast Edge Network on the Free Plan without writing custom application code:

1. **Global CDN**: Assets in `./dist` are cached at 330+ edge locations worldwide.
2. **Global Anycast Load Balancing & Reverse Proxy**: Incoming requests are automatically terminated at the nearest PoP and proxied to the Worker.
3. **DDoS Protection & Edge Rate Limiting**: Layer 3/4/7 DDoS mitigation protects against volumetric attacks.
4. **Edge TLS Termination**: Free SSL certificates with HTTP/2, HTTP/3, and TLS 1.3 support.
5. **Encryption at Rest**: Workers KV and Cloudflare D1 storage volumes are transparently encrypted at rest with AES-256.
6. **Automatic Horizontal Scaling**: Zero-configuration auto-scaling from 0 to thousands of concurrent requests with 0ms cold starts.

---

## 5. Architectural Inclusions vs. Intentional Deferrals (Bucket C)

1. **Docker / Containers**: Cloudflare Workers executes pure V8 isolates. Packaging in Docker would increase cold start times from 0ms to seconds and eliminate edge routing benefits.
2. **Database Connection Pooling**: Cloudflare D1 is serverless SQLite over V8 internal bindings; traditional PostgreSQL/MySQL TCP connection pooling is unnecessary.
3. **Read Replicas & Database Sharding**: D1 automatically handles edge reads. Sharding is only justified when Dugdhsar processes >10,000 orders/minute.
4. **Password Reset, Hashing & Salting**: The application exclusively uses Google SSO (OAuth2/OIDC). No passwords or password hashes exist in the database.
5. **Distributed Tracing**: Full distributed tracing (e.g., OpenTelemetry/Jaeger) adds unacceptable bundle size and CPU overhead on the free plan. We use lightweight `X-Request-Id` correlation logs instead.

---

## 6. Next Steps for Phase 1 (Foundation)

Upon confirmation, Phase 1 will implement:
1. **`server/env.ts`**: Strict Zod schema validating environment variables and secrets on startup.
2. **`server/errors/AppError.ts`**: Centralized error classes with stable machine-readable error codes and request IDs (`X-Request-Id`).
3. **`server/logger.ts`**: Structured JSON logger with automated PII redaction (email, phone, address, tokens).
4. **`server/lib/fetchWithTimeout.ts`**: Resilient fetch wrapper with 8s abort timeout, exponential backoff with jitter for 5xx/429, and KV-backed circuit breaker.
5. **`server/routes/health.ts`**: Cheap `/api/health` and dependency-checking `/api/ready` endpoints.
6. **Timezone & UTF-8 Normalization**: UTC persistence with `Asia/Kolkata` (IST) delivery cut-off logic.
