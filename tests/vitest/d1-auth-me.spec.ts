import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import * as jose from 'jose';
import { createTestD1, LocalTestD1Database } from './helpers/mockD1';
import { createApp } from '../../server/app';
import {
  createSessionJwt,
  clearInMemoryRevokedJtiCache,
} from '../../server/auth';
import {
  upsertGoogleUser,
  anonymizeUserAccount,
  sha256Hex,
} from '../../server/db';
import { WorkerEnv } from '../../server/types';

async function startTestServer(env: WorkerEnv): Promise<{ server: Server; baseUrl: string }> {
  const app = createApp(() => env);
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

describe('Phase 2 D1 Auth, JWT Claims, Revocation, /api/me & Address IDOR Protection', () => {
  let db: LocalTestD1Database;
  let env: WorkerEnv;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    clearInMemoryRevokedJtiCache();
    db = createTestD1();
    env = {
      DB: db,
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test_super_secret_jwt_signing_key_32_bytes_min',
      SUPER_ADMIN_EMAILS: '  Owner@DugdhSar.in , second.admin@dugdhsar.in ',
      DEALER_EMAILS: 'seoni.bootstrap@dugdhsar.in',
    };
    const started = await startTestServer(env);
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
    clearInMemoryRevokedJtiCache();
  });

  it('creates user on first login, includes sub/role/jti in JWT, and skips needless D1 writes on unchanged repeat login', async () => {
    const first = await upsertGoogleUser(db, env, {
      googleSub: 'google_sub_first_001',
      email: 'Priya.Patel@Example.COM',
      name: 'Priya Patel',
      avatarUrl: 'https://example.com/priya.png',
    });

    expect(first.created).toBe(true);
    expect(first.updated).toBe(true);
    expect(first.reactivated).toBe(false);
    expect(first.user.email).toBe('priya.patel@example.com');
    expect(first.user.role).toBe('customer');

    const expectedHash = await sha256Hex('priya.patel@example.com');
    const row1 = await db
      .prepare(`SELECT id, google_sub, email, email_hash, name, avatar_url, updated_at FROM users WHERE id = ?`)
      .bind(first.user.id)
      .first<{
        id: string;
        google_sub: string;
        email: string;
        email_hash: string;
        name: string;
        avatar_url: string;
        updated_at: string;
      }>();

    expect(row1?.google_sub).toBe('google_sub_first_001');
    expect(row1?.email).toBe('priya.patel@example.com');
    expect(row1?.email_hash).toBe(expectedHash);

    // Repeat login with identical fields MUST NOT trigger a needless D1 UPDATE
    const second = await upsertGoogleUser(db, env, {
      googleSub: 'google_sub_first_001',
      email: 'priya.patel@example.com',
      name: 'Priya Patel',
      avatarUrl: 'https://example.com/priya.png',
    });

    expect(second.created).toBe(false);
    expect(second.updated).toBe(false);
    expect(second.user.id).toBe(first.user.id);

    // JWT must include standard sub = user.id, role, and jti
    const { token, jti } = await createSessionJwt(first.user, env);
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(env.JWT_SECRET!)
    );
    expect(payload.sub).toBe(first.user.id);
    expect(payload.role).toBe('customer');
    expect(payload.jti).toBe(jti);
  });

  it('grants super_admin ONLY from SUPER_ADMIN_EMAILS secret and bootstraps DEALER_EMAILS on first login', async () => {
    // 1. Secret-listed email gets super_admin (case-insensitive, trimmed)
    const adminRes = await upsertGoogleUser(db, env, {
      googleSub: 'sub_owner_secret',
      email: 'OWNER@dugdhsar.in',
      name: 'DugdhSar Owner',
    });
    expect(adminRes.user.role).toBe('super_admin');

    // 2. Non-secret user cannot become super_admin even if D1 row is tampered with
    const regular = await upsertGoogleUser(db, env, {
      googleSub: 'sub_tampered_user',
      email: 'regular@example.com',
      name: 'Regular Patron',
    });
    expect(regular.user.role).toBe('customer');

    await db
      .prepare(`UPDATE users SET role = 'super_admin' WHERE id = ?`)
      .bind(regular.user.id)
      .run();

    const relogin = await upsertGoogleUser(db, env, {
      googleSub: 'sub_tampered_user',
      email: 'regular@example.com',
      name: 'Regular Patron',
    });
    expect(relogin.user.role).toBe('customer');
    expect(relogin.updated).toBe(true);

    // 3. DEALER_EMAILS bootstraps dealer user + active dealers row on first login
    const dealerRes = await upsertGoogleUser(db, env, {
      googleSub: 'sub_dealer_boot',
      email: 'seoni.bootstrap@dugdhsar.in',
      name: 'Seoni Fresh Hub',
    });
    expect(dealerRes.user.role).toBe('dealer');
    expect(dealerRes.user.dealerId).toBeTruthy();

    const dealerRow = await db
      .prepare(`SELECT id, user_id, business_name, status FROM dealers WHERE user_id = ?`)
      .bind(dealerRes.user.id)
      .first<{ id: string; user_id: string; business_name: string; status: string }>();
    expect(dealerRow?.status).toBe('active');
    expect(dealerRow?.business_name).toBe('Seoni Fresh Hub');
  });

  it('blocks cross-customer IDOR on GET /api/addresses/:id and validates 6-digit pincode + 6-decimal lat/lng + soft delete', async () => {
    const custA = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_addr_a',
        email: 'a@example.com',
        name: 'Customer A',
      })
    ).user;
    const custB = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_addr_b',
        email: 'b@example.com',
        name: 'Customer B',
      })
    ).user;

    const tokenA = (await createSessionJwt(custA, env)).token;
    const tokenB = (await createSessionJwt(custB, env)).token;

    // Invalid pincode rejected with 400
    const badPinRes = await fetch(`${baseUrl}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        recipientName: 'Customer A',
        line1: '10 Temple Lane',
        city: 'Seoni',
        pincode: '4806',
      }),
    });
    expect(badPinRes.status).toBe(400);

    // Valid address with high-precision lat/lng -> stored rounded to 6 decimals
    const createRes = await fetch(`${baseUrl}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        recipientName: 'Customer A',
        phone: '9876543210',
        line1: '10 Temple Lane',
        city: 'Seoni',
        pincode: '480661',
        lat: 22.08691234,
        lng: 79.54351298,
        isDefault: true,
      }),
    });
    expect(createRes.status).toBe(201);
    const createdBody = (await createRes.json()) as {
      success: boolean;
      address: { id: string; lat: number; lng: number; pincode: string };
    };
    expect(createdBody.address.lat).toBe(22.086912);
    expect(createdBody.address.lng).toBe(79.543513);

    // Customer A can read own address via GET /api/addresses/:id
    const ownGetRes = await fetch(`${baseUrl}/api/addresses/${createdBody.address.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(ownGetRes.status).toBe(200);

    // Customer B CANNOT read Customer A's address via GET /api/addresses/:id (403 IDOR)
    const idorRes = await fetch(`${baseUrl}/api/addresses/${createdBody.address.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(idorRes.status).toBe(403);

    // Soft delete sets deleted_at and hides address from subsequent GET
    const delRes = await fetch(`${baseUrl}/api/addresses/${createdBody.address.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(delRes.status).toBe(200);

    const dbRow = await db
      .prepare(`SELECT deleted_at FROM addresses WHERE id = ?`)
      .bind(createdBody.address.id)
      .first<{ deleted_at: string | null }>();
    expect(dbRow?.deleted_at).toBeTruthy();

    const afterDelRes = await fetch(`${baseUrl}/api/addresses/${createdBody.address.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(afterDelRes.status).toBe(404);
  });

  it('rejects mass assignment on PATCH /api/me (400) while allowing valid name & phone updates', async () => {
    const cust = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_me_001',
        email: 'me.user@example.com',
        name: 'Meera Nair',
      })
    ).user;
    const token = (await createSessionJwt(cust, env)).token;

    // Mass assignment attempt: sending role = super_admin MUST be rejected with 400
    const attackRes = await fetch(`${baseUrl}/api/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Meera Admin',
        role: 'super_admin',
      }),
    });
    expect(attackRes.status).toBe(400);

    // Valid name + phone update succeeds
    const validRes = await fetch(`${baseUrl}/api/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Meera Nair Updated',
        phone: '9826012345',
      }),
    });
    expect(validRes.status).toBe(200);
    const validBody = (await validRes.json()) as {
      success: boolean;
      profile: { name: string; phone: string; role: string };
    };
    expect(validBody.profile.name).toBe('Meera Nair Updated');
    expect(validBody.profile.phone).toBe('9826012345');
    expect(validBody.profile.role).toBe('customer');
  });

  it('persists revoked jti in D1 revoked_sessions on POST /api/auth/logout and rejects subsequent requests (401)', async () => {
    const cust = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_logout_001',
        email: 'logout.user@example.com',
        name: 'Logout Patron',
      })
    ).user;
    const { token, jti } = await createSessionJwt(cust, env);

    // Before logout, GET /api/me returns 200
    const beforeRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(beforeRes.status).toBe(200);

    // Logout revokes the jti in D1 revoked_sessions
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status).toBe(200);

    const revokedRow = await db
      .prepare(`SELECT jti, user_id, expires_at FROM revoked_sessions WHERE jti = ?`)
      .bind(jti)
      .first<{ jti: string; user_id: string; expires_at: string }>();
    expect(revokedRow?.jti).toBe(jti);
    expect(revokedRow?.user_id).toBe(cust.id);
    expect(revokedRow?.expires_at).toBeTruthy();

    // Clear isolate memory cache so check MUST hit D1 revoked_sessions PK lookup
    clearInMemoryRevokedJtiCache();

    // Reusing revoked JWT returns 401
    const afterRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterRes.status).toBe(401);
  });

  it('reactivates the exact same users.id row when a deleted user logs in again', async () => {
    const initial = await upsertGoogleUser(db, env, {
      googleSub: 'sub_reactivate_001',
      email: 'returner@example.com',
      name: 'Karan Joshi',
    });

    await anonymizeUserAccount(db, {
      userId: initial.user.id,
      actorEmail: initial.user.email,
      actorRole: initial.user.role,
    });

    const deletedRow = await db
      .prepare(`SELECT status, deleted_at FROM users WHERE id = ?`)
      .bind(initial.user.id)
      .first<{ status: string; deleted_at: string | null }>();
    expect(deletedRow?.status).toBe('deleted');
    expect(deletedRow?.deleted_at).toBeTruthy();

    // Re-login matched by email_hash (even with a fresh googleSub) reactivates same row
    const reactivated = await upsertGoogleUser(db, env, {
      googleSub: 'sub_reactivate_001',
      email: 'returner@example.com',
      name: 'Karan Joshi',
    });

    expect(reactivated.reactivated).toBe(true);
    expect(reactivated.created).toBe(false);
    expect(reactivated.user.id).toBe(initial.user.id);

    const activeRow = await db
      .prepare(`SELECT status, deleted_at, email FROM users WHERE id = ?`)
      .bind(initial.user.id)
      .first<{ status: string; deleted_at: string | null; email: string }>();
    expect(activeRow?.status).toBe('active');
    expect(activeRow?.deleted_at).toBeNull();
    expect(activeRow?.email).toBe('returner@example.com');
  });
});
