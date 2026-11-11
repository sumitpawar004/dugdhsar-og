# DUGDHSAR Technical Debt & Architectural Decisions Log

This document records deliberate engineering trade-offs, rationale, constraints, and the explicit business triggers required to revisit them.

---

## 1. Active Architectural Trade-Offs

### 1. In-Memory Master Fallback + Cloudflare D1 Relational Engine
- **Current State**: API keeps in-memory state for lightning-fast reads (< 2ms) and writes to D1 SQLite / Google Sheets asynchronously.
- **Rationale**: Keeps request latency within the Cloudflare Worker 50ms CPU limit on the Free Plan. Avoids connection overhead.
- **Trade-off**: High-frequency cold starts across multiple global Cloudflare data centers could theoretically see slight isolate divergence if edge KV is not warmed up.
- **Trigger to Revisit**: When sustained daily order volume exceeds **500 orders/day**, graduate fully to write-through D1 queries with prepared statements.

---

### 2. Single-Worker Monolith vs Microservices
- **Current State**: Single Cloudflare Worker running Express via `httpServerHandler`, serving `./dist` static assets and `/api/*` routes.
- **Rationale**: Cloudflare Free plan allows only limited Worker registrations. Serving public pages as pre-rendered static HTML (`dist/*.html`) is 100% free with unlimited bandwidth.
- **Trade-off**: API and SSR/prerender tools share one build pipeline.
- **Trigger to Revisit**: Only if the Worker bundled code exceeds the 1 MB compressed bundle limit (currently ~200 KB).

---

### 3. Google SSO Only (Zero Password Hashing in Code)
- **Current State**: Patrons and Admins authenticate strictly via Google Identity Services (`jose` ID token verification).
- **Rationale**: Completely eliminates password storage risks, salting requirements, credential stuffing, and forgotten password resets.
- **Trade-off**: Patrons must possess a Google account.
- **Trigger to Revisit**: If customer support feedback indicates > 5% of patrons in Seoni prefer SMS OTP login via Twilio / MSG91.

---

### 4. Sliding-Window Rate Limiting with KV Storage
- **Current State**: Pure WebCrypto in-memory sliding window backed by Workers KV for distributed rate limiting and account lockout.
- **Rationale**: Avoids paid third-party Redis subscriptions (e.g. Upstash) while staying within free tier.
- **Trade-off**: KV write propagation across edge datacenters has ~60-second eventual consistency.
- **Trigger to Revisit**: When API traffic exceeds **50,000 requests/day** or active brute force attacks require sub-second cross-datacenter sync.

---

### 5. Client-Side Google Sheets REST Integration
- **Current State**: Google Sheets REST API sync authenticated via pure WebCrypto JWTs generated from service account credentials.
- **Rationale**: Zero `googleapis` npm package bloat (which is > 5 MB). Bundle overhead kept under 2 KB.
- **Trade-off**: Max rows per single append batch is capped at 100 to avoid request timeout.
- **Trigger to Revisit**: When daily transaction volume requires continuous streaming export to Google BigQuery or Cloud SQL.

---

## 2. Technical Debt Review Cadence
- **Frequency**: End of each quarter or whenever a business volume trigger above is reached.
- **Owner**: Principal Software Engineer & Gaushala Operations Lead.
