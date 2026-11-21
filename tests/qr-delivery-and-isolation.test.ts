import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Server } from 'node:http';
import {
  generateUniqueQrToken,
  generateQrMatrix,
  buildDeliveryVerifyUrl,
  parseQrPayload,
} from '../src/lib/qrCode';
import {
  DEMO_PROFILES,
  DEMO_ADMIN_USERS,
  DEMO_ADDRESSES,
} from '../src/data/seedData';
import { createApp } from '../server/app';
import {
  resetStaffRegistryForTests,
  MAX_ENTERPRISE_STAFF_ACCOUNTS,
} from '../server/services/staffAccessRegistry';

describe('QR Delivery Verification Engine & Matrix Encoder', () => {
  it('generates cryptographically unique QR tokens with DQR_ prefix', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const tok = generateUniqueQrToken(`ORD-${1000 + i}`);
      assert.ok(tok.startsWith('DQR_'));
      assert.ok(tok.length >= 28);
      tokens.add(tok);
    }
    assert.equal(tokens.size, 50);
  });

  it('generates valid square odd-dimension ISO/IEC 18004 QR matrices with finder patterns', () => {
    const url = buildDeliveryVerifyUrl(
      'https://dugdhsar.in',
      'DUG-901234',
      'DQR_1234_abcdef0123456789abcdef01',
      '2026-11-16'
    );
    const matrix = generateQrMatrix(url);
    const size = matrix.length;

    assert.ok(size >= 21);
    assert.equal(size % 2, 1);
    assert.ok(matrix.every((row) => row.length === size));

    // Top-left 7x7 finder outer ring must be dark (true) and inner 5x5 ring light (false)
    assert.equal(matrix[0][0], true);
    assert.equal(matrix[0][6], true);
    assert.equal(matrix[6][0], true);
    assert.equal(matrix[1][1], false);
    assert.equal(matrix[3][3], true);

    // Top-right & bottom-left finder corners must be dark
    assert.equal(matrix[0][size - 1], true);
    assert.equal(matrix[size - 1][0], true);
  });

  it('parses URL, JSON, and pipe-delimited QR scan payloads cleanly', () => {
    const builtUrl = buildDeliveryVerifyUrl(
      'https://dugdhsar.in',
      'DUG-555111',
      'DQR_5111_abc123def4567890abc12345',
      '2026-11-16'
    );
    const fromUrl = parseQrPayload(builtUrl);
    assert.deepEqual(fromUrl, {
      orderId: 'DUG-555111',
      token: 'DQR_5111_abc123def4567890abc12345',
      deliveryDate: '2026-11-16',
    });

    const fromPipe = parseQrPayload('SUB-DAILY-1|DQR_SUB1_token9876543210|2026-11-17');
    assert.deepEqual(fromPipe, {
      orderId: 'SUB-DAILY-1',
      token: 'DQR_SUB1_token9876543210',
      deliveryDate: '2026-11-17',
    });

    const fromJson = parseQrPayload(
      JSON.stringify({
        orderId: 'DUG-777222',
        token: 'DQR_7222_xyz0987654321',
        deliveryDate: '2026-11-18',
      })
    );
    assert.deepEqual(fromJson, {
      orderId: 'DUG-777222',
      token: 'DQR_7222_xyz0987654321',
      deliveryDate: '2026-11-18',
    });

    assert.equal(parseQrPayload('invalid-random-text'), null);
  });
});

