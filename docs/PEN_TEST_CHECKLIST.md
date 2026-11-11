# DUGDHSAR OWASP Top 10 Security & Penetration Testing Audit Runbook

**Target System**: DUGDHSAR Vedic Gir Cow Cold-Chain Dairy Platform  
**Architecture**: Cloudflare Worker Edge Monolith + React 19 Frontend + D1 SQLite + Workers KV  
**Target Compliance**: OWASP Top 10 (2021) & India's Digital Personal Data Protection (DPDP) Act, 2023  
**Auditor**: Principal Security & Reliability Engineer  

---

## 1. OWASP Top 10 (2021) Vulnerability Assessment Matrix

### A01: Broken Access Control
- [x] **Insecure Direct Object References (IDOR)**:
  - *Mechanism*: `ScopedRepository` (`server/db/scopedRepo.ts`) strictly enforces user boundaries on `findById` and `findMany`.
  - *Verification*: A patron requesting `/api/orders/:id` belonging to another patron receives HTTP `403 Forbidden` (`Access denied`).
- [x] **Role Privilege Escalation**:
  - *Mechanism*: Role is determined exclusively from server-side email verification against `SUPER_ADMIN_EMAILS` and `DEALER_EMAILS`. Client-submitted `requestedRole` is discarded.
  - *Verification*: Non-admin requests to `/api/inventory/adjust`, `/api/inventory/quarantine`, or `/api/admin/feature-flags` return HTTP `403 Forbidden`.
- [x] **Dealer Territory Boundary Isolation**:
  - *Mechanism*: Dealers can query orders only within their assigned territory pincodes (`assignedPincodes`) or matching `dealerId`.

---

### A02: Cryptographic Failures
- [x] **Data in Transit**:
  - Enforced modern TLS 1.3 with HSTS (`max-age=63072000; includeSubDomains; preload`).
- [x] **Token Signatures & WebCrypto**:
  - Pure WebCrypto (`crypto.subtle`) HMAC SHA-256 for session JWTs. No plain-text secrets in memory or logs.
  - 15-minute access token lifespan + rolling 30-day refresh tokens.
  - Revoked tokens tracked in KV denylist by unique JWT ID (`jti`).
- [x] **Two-Factor Authentication (2FA)**:
  - RFC 6238 TOTP using WebCrypto HMAC-SHA1. Timing-safe comparison prevents side-channel attacks.

---

### A03: Injection
- [x] **SQL Injection (SQLi)**:
  - D1 SQLite database queries use strictly prepared statements (`db.prepare().bind()`). Zero raw string concatenation.
- [x] **Cross-Site Scripting (XSS)**:
  - Prerendered HTML and dynamic HTML shells escape dangerous script tags using `safeJsonLdString()` (replaces `<` with `\u003c`, `>` with `\u003e`, and `&` with `\u0026`).
  - React 19 automatic JSX string escaping for DOM rendering.
- [x] **CRLF / Header Injection**:
  - Express header sanitation and strict URL encoding prevent HTTP response splitting.

---

### A04: Insecure Design
- [x] **Concurrency & Race Conditions**:
  - Concurrency-safe FEFO (First-Expired, First-Out) inventory deduction (`allocateInventoryFefo`). Checks total available unreserved stock across batches before mutating.
  - Negative inventory deductions are strictly prohibited (`batch.onHandQuantity + delta < 0` rejected).
- [x] **Replay Attacks**:
  - 24-hour deterministic SHA-256 request hashing on `Idempotency-Key` headers. Replaying identical checkout requests returns cached response without duplicate inventory deduction or billing hooks.
  - Tampered payloads with reused keys trigger HTTP `409 Conflict`.

---

### A05: Security Misconfiguration
- [x] **Security Headers**:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` (Clickjacking defense)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cross-Origin-Opener-Policy: same-origin-allow-popups` (Supports Google SSO popups)
  - `Cross-Origin-Resource-Policy: same-origin`
- [x] **Crawler & Indexing Protection**:
  - All private application routes (`/account/*`, `/checkout/*`, `/admin/*`) serve static shells containing `<meta name="robots" content="noindex,nofollow">` and Cloudflare `X-Robots-Tag: noindex, nofollow` headers.
- [x] **Information Leaks**:
  - Central `errorHandler` scrubs error envelopes in production. Zero stack traces or internal filenames returned to client.

---

### A06: Vulnerable and Outdated Components
- [x] **Zero-Bloat Dependency Strategy**:
  - Heavy packages (> 50 KB) avoided. Google Sheets sync implemented via direct REST + pure WebCrypto JWTs without `@googleapis/*` (5 MB+ avoided).
  - Regular automated checks: `npm audit` and lockfile integrity.

---

### A07: Identification and Authentication Failures
- [x] **Google SSO Identity Verification**:
  - Google ID tokens verified against Google's live JWKS keys using `jose` with mandatory issuer and audience assertions.
- [x] **Brute-Force & Credential Stuffing Defense**:
  - Sliding-window rate limiter on auth routes (10 requests/minute).
  - 5 consecutive failed authentication attempts from any IP trigger an automatic **15-minute account lockout** (`RateLimitError: 429`).
- [x] **Cookie Security Flags**:
  - Session cookies (`dugdhsar_access`, `dugdhsar_refresh`) configured with `HttpOnly; Secure; SameSite=Lax; Path=/`.

---

### A08: Software and Data Integrity Failures
- [x] **Webhook Signature Verification**:
  - Meta/Instagram Graph API webhooks verified using HMAC-SHA256 signature verification (`X-Hub-Signature-256`) with raw request buffer.
- [x] **Integrity of Cold-Chain Records**:
  - Immutable movement records in `inventory_movements` table track all stock modifications with actor email and timestamp.

---

### A09: Security Logging and Monitoring Failures
- [x] **Append-Only Audit Trail**:
  - Dedicated `audit_logs` store accessible strictly to `super_admin`.
- [x] **Automatic PII Redaction**:
  - Standardized JSON logger automatically redacts passwords, phone numbers (`+91 98****3210`), full email usernames (`s***@example.com`), and authorization tokens before writing to stdout.
- [x] **Request Correlation**:
  - Unique `X-Request-Id` UUID attached to every response for end-to-end trace correlation.

---

### A10: Server-Side Request Forgery (SSRF)
- [x] **Outbound Fetch Filtering**:
  - `validateOutboundUrl` (`server/lib/ssrf.ts`) intercepts all outbound HTTP requests.
  - Prohibits non-HTTPS schemes (blocks `file:`, `ftp:`, `gopher:`, `data:`).
  - Rejects private IP ranges:
    - Loopback: `127.0.0.0/8`, `::1`
    - RFC 1918 Private: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
    - Cloud Metadata IP: `169.254.169.254` (Blocks AWS/GCP/Cloudflare metadata theft)
  - Strict host allowlist enforces approved domains (`oauth2.googleapis.com`, `sheets.googleapis.com`, `graph.instagram.com`).

---

## 2. Automated Penetration Testing Run Command

Execute the complete security regression test suite:

```bash
# Run security and penetration testing suite
npx tsx --test tests/security-edge.test.ts tests/security-penetration.test.ts
```
