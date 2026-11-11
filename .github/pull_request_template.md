## DUGDHSAR Production Engineering PR Checklist

### 1. Summary of Changes
- **Feature/Fix Description**:
- **Related Phase / Issue**:

---

### 2. Mandatory Security & Reliability Checklist (Must Check All)
- [ ] **Zero Secrets**: No API keys, service account JSONs, or JWT secrets written in code, logs, or git. (Secrets only in Cloudflare `.dev.vars` / Worker Secrets).
- [ ] **Row-Level Security (RLS)**: Any order, subscription, or customer data query is scoped strictly through `repoForUser(user)`.
- [ ] **Authorization & Roles**: Endpoints verify user role (`super_admin`, `dealer`, `customer`) using `requireRole` middleware.
- [ ] **Input Validation**: All payloads validated with Zod schemas using `.strict()` to prevent mass assignment.
- [ ] **Idempotency**: All payment or mutating checkout operations support `Idempotency-Key` headers.
- [ ] **PII Redaction**: No plain passwords, phone numbers, or tokens logged in `logger.info` or `logger.error`.
- [ ] **Cloudflare Free-Plan Guard**: Changes do not introduce heavy dependencies (> 50 KB) or exceed 50ms CPU execution limits.

---

### 3. Verification & Testing
- [ ] `npm run typecheck` passes with 0 errors.
- [ ] `npm test` passes 100% of automated unit & integration test suites.
- [ ] `npm run build` succeeds (31 public static HTML pages prerendered).
- [ ] Manual verification step documented in PR description.
