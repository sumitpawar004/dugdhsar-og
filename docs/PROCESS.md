# DUGDHSAR Engineering Process & Branching Strategy

This document defines the trunk-based engineering workflow, branch conventions, PR review rules, and production deployment policies for the Dugdhsar cold-chain platform.

---

## 1. Branching Model: Trunk-Based Development

We use **Trunk-Based Development** with short-lived feature branches:

```
feature/fefo-cold-chain  ──┐
fix/idempotency-key      ──┼──> PR ──> CI (Typecheck + Test + Build) ──> Merge to [main] ──> Auto-Deploy (Production)
chore/update-pincodes    ──┘
```

### Branch Naming Conventions:
- `feat/<short-description>`: New capabilities or endpoints (e.g. `feat/morning-slot-cutoff`)
- `fix/<short-description>`: Bug fixes and security patches (e.g. `fix/csrf-origin-check`)
- `perf/<short-description>`: Bundle size reduction or caching optimization (e.g. `perf/catalog-kv-ttl`)
- `docs/<short-description>`: Documentation updates (e.g. `docs/api-spec`)

---

## 2. Pull Request & Deployment Pipeline

1. **Local Pre-Flight Checks**:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
2. **Open PR against `main`**:
   - Complete `.github/pull_request_template.md`.
   - CI triggers `.github/workflows/deploy.yml` automatically.
3. **Merge Requirement**:
   - 100% green CI test suites.
   - Zero linter and TypeScript warnings.
4. **Automated Production Deployment**:
   - Merges to `main` automatically deploy to the Cloudflare Worker via Wrangler.

---

## 3. Instant Rollback Runbook

If a critical defect is identified post-deployment:

```bash
# List recent Cloudflare deployments with version IDs
wrangler deployments list

# Instantly rollback to previous stable version (< 2 seconds)
wrangler rollback <DEPLOYMENT_ID>
```
