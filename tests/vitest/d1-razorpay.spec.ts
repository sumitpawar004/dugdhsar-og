import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestD1, LocalTestD1Database } from './helpers/mockD1';
import {
  computeHmacSha256Hex,
  resolveRazorpayTestCredentials,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from '../../server/lib/razorpay';
import {
  createD1Repo,
  upsertGoogleUser,
  createOrderInD1,
  verifyRazorpayPaymentInD1,
  processRazorpayWebhookInD1,
} from '../../server/db';
import { RazorpayCreateOrderSchema } from '../../server/schemas';
import { AuthUser, WorkerEnv } from '../../server/types';
import { addDaysYmd, getTomorrowIstYmd } from '../../server/lib/istDate';

describe('Razorpay Test-Mode Guard, WebCrypto HMAC-SHA256 Verification & Webhook Dedupe', () => {
  let db: LocalTestD1Database;
  let env: WorkerEnv;
  let customerA: AuthUser;
  let customerB: AuthUser;
  let addressIdA: string;
  let futureDate: string;

  const TEST_KEY_ID = 'rzp_test_dugdhsar12345';
  const TEST_KEY_SECRET = 'rzp_test_secret_very_strong_key_999';
  const TEST_WEBHOOK_SECRET = 'whsec_test_dugdhsar_webhook_secret_888';

  beforeEach(async () => {
    db = createTestD1();
    env = {
      DB: db,
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test_super_secret_jwt_signing_key_32_bytes_min',
      SUPER_ADMIN_EMAILS: 'owner@dugdhsar.in',
      RAZORPAY_KEY_ID: TEST_KEY_ID,
      RAZORPAY_KEY_SECRET: TEST_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
    };
    futureDate = addDaysYmd(getTomorrowIstYmd(), 3);

    customerA = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_rzp_a',
        email: 'buyer.a@example.com',
        name: 'Buyer A',
      })
    ).user;
    customerB = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_rzp_b',
        email: 'buyer.b@example.com',
        name: 'Buyer B',
      })
    ).user;

    const addr = await createD1Repo(db).forUser(customerA).addresses.create({
      recipientName: 'Buyer A',
      line1: '10 Main Market',
      city: 'Seoni',
      pincode: '480661',
    });
    addressIdA = addr.id;
  });

  afterEach(() => {
    db.close();
  });

  it('strictly blocks live Razorpay keys (rzp_live_*) and rejects client-supplied amountPaise', () => {
    expect(() =>
      resolveRazorpayTestCredentials({
        RAZORPAY_KEY_ID: 'rzp_live_DANGEROUS_LIVE_KEY',
        RAZORPAY_KEY_SECRET: 'live_secret',
      })
    ).toThrow(/TEST-MODE keys/i);

    const valid = resolveRazorpayTestCredentials(env);
    expect(valid.keyId).toBe(TEST_KEY_ID);

    // Schema MUST reject client-supplied amountPaise (mass assignment / price tampering)
    const tampered = RazorpayCreateOrderSchema.safeParse({
      orderId: 'ord_123',
      amountPaise: 100,
    });
    expect(tampered.success).toBe(false);

    // Schema accepts orderId alone
    const ok = RazorpayCreateOrderSchema.safeParse({ orderId: 'ord_123' });
    expect(ok.success).toBe(true);
  });

  it('verifies valid WebCrypto HMAC-SHA256 checkout signature, rejects tampered & legacy bypass signatures', async () => {
    const { order } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId: addressIdA,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'razorpay',
    });
    expect(order.status).toBe('pending');
    expect(order.payment_status).toBe('pending');

    const rzpOrderId = 'order_test_99887766';
    const rzpPaymentId = 'pay_test_11223344';

    // Attach razorpay_order_id to the order's payment row (as createRazorpayOrderInD1 does)
    await db
      .prepare(`UPDATE payments SET razorpay_order_id = ? WHERE order_id = ?`)
      .bind(rzpOrderId, order.id)
      .run();

    // 1. Legacy sig_sim_valid_ bypass MUST FAIL
    expect(
      await verifyRazorpayCheckoutSignature(rzpOrderId, rzpPaymentId, 'sig_sim_valid_bypass', TEST_KEY_SECRET)
    ).toBe(false);

    await expect(
      verifyRazorpayPaymentInD1(db, env, customerA, {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: 'sig_sim_valid_000000000000000000000000000000',
      })
    ).rejects.toThrow(/signature verification failed/i);

    // 2. Valid HMAC-SHA256 signature computed with WebCrypto
    const validSig = await computeHmacSha256Hex(TEST_KEY_SECRET, `${rzpOrderId}|${rzpPaymentId}`);

    // Another customer (Customer B) CANNOT verify Customer A's payment
    await expect(
      verifyRazorpayPaymentInD1(db, env, customerB, {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSig,
      })
    ).rejects.toThrow(/belongs to another user/i);

    // Customer A verifies with valid signature -> payment captured & order confirmed/paid
    const verified = await verifyRazorpayPaymentInD1(db, env, customerA, {
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: validSig,
    });
    expect(verified.verified).toBe(true);
    expect(verified.alreadyCaptured).toBe(false);

    const settledOrder = await db
      .prepare(`SELECT status, payment_status FROM orders WHERE id = ?`)
      .bind(order.id)
      .first<{ status: string; payment_status: string }>();
    expect(settledOrder?.status).toBe('confirmed');
    expect(settledOrder?.payment_status).toBe('paid');

    // Re-verifying same captured payment is safely idempotent
    const replay = await verifyRazorpayPaymentInD1(db, env, customerA, {
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: validSig,
    });
    expect(replay.alreadyCaptured).toBe(true);
  });

  it('validates webhook raw-body HMAC signature, deduplicates via webhook_events, and handles capture + refunds', async () => {
    const { order } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId: addressIdA,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'razorpay',
    });
    const rzpOrderId = 'order_wh_554433';
    const rzpPaymentId = 'pay_wh_112233';

    await db
      .prepare(`UPDATE payments SET razorpay_order_id = ? WHERE order_id = ?`)
      .bind(rzpOrderId, order.id)
      .run();

    const capturePayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 34000, // Exact D1 amount (2 * 17000)
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const captureRaw = JSON.stringify(capturePayload);
    const validWebhookSig = await computeHmacSha256Hex(TEST_WEBHOOK_SECRET, captureRaw);

    expect(await verifyRazorpayWebhookSignature(captureRaw, validWebhookSig, TEST_WEBHOOK_SECRET)).toBe(true);
    expect(await verifyRazorpayWebhookSignature(captureRaw, 'deadbeef', TEST_WEBHOOK_SECRET)).toBe(false);

    // 1. Tampered signature MUST throw UnauthorizedError (401)
    await expect(
      processRazorpayWebhookInD1(db, env, {
        rawBody: captureRaw,
        signatureHeader: '0'.repeat(64),
        eventIdHeader: 'evt_capture_001',
        payload: capturePayload,
      })
    ).rejects.toThrow(/Invalid Razorpay webhook signature/i);

    // 2. Valid webhook settles order & payment
    const res1 = await processRazorpayWebhookInD1(db, env, {
      rawBody: captureRaw,
      signatureHeader: validWebhookSig,
      eventIdHeader: 'evt_capture_001',
      payload: capturePayload,
    });
    expect(res1.accepted).toBe(true);
    expect(res1.deduplicated).toBe(false);

    const paidOrder = await db
      .prepare(`SELECT status, payment_status FROM orders WHERE id = ?`)
      .bind(order.id)
      .first<{ status: string; payment_status: string }>();
    expect(paidOrder?.payment_status).toBe('paid');
    expect(paidOrder?.status).toBe('confirmed');

    // 3. Duplicate webhook delivery with same eventId is deduplicated
    const res2 = await processRazorpayWebhookInD1(db, env, {
      rawBody: captureRaw,
      signatureHeader: validWebhookSig,
      eventIdHeader: 'evt_capture_001',
      payload: capturePayload,
    });
    expect(res2.accepted).toBe(true);
    expect(res2.deduplicated).toBe(true);

    // 4. Partial refund -> partially_refunded; second refund -> refunded
    const partialRefundPayload = {
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_001',
            payment_id: rzpPaymentId,
            amount: 17000,
          },
        },
      },
    };
    const partialRaw = JSON.stringify(partialRefundPayload);
    const partialSig = await computeHmacSha256Hex(TEST_WEBHOOK_SECRET, partialRaw);

    await processRazorpayWebhookInD1(db, env, {
      rawBody: partialRaw,
      signatureHeader: partialSig,
      eventIdHeader: 'evt_refund_001',
      payload: partialRefundPayload,
    });

    const partialPay = await db
      .prepare(`SELECT status, refunded_amount_paise FROM payments WHERE razorpay_order_id = ?`)
      .bind(rzpOrderId)
      .first<{ status: string; refunded_amount_paise: number }>();
    expect(partialPay?.status).toBe('partially_refunded');
    expect(partialPay?.refunded_amount_paise).toBe(17000);

    // Remaining 17000 refund -> full refund
    const fullRaw = JSON.stringify({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_002',
            payment_id: rzpPaymentId,
            amount: 17000,
          },
        },
      },
    });
    const fullSig = await computeHmacSha256Hex(TEST_WEBHOOK_SECRET, fullRaw);
    await processRazorpayWebhookInD1(db, env, {
      rawBody: fullRaw,
      signatureHeader: fullSig,
      eventIdHeader: 'evt_refund_002',
      payload: JSON.parse(fullRaw),
    });

    const fullPay = await db
      .prepare(`SELECT status, refunded_amount_paise FROM payments WHERE razorpay_order_id = ?`)
      .bind(rzpOrderId)
      .first<{ status: string; refunded_amount_paise: number }>();
    expect(fullPay?.status).toBe('refunded');
    expect(fullPay?.refunded_amount_paise).toBe(34000);

    const refundedOrder = await db
      .prepare(`SELECT payment_status FROM orders WHERE id = ?`)
      .bind(order.id)
      .first<{ payment_status: string }>();
    expect(refundedOrder?.payment_status).toBe('refunded');
  });

  it('ignores webhook payment.captured if captured amount does not match D1 ledger amount', async () => {
    const { order } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId: addressIdA,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'razorpay',
    });
    const rzpOrderId = 'order_tamper_111';
    await db
      .prepare(`UPDATE payments SET razorpay_order_id = ? WHERE order_id = ?`)
      .bind(rzpOrderId, order.id)
      .run();

    const tamperedPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_tamper_111',
            order_id: rzpOrderId,
            amount: 100, // Tampered ₹1 instead of ₹340 (34000 paise)
          },
        },
      },
    };
    const raw = JSON.stringify(tamperedPayload);
    const sig = await computeHmacSha256Hex(TEST_WEBHOOK_SECRET, raw);

    await processRazorpayWebhookInD1(db, env, {
      rawBody: raw,
      signatureHeader: sig,
      eventIdHeader: 'evt_tamper_001',
      payload: tamperedPayload,
    });

    // Order MUST remain pending/unpaid!
    const unpaidOrder = await db
      .prepare(`SELECT status, payment_status FROM orders WHERE id = ?`)
      .bind(order.id)
      .first<{ status: string; payment_status: string }>();
    expect(unpaidOrder?.payment_status).toBe('pending');
    expect(unpaidOrder?.status).toBe('pending');
  });
});