describe('Doorstep QR Verification Backend API (/api/deliveries/verify-qr)', () => {
  const app = createApp();
  let server: Server | null = null;
  let baseUrl = '';

  const ensureServer = async () => {
    if (server) return baseUrl;
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server!.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
    return baseUrl;
  };

  after(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('creates an order with a unique qrToken and allows instant doorstep QR verification', async () => {
    const url = await ensureServer();

    const createRes = await fetch(`${url}/api/checkout/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        'Idempotency-Key': `qr-test-${Date.now()}`,
      },
      body: JSON.stringify({
        customer: {
          id: 'usr-qr-test',
          fullName: 'Test Patron',
          email: 'qrpatron@example.com',
          phone: '+91 9876501234',
        },
        address: {
          fullName: 'Test Patron',
          phone: '+91 9876501234',
          email: 'qrpatron@example.com',
          flatNo: '12',
          street: 'Barghat Road',
          city: 'Seoni',
          state: 'Madhya Pradesh',
          pincode: '480661',
        },
        items: [{ variantId: 'wm-1l', quantity: 1 }],
        paymentMethod: 'cod',
        deliverySlot: '5:30 AM - 7:00 AM',
      }),
    });

    assert.equal(createRes.status, 200);
    const created: any = await createRes.json();
    assert.equal(created.success, true);
    assert.ok(created.order?.id);
    assert.ok(created.order?.qrToken?.startsWith('DQR_'));
    assert.equal(created.order?.status, 'confirmed');
    assert.equal(created.order?.paymentStatus, 'due_on_delivery');

    const { id: orderId, qrToken } = created.order;

    // 1. Reject invalid token format (too short -> 400)
    const shortRes = await fetch(`${url}/api/deliveries/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ orderId, token: 'bad' }),
    });
    assert.equal(shortRes.status, 400);

    // 2. Reject tampered/wrong token -> 403
    const wrongRes = await fetch(`${url}/api/deliveries/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ orderId, token: 'DQR_WRONG_TOKEN_1234567890' }),
    });
    assert.equal(wrongRes.status, 403);

    // 3. Reject unknown order -> 404
    const missingRes = await fetch(`${url}/api/deliveries/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ orderId: 'DUG-NONEXISTENT', token: qrToken }),
    });
    assert.equal(missingRes.status, 404);

    // 4. Verify with valid QR token -> 200, instant status=delivered + COD captured
    const verifyRes = await fetch(`${url}/api/deliveries/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({
        orderId,
        token: qrToken,
        partnerName: 'Seoni Morning Rider',
      }),
    });
    assert.equal(verifyRes.status, 200);
    const verified: any = await verifyRes.json();
    assert.equal(verified.success, true);
    assert.equal(verified.alreadyDelivered, false);
    assert.equal(verified.verifiedBy, 'Seoni Morning Rider');
    assert.ok(verified.verifiedAt);
    assert.equal(verified.order.status, 'delivered');
    assert.equal(verified.order.paymentStatus, 'captured');
    assert.equal(verified.order.qrVerifiedBy, 'Seoni Morning Rider');

    // 5. Repeat scan on /api/orders/:id/verify-delivery -> idempotent alreadyDelivered=true
    const repeatRes = await fetch(`${url}/api/orders/${orderId}/verify-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ token: qrToken, partnerName: 'Another Partner' }),
    });
    assert.equal(repeatRes.status, 200);
    const repeated: any = await repeatRes.json();
    assert.equal(repeated.success, true);
    assert.equal(repeated.alreadyDelivered, true);
    assert.equal(repeated.verifiedBy, 'Seoni Morning Rider');
  });
});

describe('Google-Only Auth, Zero Demo Data & Focus Mode Verification', () => {
  it('ensures DEMO_PROFILES, DEMO_ADMIN_USERS, and DEMO_ADDRESSES are completely empty', () => {
    assert.equal(DEMO_PROFILES.length, 0);
    assert.equal(DEMO_ADMIN_USERS.length, 0);
    assert.equal(DEMO_ADDRESSES.length, 0);
  });

  it('removes SVG from the Navbar header hamburger menu button (Focus Mode edit)', () => {
    const navbarSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/Navbar.tsx'),
      'utf8'
    );
    const btnMatch = navbarSrc.match(
      /<button[^>]*aria-label="Navigation Menu"[^>]*>([\s\S]*?)<\/button>/
    );
    assert.ok(btnMatch, 'Header Navigation Menu button must exist');
    assert.ok(!btnMatch[1].includes('<svg'), 'Header menu button must not contain <svg>');
    assert.ok(btnMatch[1].includes('<span'), 'Header menu button uses CSS bar spans');
  });

  it('removes Supabase Auth forms and demo login data from all auth entrypoints', () => {
    const authFiles = [
      'src/pages/account/LoginPage.tsx',
      'src/pages/account/RegisterPage.tsx',
      'src/pages/admin/AdminLoginPage.tsx',
      'src/pages/manager/ManagerLoginPage.tsx',
      'src/pages/dealer/DealerPortalPage.tsx',
      'src/components/GoogleLoginModal.tsx',
      'src/components/AuthModal.tsx',
      'src/lib/auth.ts',
    ];

    const forbiddenPatterns = [
      /customer@dugdhsar\.in/i,
      /1-Tap Patron/i,
      /1-Tap Demo/i,
      /switchUserPersona/,
      /Sign in with Supabase/i,
      /@supabase\/supabase-js/,
    ];

    for (const relPath of authFiles) {
      const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
      for (const pattern of forbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `File ${relPath} must not match forbidden pattern ${pattern}`
        );
      }
    }
  });
});

