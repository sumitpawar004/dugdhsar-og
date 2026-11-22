import { AuthUser, D1Database, D1PreparedStatement, WorkerEnv } from '../types';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/AppError';
import { generateId, sha256Hex, utcNowIso } from './client';
import { buildAuditLogStatement } from './auditRepo';
import { createD1Repo } from './repo';
import { PaymentRow, SubscriptionInvoiceRow } from './types';
import {
  createRazorpayRemoteOrder,
  resolveRazorpayTestCredentials,
  resolveRazorpayWebhookSecret,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from '../lib/razorpay';

export interface RazorpayCheckoutOrderResult {
  paymentId: string;
  razorpayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  receipt: string;
  mode: 'test';
  reused: boolean;
}

/**
 * Creates (or idempotently reuses) a Razorpay test-mode order strictly from D1 server-side prices.
 * NEVER trusts any client-supplied amount.
 */
export async function createRazorpayOrderInD1(
  db: D1Database,
  env: WorkerEnv | undefined,
  user: AuthUser,
  input: { orderId?: string; subscriptionInvoiceId?: string },
  ipAddress?: string | null
): Promise<RazorpayCheckoutOrderResult> {
  const creds = resolveRazorpayTestCredentials(env);
  const scoped = createD1Repo(db).forUser(user);

  let targetOrderId: string | null = null;
  let targetSubscriptionId: string | null = null;
  let targetInvoiceId: string | null = null;
  let ownerUserId = user.id;
  let amountPaise = 0;
  let receipt = '';
  let notes: Record<string, string> = {};

  if (input.orderId) {
    const { order } = await scoped.orders.getById(input.orderId);
    if (order.payment_method !== 'razorpay') {
      throw new BadRequestError(
        `Order ${order.order_number} uses payment method "${order.payment_method}" and cannot be paid via Razorpay.`
      );
    }
    if (order.status === 'cancelled' || order.status === 'returned') {
      throw new BadRequestError(`Cannot pay for a ${order.status} order.`);
    }
    if (order.payment_status === 'paid') {
      throw new ConflictError(`Order ${order.order_number} is already paid.`);
    }
    if (order.total_paise < 100) {
      throw new BadRequestError('Order total must be at least ₹1 (100 paise) for Razorpay checkout.');
    }

    targetOrderId = order.id;
    ownerUserId = order.user_id;
    amountPaise = order.total_paise;
    receipt = order.order_number;
    notes = {
      order_id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
    };
  } else if (input.subscriptionInvoiceId) {
    const invoice = await db
      .prepare(
        `SELECT id, invoice_number, subscription_id, user_id, period_start, period_end,
                scheduled_deliveries, skipped_deliveries, amount_paise, status, due_date, paid_at, created_at, updated_at
         FROM subscription_invoices
         WHERE id = ?
         LIMIT 1`
      )
      .bind(input.subscriptionInvoiceId)
      .first<SubscriptionInvoiceRow>();

    if (!invoice) {
      throw new NotFoundError('Subscription invoice not found.');
    }
    if (invoice.user_id !== user.id && user.role !== 'super_admin' && user.role !== 'manager') {
      throw new ForbiddenError('Access denied: You cannot pay another user’s subscription invoice.');
    }
    if (invoice.status === 'paid') {
      throw new ConflictError(`Invoice ${invoice.invoice_number} is already paid.`);
    }
    if (invoice.status === 'void') {
      throw new BadRequestError(`Invoice ${invoice.invoice_number} is void and cannot be paid.`);
    }
    if (invoice.amount_paise < 100) {
      throw new BadRequestError('Invoice total must be at least ₹1 (100 paise) for Razorpay checkout.');
    }

    targetInvoiceId = invoice.id;
    targetSubscriptionId = invoice.subscription_id;
    ownerUserId = invoice.user_id;
    amountPaise = invoice.amount_paise;
    receipt = invoice.invoice_number;
    notes = {
      subscription_invoice_id: invoice.id,
      subscription_id: invoice.subscription_id,
      invoice_number: invoice.invoice_number,
      user_id: invoice.user_id,
    };
  } else {
    throw new BadRequestError('Either orderId or subscriptionInvoiceId is required.');
  }

  // Reuse an existing unpaid Razorpay order if one was already generated for this order/invoice
  const existingPayment = targetOrderId
    ? await db
        .prepare(
          `SELECT id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
                  razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
                  currency, signature_verified, error_code, created_at, updated_at
           FROM payments
           WHERE order_id = ? AND provider = 'razorpay'
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(targetOrderId)
        .first<PaymentRow>()
    : await db
        .prepare(
          `SELECT id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
                  razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
                  currency, signature_verified, error_code, created_at, updated_at
           FROM payments
           WHERE subscription_invoice_id = ? AND provider = 'razorpay'
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(targetInvoiceId)
        .first<PaymentRow>();

  if (
    existingPayment &&
    existingPayment.razorpay_order_id &&
    existingPayment.status === 'created' &&
    existingPayment.amount_paise === amountPaise
  ) {
    return {
      paymentId: existingPayment.id,
      razorpayOrderId: existingPayment.razorpay_order_id,
      keyId: creds.keyId,
      amountPaise: existingPayment.amount_paise,
      currency: existingPayment.currency,
      receipt,
      mode: 'test',
      reused: true,
    };
  }

  // Create real test-mode Razorpay Order using server-authoritative amount from D1
  const remoteOrder = await createRazorpayRemoteOrder({
    keyId: creds.keyId,
    keySecret: creds.keySecret,
    amountPaise,
    currency: 'INR',
    receipt,
    notes,
  });

  const now = utcNowIso();
  const paymentId = existingPayment && !existingPayment.razorpay_order_id ? existingPayment.id : generateId();

  const statements: D1PreparedStatement[] = [];
  if (existingPayment && !existingPayment.razorpay_order_id) {
    statements.push(
      db
        .prepare(
          `UPDATE payments
           SET razorpay_order_id = ?, amount_paise = ?, status = 'created', error_code = NULL, updated_at = ?
           WHERE id = ?`
        )
        .bind(remoteOrder.id, amountPaise, now, paymentId)
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO payments (
            id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
            razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
            currency, signature_verified, error_code, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'razorpay', ?, NULL, 'created', ?, 0, 'INR', 0, NULL, ?, ?)`
        )
        .bind(
          paymentId,
          targetOrderId,
          targetSubscriptionId,
          targetInvoiceId,
          ownerUserId,
          remoteOrder.id,
          amountPaise,
          now,
          now
        )
    );
  }

  statements.push(
    buildAuditLogStatement(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'RAZORPAY_ORDER_CREATED',
      targetType: 'payment',
      targetId: paymentId,
      details: {
        razorpayOrderId: remoteOrder.id,
        orderId: targetOrderId,
        subscriptionInvoiceId: targetInvoiceId,
        amountPaise,
        mode: 'test',
      },
      ipAddress,
    })
  );

  await db.batch(statements);

  return {
    paymentId,
    razorpayOrderId: remoteOrder.id,
    keyId: creds.keyId,
    amountPaise,
    currency: 'INR',
    receipt,
    mode: 'test',
    reused: false,
  };
}

/**
 * Verifies Razorpay Checkout HMAC-SHA256 signature on the server and atomically marks
 * payment + linked order/subscription invoice paid in Cloudflare D1.
 */
export async function verifyRazorpayPaymentInD1(
  db: D1Database,
  env: WorkerEnv | undefined,
  user: AuthUser,
  input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
  ipAddress?: string | null
): Promise<{
  verified: boolean;
  alreadyCaptured: boolean;
  paymentId: string;
  orderId: string | null;
  subscriptionInvoiceId: string | null;
}> {
  const creds = resolveRazorpayTestCredentials(env);

  const payment = await db
    .prepare(
      `SELECT id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
              razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
              currency, signature_verified, error_code, created_at, updated_at
       FROM payments
       WHERE razorpay_order_id = ?
       LIMIT 1`
    )
    .bind(input.razorpayOrderId)
    .first<PaymentRow>();

  if (!payment) {
    throw new NotFoundError('No payment record found for this Razorpay order ID.');
  }

  if (payment.user_id !== user.id && user.role !== 'super_admin' && user.role !== 'manager') {
    throw new ForbiddenError('Access denied: This payment belongs to another user.');
  }

  const isValid = await verifyRazorpayCheckoutSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature,
    creds.keySecret
  );

  if (!isValid) {
    await buildAuditLogStatement(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'RAZORPAY_SIGNATURE_FAILED',
      targetType: 'payment',
      targetId: payment.id,
      details: { razorpayOrderId: input.razorpayOrderId },
      ipAddress,
    }).run();
    throw new BadRequestError('Razorpay payment signature verification failed.');
  }

  if (payment.status === 'captured' && payment.signature_verified === 1) {
    return {
      verified: true,
      alreadyCaptured: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      subscriptionInvoiceId: payment.subscription_invoice_id,
    };
  }

  const now = utcNowIso();
  const statements = await buildCaptureSettlementStatements(db, payment, input.razorpayPaymentId, now);
  statements.push(
    buildAuditLogStatement(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'RAZORPAY_PAYMENT_VERIFIED',
      targetType: 'payment',
      targetId: payment.id,
      details: {
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        amountPaise: payment.amount_paise,
      },
      ipAddress,
    })
  );

  await db.batch(statements);

  return {
    verified: true,
    alreadyCaptured: false,
    paymentId: payment.id,
    orderId: payment.order_id,
    subscriptionInvoiceId: payment.subscription_invoice_id,
  };
}

/**
 * Shared atomic settlement statements for both client verify and server-to-server webhook capture.
 */
async function buildCaptureSettlementStatements(
  db: D1Database,
  payment: PaymentRow,
  razorpayPaymentId: string,
  now: string
): Promise<D1PreparedStatement[]> {
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE payments
         SET razorpay_payment_id = COALESCE(razorpay_payment_id, ?),
             status = 'captured',
             signature_verified = 1,
             error_code = NULL,
             updated_at = ?
         WHERE id = ? AND status NOT IN ('refunded', 'partially_refunded')`
      )
      .bind(razorpayPaymentId, now, payment.id),
  ];

  if (payment.order_id) {
    statements.push(
      db
        .prepare(
          `UPDATE orders
           SET payment_status = 'paid',
               status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
               updated_at = ?
           WHERE id = ? AND deleted_at IS NULL`
        )
        .bind(now, payment.order_id)
    );
  }

  if (payment.subscription_invoice_id) {
    const invoice = await db
      .prepare(`SELECT subscription_id, period_end FROM subscription_invoices WHERE id = ? LIMIT 1`)
      .bind(payment.subscription_invoice_id)
      .first<{ subscription_id: string; period_end: string }>();

    statements.push(
      db
        .prepare(
          `UPDATE subscription_invoices
           SET status = 'paid', paid_at = COALESCE(paid_at, ?), updated_at = ?
           WHERE id = ?`
        )
        .bind(now, now, payment.subscription_invoice_id)
    );

    if (invoice?.subscription_id && invoice.period_end) {
      statements.push(
        db
          .prepare(
            `UPDATE subscriptions
             SET paid_through_date = CASE
                   WHEN paid_through_date IS NULL OR paid_through_date < ? THEN ?
                   ELSE paid_through_date
                 END,
                 updated_at = ?
             WHERE id = ?`
          )
          .bind(invoice.period_end, invoice.period_end, now, invoice.subscription_id)
      );
    }
  }

  return statements;
}

/**
 * Processes Razorpay Server-to-Server Webhooks with:
 *  1. Strict raw-body HMAC-SHA256 verification (`X-Razorpay-Signature`)
 *  2. Atomic idempotent dedupe via `webhook_events` (`INSERT OR IGNORE`)
 *  3. Amount verification against D1 ledger before marking paid
 *  4. Handling for `payment.captured`, `order.paid`, `payment.failed`, `refund.created`, `refund.processed`
 */
export async function processRazorpayWebhookInD1(
  db: D1Database,
  env: WorkerEnv | undefined,
  input: {
    rawBody: string;
    signatureHeader: string | undefined;
    eventIdHeader: string | undefined;
    payload: any;
  },
  ipAddress?: string | null
): Promise<{
  accepted: boolean;
  deduplicated: boolean;
  eventId: string;
  eventType: string;
}> {
  const webhookSecret = resolveRazorpayWebhookSecret(env);

  const isValid = await verifyRazorpayWebhookSignature(
    input.rawBody,
    input.signatureHeader,
    webhookSecret
  );
  if (!isValid) {
    throw new UnauthorizedError('Invalid Razorpay webhook signature.');
  }

  const eventType = String(input.payload?.event || 'unknown').slice(0, 80);
  const eventId =
    input.eventIdHeader?.trim() ||
    (typeof input.payload?.id === 'string' && input.payload.id.trim()) ||
    `rzp_sha256_${await sha256Hex(input.rawBody)}`;

  const now = utcNowIso();

  // Atomic webhook dedupe insert: if event_id already exists, changes === 0
  const dedupeRes = await db
    .prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id, provider, event_type, received_at, processed_at)
       VALUES (?, 'razorpay', ?, ?, NULL)`
    )
    .bind(eventId, eventType, now)
    .run();

  if (!dedupeRes.meta?.changes || dedupeRes.meta.changes === 0) {
    return {
      accepted: true,
      deduplicated: true,
      eventId,
      eventType,
    };
  }

  const paymentEntity = input.payload?.payload?.payment?.entity;
  const orderEntity = input.payload?.payload?.order?.entity;
  const refundEntity = input.payload?.payload?.refund?.entity;

  const rzpOrderId: string | undefined =
    paymentEntity?.order_id || orderEntity?.id || undefined;
  const rzpPaymentId: string | undefined =
    paymentEntity?.id || refundEntity?.payment_id || undefined;

  let payment: PaymentRow | null = null;
  if (rzpOrderId) {
    payment = await db
      .prepare(
        `SELECT id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
                razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
                currency, signature_verified, error_code, created_at, updated_at
         FROM payments WHERE razorpay_order_id = ? LIMIT 1`
      )
      .bind(rzpOrderId)
      .first<PaymentRow>();
  }
  if (!payment && rzpPaymentId) {
    payment = await db
      .prepare(
        `SELECT id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
                razorpay_order_id, razorpay_payment_id, status, amount_paise, refunded_amount_paise,
                currency, signature_verified, error_code, created_at, updated_at
         FROM payments WHERE razorpay_payment_id = ? LIMIT 1`
      )
      .bind(rzpPaymentId)
      .first<PaymentRow>();
  }

  const statements: D1PreparedStatement[] = [];

  if (payment) {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const capturedAmount = Number(paymentEntity?.amount ?? orderEntity?.amount_paid ?? payment.amount_paise);
      if (capturedAmount === payment.amount_paise && rzpPaymentId) {
        const settleStmts = await buildCaptureSettlementStatements(db, payment, rzpPaymentId, now);
        statements.push(...settleStmts);
      }
    } else if (eventType === 'payment.failed') {
      const errCode = String(paymentEntity?.error_code || 'PAYMENT_FAILED').slice(0, 64);
      statements.push(
        db
          .prepare(
            `UPDATE payments
             SET status = CASE WHEN status IN ('captured', 'refunded', 'partially_refunded') THEN status ELSE 'failed' END,
                 error_code = ?,
                 updated_at = ?
             WHERE id = ?`
          )
          .bind(errCode, now, payment.id)
      );
      if (payment.order_id) {
        statements.push(
          db
            .prepare(
              `UPDATE orders
               SET payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'failed' END,
                   updated_at = ?
               WHERE id = ? AND deleted_at IS NULL`
            )
            .bind(now, payment.order_id)
        );
      }
    } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
      const refundAmount = Number(refundEntity?.amount || 0);
      if (Number.isInteger(refundAmount) && refundAmount > 0) {
        const nextRefunded = Math.min(payment.amount_paise, payment.refunded_amount_paise + refundAmount);
        const isFullRefund = nextRefunded >= payment.amount_paise;
        const nextPayStatus = isFullRefund ? 'refunded' : 'partially_refunded';

        statements.push(
          db
            .prepare(
              `UPDATE payments
               SET refunded_amount_paise = ?, status = ?, updated_at = ?
               WHERE id = ?`
            )
            .bind(nextRefunded, nextPayStatus, now, payment.id)
        );

        if (payment.order_id && isFullRefund) {
          statements.push(
            db
              .prepare(`UPDATE orders SET payment_status = 'refunded', updated_at = ? WHERE id = ?`)
              .bind(now, payment.order_id)
          );
        }
        if (payment.subscription_invoice_id) {
          statements.push(
            db
              .prepare(
                `UPDATE subscription_invoices
                 SET status = ?, updated_at = ?
                 WHERE id = ?`
              )
              .bind(isFullRefund ? 'void' : 'partially_refunded', now, payment.subscription_invoice_id)
          );
        }
      }
    }
  }

  statements.push(
    db
      .prepare(`UPDATE webhook_events SET processed_at = ? WHERE event_id = ?`)
      .bind(now, eventId),
    buildAuditLogStatement(db, {
      actorUserId: null,
      actorEmail: 'webhook@razorpay.com',
      actorRole: 'system',
      action: 'RAZORPAY_WEBHOOK_PROCESSED',
      targetType: 'webhook_event',
      targetId: eventId,
      details: {
        eventType,
        paymentId: payment?.id ?? null,
        razorpayOrderId: rzpOrderId ?? null,
      },
      ipAddress,
    })
  );

  await db.batch(statements);

  return {
    accepted: true,
    deduplicated: false,
    eventId,
    eventType,
  };
}
