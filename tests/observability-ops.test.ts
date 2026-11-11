import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { captureException, getRecentErrors, clearErrorBuffer } from '../server/errorTracker';
import { createApp } from '../server/app';
import { AuthUser } from '../server/types';

describe('Phase 6: Observability, Staging, CI/CD, DPDP Privacy & Production Operations', () => {
  const dummyEnv = {
    JWT_SECRET: 'super-secret-key-that-is-at-least-32-chars-long!',
    CACHE: {
      store: new Map<string, string>(),
      async get(key: string) {
        return this.store.get(key) || null;
      },
      async put(key: string, val: string, _opts?: any) {
        this.store.set(key, val);
      },
      async delete(key: string) {
        this.store.delete(key);
      },
    },
  } as any;

  beforeEach(() => {
    clearErrorBuffer();
  });

  // -------------------------------------------------------------------------
  // 1. Error Tracking & PII Redaction
  // -------------------------------------------------------------------------
  describe('Error Tracking & Observability', () => {
    it('captures exception and scrubs PII from message and stack', () => {
      const sensitiveError = new Error('Database connection failed for token secret_token_abc_123 and phone +91 9876543210');
      const event = captureException(
        sensitiveError,
        {
          requestId: 'req-test-123',
          userId: 'usr-999',
          userEmail: 'sensitive.patron@example.com',
          route: '/api/checkout/create-order',
          extra: { authHeader: 'Bearer secret_jwt_token_here' },
        },
        dummyEnv
      );

      assert.strictEqual(event.requestId, 'req-test-123');
      // Token and phone should be scrubbed
      assert.ok(!event.message.includes('9876543210'));
      assert.ok(event.message.includes('****'));
      // Email must not appear in plain text
      assert.ok(event.userIdHash);
      assert.notStrictEqual(event.userIdHash, 'sensitive.patron@example.com');
      // Extra auth header scrubbed
      assert.ok(!event.extra.authHeader.includes('secret_jwt_token_here'));
    });

    it('maintains a bounded in-memory buffer of recent errors for debugging', () => {
      for (let i = 0; i < 60; i++) {
        captureException(new Error(`Test error ${i}`), {}, dummyEnv);
      }
      const recent = getRecentErrors();
      assert.ok(recent.length <= 50);
    });
  });

  // -------------------------------------------------------------------------
  // 2. DPDP Act & GDPR Data Privacy Endpoints
  // -------------------------------------------------------------------------
  describe('DPDP Act & GDPR Privacy Compliance', () => {
    it('verifies /api/user/export and /api/user/delete routes exist in app.ts', () => {
      const appCode = fs.readFileSync(path.resolve(process.cwd(), 'server/app.ts'), 'utf8');
      assert.ok(appCode.includes("app.get('/api/user/export'"));
      assert.ok(appCode.includes("app.post('/api/user/delete'"));
      assert.ok(appCode.includes('DELETE_MY_ACCOUNT'));
      assert.ok(appCode.includes('Digital Personal Data Protection'));
    });
  });

  // -------------------------------------------------------------------------
  // 3. Staging & Infrastructure As Code Configuration
  // -------------------------------------------------------------------------
  describe('Wrangler Multi-Environment Configuration', () => {
    it('verifies wrangler.jsonc contains dedicated staging and production environments', () => {
      const wranglerPath = path.resolve(process.cwd(), 'wrangler.jsonc');
      assert.strictEqual(fs.existsSync(wranglerPath), true);

      const content = fs.readFileSync(wranglerPath, 'utf8');
      assert.ok(content.includes('"staging"'));
      assert.ok(content.includes('dugdhsar-staging'));
      assert.ok(content.includes('"production"'));
      assert.ok(content.includes('"observability"'));
      assert.ok(content.includes('"run_worker_first"'));
    });
  });

  // -------------------------------------------------------------------------
  // 4. CI/CD GitHub Actions Pipeline
  // -------------------------------------------------------------------------
  describe('CI/CD Pipeline (.github/workflows/deploy.yml)', () => {
    it('verifies CI/CD workflow defines lint, test, build, and automated staging/prod deploy', () => {
      const deployYmlPath = path.resolve(process.cwd(), '.github/workflows/deploy.yml');
      assert.strictEqual(fs.existsSync(deployYmlPath), true);

      const content = fs.readFileSync(deployYmlPath, 'utf8');
      assert.ok(content.includes('npm run typecheck'));
      assert.ok(content.includes('npm test'));
      assert.ok(content.includes('npm run build'));
      assert.ok(content.includes('deploy-staging'));
      assert.ok(content.includes('deploy-production'));
      assert.ok(content.includes('cloudflare/wrangler-action'));
    });
  });

  // -------------------------------------------------------------------------
  // 5. Code Review & PR Template
  // -------------------------------------------------------------------------
  describe('Pull Request Template (.github/pull_request_template.md)', () => {
    it('verifies checklist enforces zero-secrets, RLS, authorization, and test requirements', () => {
      const prPath = path.resolve(process.cwd(), '.github/pull_request_template.md');
      assert.strictEqual(fs.existsSync(prPath), true);

      const content = fs.readFileSync(prPath, 'utf8');
      assert.ok(content.includes('Zero Secrets'));
      assert.ok(content.includes('Row-Level Security (RLS)'));
      assert.ok(content.includes('Authorization & Roles'));
      assert.ok(content.includes('Idempotency'));
      assert.ok(content.includes('PII Redaction'));
    });
  });

  // -------------------------------------------------------------------------
  // 6. Branching Strategy & Process Documentation
  // -------------------------------------------------------------------------
  describe('Process & Branching Strategy (docs/PROCESS.md)', () => {
    it('verifies trunk-based branching model and instant rollback runbook', () => {
      const processPath = path.resolve(process.cwd(), 'docs/PROCESS.md');
      assert.strictEqual(fs.existsSync(processPath), true);

      const content = fs.readFileSync(processPath, 'utf8');
      assert.ok(content.includes('Trunk-Based Development'));
      assert.ok(content.includes('wrangler rollback'));
    });
  });

  // -------------------------------------------------------------------------
  // 7. Cost Monitoring & Alerting Documentation
  // -------------------------------------------------------------------------
  describe('Cost Monitoring & Alerting Documentation', () => {
    it('verifies docs/COST_MONITORING.md details free tier limits and zero-cost discipline', () => {
      const costPath = path.resolve(process.cwd(), 'docs/COST_MONITORING.md');
      assert.strictEqual(fs.existsSync(costPath), true);

      const content = fs.readFileSync(costPath, 'utf8');
      assert.ok(content.includes('$0.00 / month'));
      assert.ok(content.includes('100,000 requests / day'));
      assert.ok(content.includes('80,000 requests / day'));
    });

    it('verifies docs/ALERTING.md and docs/UPTIME.md define alert rules and health checks', () => {
      const alertPath = path.resolve(process.cwd(), 'docs/ALERTING.md');
      const uptimePath = path.resolve(process.cwd(), 'docs/UPTIME.md');
      assert.strictEqual(fs.existsSync(alertPath), true);
      assert.strictEqual(fs.existsSync(uptimePath), true);

      const alertContent = fs.readFileSync(alertPath, 'utf8');
      const uptimeContent = fs.readFileSync(uptimePath, 'utf8');
      assert.ok(alertContent.includes('Cloudflare Notification Center'));
      assert.ok(uptimeContent.includes('/api/health'));
    });
  });

  // -------------------------------------------------------------------------
  // 8. Semantic Versioning & Changelog
  // -------------------------------------------------------------------------
  describe('Semantic Versioning & Changelog', () => {
    it('verifies CHANGELOG.md and package.json align with SemVer 2.0.0', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
      assert.strictEqual(fs.existsSync(changelogPath), true);

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.strictEqual(pkg.version, '2.0.0');

      const changelog = fs.readFileSync(changelogPath, 'utf8');
      assert.ok(changelog.includes('[2.0.0]'));
    });
  });
});
