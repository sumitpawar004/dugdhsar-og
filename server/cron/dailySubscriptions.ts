import { D1PreparedStatement, WorkerEnv } from '../types';
import { getD1, generateId, generateOrderNumber, generateQrToken, utcNowIso } from '../db/client';
import { SubscriptionFrequency } from '../db/types';
import { advanceNextDeliveryPast, getTomorrowIstYmd } from '../lib/istDate';
import { logger } from '../logger';

const BATCH_SIZE = 50;
const MAX_BATCHES_PER_INVOCATION = 20; // Up to 1,000 subscribers well within Cloudflare Free Plan D1 query limit

interface DueSubscriptionRow {
  id: string;
  user_id: string;
  dealer_id: string | null;
  address_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  delivery_slot: 'morning' | 'evening';
  unit_price_paise: number;
  billing_cycle: 'prepaid_weekly' | 'prepaid_monthly' | 'postpaid_monthly';
  paid_through_date: string | null;
  next_delivery_date: string;
  product_name: string;
  size_label: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

export interface DailyCronSummary {
  targetDate: string;
  processedBatches: number;
  ordersCreated: number;
  skippedCount: number;
  cleanedIdempotency: number;
  cleanedSessions: number;
}

/**
 * Evening Cron Handler (6:00 PM IST = 30 12 * * * UTC)
 *
 * Generates TOMORROW's `subscription_delivery` orders in small batches of 50 using `db.batch()`,
 * keeping total D1 round-trips well below Cloudflare Free Plan's ~50 queries/invocation limit.
 *
 * Idempotency guarantee:
 *   `orders` has partial UNIQUE index `uq_orders_sub_date(subscription_id, delivery_date) WHERE subscription_id IS NOT NULL`,
 *   and statements use `INSERT OR IGNORE`, so re-running the cron NEVER creates duplicate deliveries.
 *
 * Also performs daily cleanup of expired `idempotency_keys` and `revoked_sessions`.
 */
export async function runEveningSubscriptionCron(
  env: WorkerEnv,
  now: Date = new Date()
): Promise<DailyCronSummary> {
  const db = getD1(env);
  const targetDate = getTomorrowIstYmd(now);

  if (!db) {
    logger.warn('[Subscription Cron] Skipped: D1 binding (DB) is not configured');
    return {
      targetDate,
      processedBatches: 0,
      ordersCreated: 0,
      skippedCount: 0,
      cleanedIdempotency: 0,
      cleanedSessions: 0,
    };
  }

  const nowIso = utcNowIso(now);
  let lastId = '';
  let processedBatches = 0;
  let ordersCreated = 0;
  let skippedCount = 0;

  for (let batchNum = 0; batchNum < MAX_BATCHES_PER_INVOCATION; batchNum++) {
    // 1 query: fetch next 50 due active subscriptions joined with address + product/variant
    const dueRes = await db
      .prepare(
        `SELECT s.id, s.user_id, s.dealer_id, s.address_id, s.product_id, s.variant_id,
                s.quantity, s.frequency, s.delivery_slot, s.unit_price_paise, s.billing_cycle,
                s.paid_through_date, s.next_delivery_date,
                p.name AS product_name, pv.size_label,
                a.recipient_name, a.phone, a.line1, a.line2, a.landmark,
                a.city, a.state, a.pincode, a.lat, a.lng
         FROM subscriptions s
         INNER JOIN products p ON p.id = s.product_id
         INNER JOIN product_variants pv ON pv.id = s.variant_id
         INNER JOIN addresses a ON a.id = s.address_id
         WHERE s.status = 'active'
           AND s.deleted_at IS NULL
           AND s.next_delivery_date <= ?
           AND s.id > ?
         ORDER BY s.id ASC
         LIMIT ?`
      )
      .bind(targetDate, lastId, BATCH_SIZE)
      .all<DueSubscriptionRow>();

    const batch = dueRes.results || [];
    if (batch.length === 0) break;

    processedBatches++;
    lastId = batch[batch.length - 1].id;

    // 2nd query: fetch skip dates for this batch of <= 50 subscriptions in one shot
    const placeholders = batch.map(() => '?').join(', ');
    const skipsRes = await db
      .prepare(
        `SELECT subscription_id FROM subscription_pauses
         WHERE skip_date = ? AND subscription_id IN (${placeholders})`
      )
      .bind(targetDate, ...batch.map((s) => s.id))
      .all<{ subscription_id: string }>();

    const skippedSet = new Set((skipsRes.results || []).map((r) => r.subscription_id));
    const statements: D1PreparedStatement[] = [];

    for (const sub of batch) {
      const nextDateAfterTomorrow = advanceNextDeliveryPast(sub.next_delivery_date, targetDate, sub.frequency);

      if (skippedSet.has(sub.id)) {
        skippedCount++;
      } else {
        const orderId = generateId();
        const orderNumber = generateOrderNumber('SUB', targetDate);
        const qrToken = generateQrToken();
        const lineTotal = sub.unit_price_paise * sub.quantity;
        const isPrepaidCovered =
          sub.billing_cycle !== 'postpaid_monthly' &&
          Boolean(sub.paid_through_date && sub.paid_through_date >= targetDate);

        const paymentMethod = isPrepaidCovered ? 'razorpay' : 'cod';
        const paymentStatus = isPrepaidCovered ? 'paid' : 'due_on_delivery';

        const addressSnapshot = JSON.stringify({
          recipientName: sub.recipient_name,
          phone: sub.phone,
          line1: sub.line1,
          line2: sub.line2,
          landmark: sub.landmark,
          city: sub.city,
          state: sub.state,
          pincode: sub.pincode,
          lat: sub.lat,
          lng: sub.lng,
        });

        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO orders (
                id, order_number, order_type, user_id, dealer_id, subscription_id, address_id, coupon_id,
                shipping_address_json, delivery_pincode, delivery_date, delivery_slot, status,
                payment_method, payment_status, subtotal_paise, tax_paise, delivery_fee_paise,
                discount_paise, total_paise, qr_token, notes, created_at, updated_at
              ) VALUES (?, ?, 'subscription_delivery', ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'confirmed', ?, ?, ?, 0, 0, 0, ?, ?, NULL, ?, ?)`
            )
            .bind(
              orderId,
              orderNumber,
              sub.user_id,
              sub.dealer_id,
              sub.id,
              sub.address_id,
              addressSnapshot,
              sub.pincode,
              targetDate,
              sub.delivery_slot,
              paymentMethod,
              paymentStatus,
              lineTotal,
              lineTotal,
              qrToken,
              nowIso,
              nowIso
            ),
          db
            .prepare(
              `INSERT OR IGNORE INTO order_items (
                id, order_id, product_id, variant_id, product_name_snapshot,
                size_snapshot, unit_price_paise, quantity, total_paise
              )
              SELECT ?, o.id, ?, ?, ?, ?, ?, ?, ?
              FROM orders o
              WHERE o.id = ?`
            )
            .bind(
              generateId(),
              sub.product_id,
              sub.variant_id,
              sub.product_name,
              sub.size_label,
              sub.unit_price_paise,
              sub.quantity,
              lineTotal,
              orderId
            )
        );
        ordersCreated++;
      }

      // Advance next_delivery_date for both delivered and skipped subscriptions
      statements.push(
        db
          .prepare(`UPDATE subscriptions SET next_delivery_date = ?, updated_at = ? WHERE id = ?`)
          .bind(nextDateAfterTomorrow, nowIso, sub.id)
      );
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    if (batch.length < BATCH_SIZE) break;
  }

  // Daily cleanup of expired idempotency_keys & revoked_sessions (1 batch round-trip)
  const [cleanIdemRes, cleanSessRes] = await db.batch([
    db.prepare(`DELETE FROM idempotency_keys WHERE expires_at < ?`).bind(nowIso),
    db.prepare(`DELETE FROM revoked_sessions WHERE expires_at < ?`).bind(nowIso),
  ]);

  const summary: DailyCronSummary = {
    targetDate,
    processedBatches,
    ordersCreated,
    skippedCount,
    cleanedIdempotency: cleanIdemRes.meta?.changes || 0,
    cleanedSessions: cleanSessRes.meta?.changes || 0,
  };

  logger.info('[Subscription Cron] Completed evening batch run', summary);
  return summary;
}