describe('Strict Maximum 3 Enterprise Accounts (Admin Console, Manager Operations, Dealer B2B Supply)', () => {
  const app = createApp();
  let server: Server | null = null;
  let baseUrl = '';

  const ensureServer = async () => {
    if (server) return baseUrl;
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server!.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
    return baseUrl;
  };

  after(async () => {
    resetStaffRegistryForTests();
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
  });

  it('blocks unauthorized users from Admin, Manager & Dealer portals and hard-caps at 3 accounts total', async () => {
    resetStaffRegistryForTests();
    assert.equal(MAX_ENTERPRISE_STAFF_ACCOUNTS, 3);
    const url = await ensureServer();

    const headersBase = {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    };

    // 1. Public limit check shows 1/3 occupied initially (Primary Owner Admin)
    const limitRes = await fetch(`${url}/api/staff/limits`);
    assert.equal(limitRes.status, 200);
    const limitData: any = await limitRes.json();
    assert.equal(limitData.maxAccounts, 3);
    assert.equal(limitData.activeCount, 1);

    // 2. Random stranger cannot log into Admin, Manager, or Dealer portals (403 Forbidden)
    for (const portalContext of ['admin', 'manager', 'dealer'] as const) {
      const attackerRes = await fetch(`${url}/api/auth/google`, {
        method: 'POST',
        headers: headersBase,
        body: JSON.stringify({
          idToken: `sim_google_token_${portalContext}`,
          email: 'random.stranger@gmail.com',
          name: 'Random Stranger',
          portalContext,
        }),
      });
      assert.equal(
        attackerRes.status,
        403,
        `Unauthorized email must be blocked (403) on ${portalContext} portal`
      );
    }

    // 3. Random user CAN still log into normal customer portal as customer
    const customerRes = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_cust',
        email: 'random.stranger@gmail.com',
        name: 'Normal Customer',
        portalContext: 'customer',
      }),
    });
    assert.equal(customerRes.status, 200);
    const custJson: any = await customerRes.json();
    assert.equal(custJson.user.role, 'customer');

    // 4. Primary Owner Admin logs into Admin Console (Slot 1/3)
    const adminLoginRes = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_owner',
        email: 'sumitpawar65005@gmail.com',
        name: 'Primary Owner',
        portalContext: 'admin',
      }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginData: any = await adminLoginRes.json();
    assert.equal(adminLoginData.user.role, 'super_admin');
    const adminToken = adminLoginData.token;
    assert.ok(adminToken);

    const adminHeaders = {
      ...headersBase,
      Authorization: `Bearer ${adminToken}`,
    };

    // 5. Normal customer token cannot inspect or mutate /api/staff/slots
    const custStaffAttempt = await fetch(`${url}/api/staff/slots`, {
      headers: {
        Authorization: `Bearer ${custJson.token}`,
      },
    });
    assert.equal(custStaffAttempt.status, 403);

    // 6. Admin assigns 1 Manager Operations email (Slot 2/3)
    const addManagerRes = await fetch(`${url}/api/staff/slots`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        role: 'manager',
        email: 'ops.manager@gmail.com',
        name: 'Plant Ops Manager',
      }),
    });
    assert.equal(addManagerRes.status, 200);
    const addManagerData: any = await addManagerRes.json();
    assert.equal(addManagerData.activeCount, 2);

    // 7. Assigning a 2nd Manager email without removing/replacing is rejected (409 Conflict)
    const secondManagerRes = await fetch(`${url}/api/staff/slots`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        role: 'manager',
        email: 'extra.manager@gmail.com',
        name: 'Extra Manager',
      }),
    });
    assert.equal(secondManagerRes.status, 409);

    // 8. Admin assigns 1 Dealer B2B Supply email (Slot 3/3)
    const addDealerRes = await fetch(`${url}/api/staff/slots`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        role: 'dealer',
        email: 'seoni.dealer@gmail.com',
        name: 'Seoni B2B Dealer',
      }),
    });
    assert.equal(addDealerRes.status, 200);
    const addDealerData: any = await addDealerRes.json();
    assert.equal(addDealerData.activeCount, 3);

    // 9. Attempting to add an extra Admin slot fails (403 Forbidden)
    const extraAdminRes = await fetch(`${url}/api/staff/slots`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        role: 'admin',
        email: 'second.admin@gmail.com',
        name: 'Second Admin',
      }),
    });
    assert.equal(extraAdminRes.status, 403);

    // 10. Authorized Manager logs into Manager Operations ONLY (blocked from Admin & Dealer!)
    const mgrOk = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_mgr',
        email: 'ops.manager@gmail.com',
        portalContext: 'manager',
      }),
    });
    assert.equal(mgrOk.status, 200);

    const mgrBlockedAdmin = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_mgr2',
        email: 'ops.manager@gmail.com',
        portalContext: 'admin',
      }),
    });
    assert.equal(mgrBlockedAdmin.status, 403);

    // 11. Authorized Dealer logs into Dealer B2B Supply ONLY (blocked from Admin & Manager!)
    const dlrOk = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_dlr',
        email: 'seoni.dealer@gmail.com',
        portalContext: 'dealer',
      }),
    });
    assert.equal(dlrOk.status, 200);

    const dlrBlockedManager = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_dlr2',
        email: 'seoni.dealer@gmail.com',
        portalContext: 'manager',
      }),
    });
    assert.equal(dlrBlockedManager.status, 403);

    // 12. Any 4th person trying Admin/Manager/Dealer is strictly blocked (403)
    for (const portalContext of ['admin', 'manager', 'dealer'] as const) {
      const fourthRes = await fetch(`${url}/api/auth/google`, {
        method: 'POST',
        headers: headersBase,
        body: JSON.stringify({
          idToken: `sim_google_token_4th_${portalContext}`,
          email: 'fourth.person@gmail.com',
          portalContext,
        }),
      });
      assert.equal(fourthRes.status, 403);
    }

    // 13. Revoking Manager drops activeCount to 2 and blocks ops.manager@gmail.com immediately
    const revokeRes = await fetch(`${url}/api/staff/slots/manager`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert.equal(revokeRes.status, 200);
    const revokeData: any = await revokeRes.json();
    assert.equal(revokeData.activeCount, 2);

    const revokedLogin = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: headersBase,
      body: JSON.stringify({
        idToken: 'sim_google_token_mgr_revoked',
        email: 'ops.manager@gmail.com',
        portalContext: 'manager',
      }),
    });
    assert.equal(revokedLogin.status, 403);
  });
});

