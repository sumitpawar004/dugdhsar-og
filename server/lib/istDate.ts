import { DeliverySlotCode, SubscriptionFrequency } from '../db/types';

const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+05:30 (Asia/Kolkata, no DST)
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface IstDateParts {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  hour: number; // 0..23
  minute: number; // 0..59
  dayOfWeek: number; // 0=Sun..6=Sat
  ymd: string; // YYYY-MM-DD
}

/**
 * Extract current calendar date & time in IST (Asia/Kolkata).
 */
export function getIstNowParts(now: Date = new Date()): IstDateParts {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1;
  const day = ist.getUTCDate();
  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();
  const dayOfWeek = ist.getUTCDay();
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, hour, minute, dayOfWeek, ymd };
}

/**
 * Validate and parse a YYYY-MM-DD calendar date strictly (rejects e.g. 2026-02-30).
 */
export function parseYmdStrict(ymd: string): { year: number; month: number; day: number } | null {
  const match = YMD_RE.exec(ymd);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/**
 * Add (or subtract) calendar days to a YYYY-MM-DD string.
 * 100% month-end, year-end, and leap-year safe (uses UTC calendar arithmetic).
 */
export function addDaysYmd(ymd: string, deltaDays: number): string {
  const parsed = parseYmdStrict(ymd);
  if (!parsed) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }
  const dt = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + deltaDays));
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get day of week (0=Sun..6=Sat) for a YYYY-MM-DD date string.
 */
export function getDayOfWeekYmd(ymd: string): number {
  const parsed = parseYmdStrict(ymd);
  if (!parsed) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
}

/**
 * Return tomorrow's YYYY-MM-DD date in IST (Asia/Kolkata).
 */
export function getTomorrowIstYmd(now: Date = new Date()): string {
  return addDaysYmd(getIstNowParts(now).ymd, 1);
}

/**
 * Compute the next scheduled delivery date after `currentYmd` based on subscription frequency.
 * Month-end & leap-year safe.
 */
export function computeNextDeliveryDate(currentYmd: string, frequency: SubscriptionFrequency): string {
  switch (frequency) {
    case 'daily':
      return addDaysYmd(currentYmd, 1);
    case 'alternate_days':
      return addDaysYmd(currentYmd, 2);
    case 'weekly':
      return addDaysYmd(currentYmd, 7);
    case 'weekdays': {
      let next = addDaysYmd(currentYmd, 1);
      let dow = getDayOfWeekYmd(next);
      while (dow === 0 || dow === 6) {
        next = addDaysYmd(next, 1);
        dow = getDayOfWeekYmd(next);
      }
      return next;
    }
  }
}

/**
 * Advance a subscription's next_delivery_date strictly past `processedYmd`.
 */
export function advanceNextDeliveryPast(currentNextYmd: string, processedYmd: string, frequency: SubscriptionFrequency): string {
  let cursor = currentNextYmd;
  let guard = 0;
  while (cursor <= processedYmd && guard < 400) {
    cursor = computeNextDeliveryDate(cursor, frequency);
    guard++;
  }
  return cursor;
}

/**
 * IST (Asia/Kolkata) Modification / Skip / Pause Cut-off Enforcement:
 *  - Morning slot (5:00 AM - 10:00 AM): cut-off is 9:00 PM IST the previous evening.
 *  - Evening slot (6:00 PM - 10:00 PM): cut-off is 4:00 PM IST the same day.
 *  - Past dates are never modifiable.
 */
export function checkIstCutoffForDate(
  targetYmd: string,
  slot: DeliverySlotCode = 'morning',
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  if (!parseYmdStrict(targetYmd)) {
    return { allowed: false, reason: 'Invalid calendar date. Use YYYY-MM-DD format.' };
  }

  const istNow = getIstNowParts(now);
  const todayYmd = istNow.ymd;
  const tomorrowYmd = addDaysYmd(todayYmd, 1);
  const currentMinutes = istNow.hour * 60 + istNow.minute;

  if (targetYmd < todayYmd) {
    return { allowed: false, reason: 'Cannot modify or skip a past delivery date.' };
  }

  if (slot === 'morning') {
    if (targetYmd === todayYmd) {
      return {
        allowed: false,
        reason: 'Morning delivery cut-off (9:00 PM IST previous night) has already passed for today.',
      };
    }
    if (targetYmd === tomorrowYmd && currentMinutes >= 21 * 60) {
      return {
        allowed: false,
        reason: 'Cut-off passed: Morning slot changes for tomorrow must be made before 9:00 PM IST.',
      };
    }
    return { allowed: true };
  }

  // Evening slot: cut-off 4:00 PM IST same day
  if (targetYmd === todayYmd && currentMinutes >= 16 * 60) {
    return {
      allowed: false,
      reason: 'Cut-off passed: Evening slot changes for today must be made before 4:00 PM IST.',
    };
  }

  return { allowed: true };
}
