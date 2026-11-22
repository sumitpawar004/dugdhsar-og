import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestD1, LocalTestD1Database } from './helpers/mockD1';
import {
  addDaysYmd,
  checkIstCutoffForDate,
  computeNextDeliveryDate,
  advanceNextDeliveryPast,
  getTomorrowIstYmd,
} from '../../server/lib/istDate';
import {
  createD1Repo,
  upsertGoogleUser,
  createSubscriptionInD1,
  skipSubscriptionDateInD1,
} from '../../server/db';
import { runEveningSubscriptionCron } from '../../server/cron/dailySubscriptions';
import { AuthUser, WorkerEnv } from '../../server/types';

describe('IST Date Math (Month-End, Leap-Year, Cut-Offs) & Subscription Pause/Skip Cron', () => {
  describe('Pure IST Calendar & Frequency Math', () => {
    it('handles leap years, non-leap years, month-ends, and year rollovers accurately', () => {
      // Leap year 2024
      expect(addDaysYmd('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDaysYmd('2024-02-28', 2)).toBe('2024-03-01');
      expect(addDaysYmd('2024-02-29', 1)).toBe('2024-03-01');

      // Non-leap year 2025
      expect(addDaysYmd('2025-02-28', 1)).toBe('2025-03-01');

      // 31-day & 30-day month boundaries & year boundary
      expect(addDaysYmd('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDaysYmd('2026-04-30', 1)).toBe('2026-05-01');
      expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('computes next delivery dates for daily, alternate_days, weekdays, and weekly', () => {
      expect(computeNextDeliveryDate('2024-02-28', 'daily')).toBe('2024-02-29');
      expect(computeNextDeliveryDate('2024-02-28', 'alternate_days')).toBe('2024-03-01');
      expect(computeNextDeliveryDate('2026-12-28', 'weekly')).toBe('2027-01-04');

      // 2026-05-08 is a Friday -> next weekday must skip Saturday (09) & Sunday (10) -> Monday 2026-05-11
      expect(computeNextDeliveryDate('2026-05-08', 'weekdays')).toBe('2026-05-11');
      // 2026-05-11 is a Monday -> next weekday is Tuesday 2026-05-12
      expect(computeNextDeliveryDate('2026-05-11', 'weekdays')).toBe('2026-05-12');

      // advanceNextDeliveryPast jumps strictly past targetDate
      expect(advanceNextDeliveryPast('2026-05-01', '2026-05-05', 'alternate_days')).toBe('2026-05-07');
    });

    it('enforces IST 9 PM previous-evening cut-off for morning slot and 4 PM same-day cut-off for evening slot', () => {
      // Target delivery date: 2026-05-10
      // 2026-05-09 20:59 IST = 2026-05-09T15:29:00Z -> ALLOWED for morning 2026-05-10
      const beforeMorningCutoff = new Date('2026-05-09T15:29:00Z');
      expect(checkIstCutoffForDate('2026-05-10', 'morning', beforeMorningCutoff).allowed).toBe(true);

      // 2026-05-09 21:00 IST = 2026-05-09T15:30:00Z -> BLOCKED for morning 2026-05-10
      const atMorningCutoff = new Date('2026-05-09T15:30:00Z');
      expect(checkIstCutoffForDate('2026-05-10', 'morning', atMorningCutoff).allowed).toBe(false);

      // Same-day morning delivery is always blocked
      const sameDayMorning = new Date('2026-05-10T01:00:00Z'); // 06:30 IST
      expect(checkIstCutoffForDate('2026-05-10', 'morning', sameDayMorning).allowed).toBe(false);

      // 2026-05-10 15:59 IST = 2026-05-10T10:29:00Z -> ALLOWED for evening 2026-05-10
      const beforeEveningCutoff = new Date('2026-05-10T10:29:00Z');
      expect(checkIstCutoffForDate('2026-05-10', 'evening', beforeEveningCutoff).allowed).toBe(true);

      // 2026-05-10 16:00 IST = 2026-05-10T10:30:00Z -> BLOCKED for evening 2026-05-10
      const atEveningCutoff = new Date('2026-05-10T10:30:00Z');
      expect(checkIstCutoffForDate('2026-05-10', 'evening', atEveningCutoff).allowed).toBe(false);
    });
  });

  describe('Evening 6 PM IST Batched Subscription Cron & Skip/Pause Handling', () => {
    let db: LocalTestD1Database;
    let env: WorkerEnv;
    let customer: AuthUser;
    let addressId: string;

    beforeEach(async () => {
      db = createTestD1();
      env = {
        DB: db,
        ENVIRONMENT: 'test',
        JWT_SECRET: 'test_super_secret_jwt_signing_key_32_bytes_min',
        SUPER_ADMIN_EMAILS: 'owner@dugdhsar.in',
      };

      customer = (
        await upsertGoogleUser(db, env, {
          googleSub: 'sub_cron_cust',
          email: 'subscriber@example.com',
          name: 'Daily Subscriber',
        })
      ).user;

      const addr = await createD1Repo(db).forUser(customer).addresses.create({
        label: 'Home',
        recipientName: 'Daily Subscriber',
        phone: '9876543210',
        line1: '22 Civil Lines',
        city: 'Seoni',
        pincode: '480661',
      });
      addressId = addr.id;
    });

    afterEach(() => {
      db.close();
    });

    it('generates tomorrow orders for active subs, excludes skipped & paused subs, cleans expired rows, and is idempotent on re-run', async () => {
      // Simulate cron running at 6:00 PM IST on 2026-05-09 (12:30 UTC) -> target delivery date is 2026-05-10
      const cronTime = new Date('2026-05-09T12:30:00Z');
      const targetDate = getTomorrowIstYmd(cronTime);
      expect(targetDate).toBe('2026-05-10');

      const farStart = addDaysYmd(getTomorrowIstYmd(), 5);

      // Create 3 subscriptions via D1 repo, then set their next_delivery_date to targetDate
      const subActive = await createSubscriptionInD1(db, customer, {
        planId: 'plan-cow-daily-1l',
        addressId,
        quantity: 2,
        frequency: 'daily',
        deliverySlot: 'morning',
        billingCycle: 'prepaid_monthly',
        startDate: farStart,
      });

      const subSkipped = await createSubscriptionInD1(db, customer, {
        planId: 'plan-buf-daily-1l',
        addressId,
        quantity: 1,
        frequency: 'daily',
        deliverySlot: 'morning',
        billingCycle: 'postpaid_monthly',
        startDate: farStart,
      });

      const subPaused = await createSubscriptionInD1(db, customer, {
        planId: 'plan-cow-daily-1l',
        addressId,
        quantity: 1,
        frequency: 'daily',
        deliverySlot: 'morning',
        billingCycle: 'prepaid_monthly',
        startDate: farStart,
      });

      // Align next_delivery_date for our deterministic cron clock
      await db.batch([
        db
          .prepare(`UPDATE subscriptions SET next_delivery_date = ?, paid_through_date = '2026-05-31' WHERE id = ?`)
          .bind(targetDate, subActive.id),
        db
          .prepare(`UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?`)
          .bind(targetDate, subSkipped.id),
        db
          .prepare(`UPDATE subscriptions SET next_delivery_date = ?, status = 'paused' WHERE id = ?`)
          .bind(targetDate, subPaused.id),
        // Add skip date for subSkipped on targetDate
        db
          .prepare(
            `INSERT INTO subscription_pauses (id, subscription_id, skip_date, reason, created_by)
             VALUES ('pause_1', ?, ?, 'Out of station', ?)`
          )
          .bind(subSkipped.id, targetDate, customer.id),
        // Seed expired idempotency_key and expired revoked_session to verify cleanup
        db
          .prepare(
            `INSERT INTO idempotency_keys (key, user_id, route, request_hash, status_code, response_json, expires_at)
             VALUES ('expired_idem_1', ?, 'POST:/api/checkout/create-order', 'abc', 201, '{}', '2026-05-01T00:00:00Z')`
          )
          .bind(customer.id),
        db
          .prepare(
            `INSERT INTO revoked_sessions (jti, user_id, reason, expires_at)
             VALUES ('expired_jti_1', ?, 'logout', '2026-05-01T00:00:00Z')`
          )
          .bind(customer.id),
      ]);

      // Run 1: generates strictly 1 order (subActive), skips 1 (subSkipped), ignores subPaused
      const summary1 = await runEveningSubscriptionCron(env, cronTime);
      expect(summary1.targetDate).toBe('2026-05-10');
      expect(summary1.ordersCreated).toBe(1);
      expect(summary1.skippedCount).toBe(1);
      expect(summary1.cleanedIdempotency).toBe(1);
      expect(summary1.cleanedSessions).toBe(1);

      const generatedOrders = await db
        .prepare(`SELECT id, subscription_id, order_type, delivery_date, total_paise, payment_status FROM orders`)
        .all<any>();
      expect(generatedOrders.results).toHaveLength(1);
      expect(generatedOrders.results[0].subscription_id).toBe(subActive.id);
      expect(generatedOrders.results[0].order_type).toBe('subscription_delivery');
      expect(generatedOrders.results[0].delivery_date).toBe('2026-05-10');
      expect(generatedOrders.results[0].total_paise).toBe(34000); // 2 * 17000 paise
      expect(generatedOrders.results[0].payment_status).toBe('paid'); // Covered by paid_through_date

      // Verify both active & skipped subscriptions advanced to 2026-05-11
      const nextActive = await db
        .prepare(`SELECT next_delivery_date FROM subscriptions WHERE id = ?`)
        .bind(subActive.id)
        .first<{ next_delivery_date: string }>();
      expect(nextActive?.next_delivery_date).toBe('2026-05-11');

      const nextSkipped = await db
        .prepare(`SELECT next_delivery_date FROM subscriptions WHERE id = ?`)
        .bind(subSkipped.id)
        .first<{ next_delivery_date: string }>();
      expect(nextSkipped?.next_delivery_date).toBe('2026-05-11');

      // Run 2 (Idempotency stress test): even if next_delivery_date is forcibly rewound to targetDate,
      // partial UNIQUE index uq_orders_sub_date + INSERT OR IGNORE guarantees ZERO duplicate orders!
      await db
        .prepare(`UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?`)
        .bind(targetDate, subActive.id)
        .run();

      await runEveningSubscriptionCron(env, cronTime);
      const countAfterRerun = await db.prepare(`SELECT COUNT(*) AS cnt FROM orders`).first<{ cnt: number }>();
      expect(countAfterRerun?.cnt).toBe(1);
    });

    it('rejects customer skip request for a past date (IST cut-off enforcement)', async () => {
      const farStart = addDaysYmd(getTomorrowIstYmd(), 5);
      const sub = await createSubscriptionInD1(db, customer, {
        planId: 'plan-cow-daily-1l',
        addressId,
        quantity: 1,
        frequency: 'daily',
        deliverySlot: 'morning',
        billingCycle: 'prepaid_monthly',
        startDate: farStart,
      });

      await expect(skipSubscriptionDateInD1(db, customer, sub.id, '2024-01-01', 'Past')).rejects.toThrow(
        /past delivery date/i
      );
    });
  });
});