describe('FSSAI Licence & Logo Verification', () => {
  it('embeds official FSSAI Reg. No. 21426230002154, logo image, and PDF link in FooterSection & site config', () => {
    const footerSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/FooterSection.tsx'),
      'utf8'
    );
    const siteCfgSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/config/site.ts'),
      'utf8'
    );
    const pressSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/PressCertificationsSection.tsx'),
      'utf8'
    );

    assert.ok(footerSrc.includes('21426230002154'));
    assert.ok(footerSrc.includes('/assets/aistudio/image_7a8553d9.png'));
    assert.ok(footerSrc.includes('/assets/aistudio/certificate-127945312_copy_464ac32d.pdf'));
    assert.ok(footerSrc.includes('Food Safety Assayed · Pure A2 Dairy'));
    assert.ok(siteCfgSrc.includes('21426230002154'));
    assert.ok(pressSrc.includes('21426230002154'));
    assert.ok(pressSrc.includes('/assets/aistudio/image_7a8553d9.png'));
  });
});

describe('Cloudflare Workers Auth & Real Instagram Connection Verification', () => {
  let prodServer: Server | null = null;
  let prodBaseUrl = '';

  const ensureProdServer = async () => {
    if (prodServer) return prodBaseUrl;
    const prodApp = createApp({
      ENVIRONMENT: 'production',
      GOOGLE_CLIENT_ID: '1234567890-testclient.apps.googleusercontent.com',
      JWT_SECRET: 'super_secure_cloudflare_jwt_secret_key_for_tests_32bytes',
      IG_ACCESS_TOKEN: 'EAA_FAKE_SECRET_TOKEN_SHOULD_NEVER_LEAK_123456789',
    });
    await new Promise<void>((resolve) => {
      prodServer = prodApp.listen(0, '127.0.0.1', () => {
        const addr = prodServer!.address();
        if (addr && typeof addr === 'object') {
          prodBaseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
    return prodBaseUrl;
  };

  after(async () => {
    if (prodServer) {
      prodServer.closeAllConnections?.();
      await new Promise<void>((resolve) => prodServer!.close(() => resolve()));
      prodServer = null;
    }
  });

  it('exposes public /api/auth/config and /api/instagram/status without leaking any secrets', async () => {
    const url = await ensureProdServer();

    const cfgRes = await fetch(`${url}/api/auth/config`);
    assert.equal(cfgRes.status, 200);
    const cfgText = await cfgRes.text();
    assert.ok(!cfgText.includes('super_secure_cloudflare_jwt_secret'), 'JWT_SECRET must never leak');
    const cfg: any = JSON.parse(cfgText);
    assert.equal(cfg.googleClientId, '1234567890-testclient.apps.googleusercontent.com');
    assert.equal(cfg.googleOAuthEnabled, true);
    assert.equal(cfg.jwtSecretConfigured, true);
    assert.equal(cfg.environment, 'production');

    const igRes = await fetch(`${url}/api/instagram/status`);
    assert.equal(igRes.status, 200);
    const igText = await igRes.text();
    assert.ok(!igText.includes('EAA_FAKE_SECRET_TOKEN'), 'IG_ACCESS_TOKEN must never leak');
    const ig: any = JSON.parse(igText);
    assert.equal(ig.success, true);
    assert.equal(ig.tokenConfigured, true);
    assert.equal(ig.tokenType, 'facebook_graph_eaa');
  });

  it('rejects simulated tokens in production when GOOGLE_CLIENT_ID is configured', async () => {
    const url = await ensureProdServer();
    const res = await fetch(`${url}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://dugdhsar-og.workers.dev',
        'X-Forwarded-For': '203.0.113.55',
      },
      body: JSON.stringify({
        idToken: 'sim_google_token_attack',
        email: 'sumitpawar65005@gmail.com',
        portalContext: 'admin',
      }),
    });
    assert.equal(res.status, 401);
  });

  it('configures single-source-of-truth CSP for Google Sign-In, Google Maps & Instagram CDN without invalid wildcards or wildcard API CORS', () => {
    const headersSrc = fs.readFileSync(path.resolve(process.cwd(), 'public/_headers'), 'utf8');
    const cspSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/config/csp.ts'), 'utf8');
    const prerenderSrc = fs.readFileSync(path.resolve(process.cwd(), 'scripts/prerender.ts'), 'utf8');

    // No invalid wildcard 'scontent*.cdninstagram.com' anywhere
    assert.ok(!headersSrc.includes('scontent*.cdninstagram.com'));
    assert.ok(!cspSrc.includes('scontent*.cdninstagram.com'));
    assert.ok(!prerenderSrc.includes('scontent*.cdninstagram.com'));

    // Valid Instagram img-src & media-src wildcards
    assert.ok(headersSrc.includes('https://*.cdninstagram.com'));
    assert.ok(headersSrc.includes('https://*.fbcdn.net'));
    assert.ok(headersSrc.includes('media-src') && headersSrc.includes('https://*.cdninstagram.com'));

    // Google Maps & existing frame-src entries preserved
    assert.ok(headersSrc.includes('https://maps.google.com'));
    assert.ok(headersSrc.includes('https://www.google.com'));
    assert.ok(headersSrc.includes('https://accounts.google.com'));
    assert.ok(headersSrc.includes('https://challenges.cloudflare.com'));
    assert.ok(headersSrc.includes('https://api.razorpay.com'));

    // Prerender uses single source of truth instead of duplicating CSP
    assert.ok(prerenderSrc.includes('buildCloudflareHeadersFile'));
    assert.ok(!headersSrc.includes('Access-Control-Allow-Origin: *'));

    const workerSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/worker.ts'), 'utf8');
    assert.ok(!workerSrc.includes('app.use(cors())'), 'Worker must not use wildcard cors()');
    assert.ok(workerSrc.includes('refreshInstagramToken'));
  });

  it('POST /api/vitals accepts text/plain sendBeacon, JSON payloads, and returns 204 even on invalid payloads', async () => {
    const url = await ensureProdServer();

    // 1. text/plain sendBeacon payload (like navigator.sendBeacon with string)
    const beaconRes = await fetch(`${url}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        name: 'LCP',
        value: 1420.5,
        rating: 'good',
        id: 'v1-test-lcp',
        navigationType: 'navigate',
        delta: 1420.5,
        path: '/',
        extraFieldIgnored: true,
      }),
    });
    assert.equal(beaconRes.status, 204);

    // 2. application/json valid payload (INP / CLS)
    const jsonRes = await fetch(`${url}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'CLS',
        value: 0.02,
        rating: 'good',
        navigationType: 'reload',
      }),
    });
    assert.equal(jsonRes.status, 204);

    // 3. Invalid payload / malformed JSON must STILL return 204 (never 400 in browser)
    const badSchemaRes = await fetch(`${url}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TTFB', value: -5 }),
    });
    assert.equal(badSchemaRes.status, 204);

    const badJsonRes = await fetch(`${url}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{not-valid-json',
    });
    assert.equal(badJsonRes.status, 204);
  });

  it('errorHandler emits one sanitized JSON console.error line (<=8 stack lines) and keeps prod client response generic', async () => {
    const { errorHandler } = await import('../server/middleware/errorHandler');
    const { getMissingRequiredEnvKeys, REQUIRED_PRODUCTION_ENV_KEYS } = await import('../server/env');

    // Verify single-source missing env names check (never returns values)
    const missingAll = getMissingRequiredEnvKeys({});
    assert.deepEqual(missingAll, [...REQUIRED_PRODUCTION_ENV_KEYS]);
    const missingPartial = getMissingRequiredEnvKeys({
      JWT_SECRET: 'valid_32_char_secret_key_for_prod_test_1234',
      GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
    });
    assert.deepEqual(missingPartial, ['IG_ACCESS_TOKEN']);

    // Capture console.error output from errorHandler
    const capturedErrors: string[] = [];
    const origError = console.error;
    console.error = (...args: any[]) => {
      capturedErrors.push(args.map(String).join(' '));
    };

    let statusCode = 0;
    let bodySent: any = null;
    const headers: Record<string, string> = {};
    try {
      const rootCause = new Error('JWKS fetch failed for user alice@example.com phone +91 9876543210');
      const err = new Error('Crash with Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123456', {
        cause: rootCause,
      });
      err.stack = Array.from({ length: 15 }, (_, i) => `    at frame${i} (/app/server/auth.ts:${i + 1}:1)`).join('\n');

      const mockReq = {
        id: 'req-test-500',
        originalUrl: '/api/auth/google?debug=1',
        url: '/api/auth/google',
        method: 'POST',
        env: { ENVIRONMENT: 'production' },
      } as any;
      const mockRes = {
        getHeader: () => undefined,
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: any) => {
              bodySent = payload;
            },
          };
        },
      } as any;

      errorHandler(err, mockReq, mockRes, () => {});
    } finally {
      console.error = origError;
    }

    assert.equal(statusCode, 500);
    assert.equal(bodySent?.error?.message, 'An unexpected error occurred. Please contact support with your Request ID.');
    assert.equal(bodySent?.requestId || headers['X-Request-Id'], 'req-test-500');

    // First console.error call must be the single-line JSON error record
    const parsedLog = JSON.parse(capturedErrors[0]);
    assert.equal(parsedLog.requestId, 'req-test-500');
    assert.equal(parsedLog.route, '/api/auth/google');
    assert.equal(parsedLog.method, 'POST');
    assert.equal(parsedLog.errorName, 'Error');
    assert.ok(!parsedLog.message.includes('eyJhbGciOiJIUzI1NiJ9'), 'JWT must be redacted');
    assert.ok(!parsedLog.cause.includes('alice@example.com'), 'Full email must be redacted');
    assert.ok(!parsedLog.cause.includes('9876543210'), 'Full phone must be redacted');
    assert.ok(parsedLog.stack.split('\n').length <= 8, 'Stack must be capped at 8 lines');
  });
});





