import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createTestD1, LocalTestD1Database } from './helpers/mockD1';
import { createApp } from '../../server/app';
import { createSessionJwt } from '../../server/auth';
import { createD1Repo, upsertGoogleUser, updateOrderStatusConditionalInD1 } from '../../server/db';
import { AuthUser, WorkerEnv } from '../../server/types';
import { addDaysYmd, getTomorrowIstYmd } from '../../server/lib/istDate';

async function startTestServer(env: WorkerEnv): Promise<{ server: Server; baseUrl: string }> {
  const app = createApp(() => env);
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

describe('D1 Idempotent Order Creation, Concurrent Double-Submit & Atomic Stock Deduction', () => {
  let db: LocalTestD1Database;
  let env: WorkerEnv;
  let server: Server;
  let baseUrl: string;
  let customer: AuthUser;
  let admin: AuthUser;
  let customerToken: string;
  let addressId: string;
  let futureDate: string;

  beforeEach(async () => {
    db = createTestD1();
    env = {
      DB: db,
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test_super_secret_jwt_signing_key_32_bytes_min',
      SUPER_ADMIN_EMAILS: 'owner@dugdhsar.in',
      DEALER_EMAILS: '',
    };
    futureDate = addDaysYmd(getTomorrowIstYmd(), 3);

    admin = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_owner_ord',
        email: 'owner@dugdhsar.in',
        name: 'Admin Owner',
      })
    ).user;

    customer = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_cust_ord',
        email: 'patron@example.com',
        name: 'Patron One',
      })
    ).user;

    const addr = await createD1Repo(db).forUser(customer).addresses.create({
      label: 'Home',
      recipientName: 'Patron One',
      phone: '9876543210',
      line1: '101 Barghat Rd',
      city: 'Seoni',
      pincode: '480661',
      isDefault: true,
    });
    addressId = addr.id;

    customerToken = (await createSessionJwt(customer, env)).token;
    const started = await startTestServer(env);
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });

  it('replays identical response for duplicate Idempotency-Key and deducts stock only once', async () => {
    const initialStock = await db
      .prepare(`SELECT stock_qty FROM product_variants WHERE id = 'wm-1l'`)
      .first<{ stock_qty: number }>();
    expect(initialStock?.stock_qty).toBe(150);

    const payload = {
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    };

    const idemKey = 'idem_test_order_replay_001';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
      'Idempotency-Key': idemKey,
    };

    const res1 = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(201);
    const body1 = (await res1.json()) as any;
    expect(body1.success).toBe(true);
    expect(body1.order.total_paise).toBe(34000); // 2 * 17000 paise

    // Retry with exact same Idempotency-Key + payload
    const res2 = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(201);
    expect(res2.headers.get('x-idempotency-hit')).toBe('true');
    const body2 = (await res2.json()) as any;
    expect(body2.order.id).toBe(body1.order.id);

    // Strictly ONE order in D1 and stock deducted ONCE (150 - 2 = 148)
    const orderCount = await db.prepare(`SELECT COUNT(*) AS cnt FROM orders`).first<{ cnt: number }>();
    expect(orderCount?.cnt).toBe(1);

    const finalStock = await db
      .prepare(`SELECT stock_qty FROM product_variants WHERE id = 'wm-1l'`)
      .first<{ stock_qty: number }>();
    expect(finalStock?.stock_qty).toBe(148);
  });

  it('rejects reusing an Idempotency-Key with a different payload (409 Conflict)', async () => {
    const idemKey = 'idem_test_mismatch_002';
    const baseHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
      'Idempotency-Key': idemKey,
    };

    const res1 = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        items: [{ variantId: 'wm-1l', quantity: 1 }],
        addressId,
        deliveryDate: futureDate,
        deliverySlot: 'morning',
        paymentMethod: 'cod',
      }),
    });
    expect(res1.status).toBe(201);

    const res2 = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        items: [{ variantId: 'wm-1l', quantity: 3 }],
        addressId,
        deliveryDate: futureDate,
        deliverySlot: 'morning',
        paymentMethod: 'cod',
      }),
    });
    expect(res2.status).toBe(409);

    const orderCount = await db.prepare(`SELECT COUNT(*) AS cnt FROM orders`).first<{ cnt: number }>();
    expect(orderCount?.cnt).toBe(1);
  });

  it('guards against concurrent double-submit with the same Idempotency-Key', async () => {
    const idemKey = 'idem_concurrent_double_submit_003';
    const bodyStr = JSON.stringify({
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
      'Idempotency-Key': idemKey,
    };

    const [r1, r2] = await Promise.all([
      fetch(`${baseUrl}/api/checkout/create-order`, { method: 'POST', headers, body: bodyStr }),
      fetch(`${baseUrl}/api/checkout/create-order`, { method: 'POST', headers, body: bodyStr }),
    ]);

    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    // One creates (201), the concurrent duplicate either gets 409 (in-flight lock) or 201 replay
    expect(statuses[0]).toBe(201);
    expect([201, 409]).toContain(statuses[1]);

    // Strictly ONE order created and stock deducted ONCE (150 - 2 = 148)
    const orderCount = await db.prepare(`SELECT COUNT(*) AS cnt FROM orders`).first<{ cnt: number }>();
    expect(orderCount?.cnt).toBe(1);

    const stock = await db
      .prepare(`SELECT stock_qty FROM product_variants WHERE id = 'wm-1l'`)
      .first<{ stock_qty: number }>();
    expect(stock?.stock_qty).toBe(148);
  });

  it('prevents overselling under concurrent orders for limited stock (atomic WHERE stock_qty >= ?)', async () => {
    // Restrict stock of bm-1l to exactly 3 units
    await db.prepare(`UPDATE product_variants SET stock_qty = 3 WHERE id = 'bm-1l'`).run();

    const makeOrderReq = (idemKey: string) =>
      fetch(`${baseUrl}/api/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
          'Idempotency-Key': idemKey,
        },
        body: JSON.stringify({
          items: [{ variantId: 'bm-1l', quantity: 2 }],
          addressId,
          deliveryDate: futureDate,
          deliverySlot: 'morning',
          paymentMethod: 'cod',
        }),
      });

    // Two concurrent buyers request 2 units each when only 3 exist -> strictly 1 succeeds, 1 gets 409
    const [r1, r2] = await Promise.all([
      makeOrderReq('idem_stock_race_A'),
      makeOrderReq('idem_stock_race_B'),
    ]);

    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const remaining = await db
      .prepare(`SELECT stock_qty FROM product_variants WHERE id = 'bm-1l'`)
      .first<{ stock_qty: number }>();
    expect(remaining?.stock_qty).toBe(1);
  });

  it('detects stale expectedStatus on conditional order status update', async () => {
    const res = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
        'Idempotency-Key': 'idem_status_race_004',
      },
      body: JSON.stringify({
        items: [{ variantId: 'wm-1l', quantity: 1 }],
        addressId,
        deliveryDate: futureDate,
        deliverySlot: 'morning',
        paymentMethod: 'cod',
      }),
    });
    const created = (await res.json()) as any;
    const orderId = created.order.id;

    // First transition: confirmed -> dispatched (succeeds)
    const updated = await updateOrderStatusConditionalInD1(db, admin, orderId, 'dispatched', 'confirmed');
    expect(updated.status).toBe('dispatched');

    // Stale transition expecting 'confirmed' -> fails with 409 Conflict
    await expect(
      updateOrderStatusConditionalInD1(db, admin, orderId, 'cancelled', 'confirmed')
    ).rejects.toThrow(/changed concurrently/i);
  });
});
