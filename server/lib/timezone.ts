/**
 * DUGDHSAR Timezone (IST) & UTF-8 Normalization Engine
 * 
 * - All storage & wire protocols use UTC ISO-8601 timestamps
 * - Delivery cut-offs and driver dispatches evaluate strictly in Asia/Kolkata (IST, UTC+05:30)
 * - Safe UTF-8 normalization guarantees Hindi / Devanagari script integrity
 */

import { DELIVERY_CUTOFFS } from '../../src/config/deliveryCutoffs';

export const TIMEZONE_IST = DELIVERY_CUTOFFS.timezone;
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30

/**
 * Returns current timestamp in UTC ISO-8601 format
 */
export function getUtcIsoTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Converts any timestamp or date into IST Date representation
 */
export function getIstDate(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MS);
}

export interface IstDeliveryStatus {
  istDateString: string; // e.g. "2026-11-11"
  istTimeString: string; // e.g. "20:45:12"
  istHour: number;
  istMinute: number;
  isEligibleForNextMorning: boolean; // Cutoff: 21:00 (9:00 PM IST)
  isEligibleForSameDayEvening: boolean; // Cutoff: 16:00 (4:00 PM IST)
  nextEarliestSlot: 'morning' | 'evening';
  nextDeliveryDate: string; // YYYY-MM-DD
}

/**
 * Evaluates milk delivery cutoff rules according to Seoni cold-chain logistics
 * (synced with `src/config/deliveryCutoffs.ts` and D1 `site_settings`):
 *
 * Rules:
 * 1. Morning dispatch (05:00 - 10:00 AM): Order must be received before 21:00 (9:00 PM) previous night.
 * 2. Evening dispatch (18:00 - 22:00 PM): Order must be received before 16:00 (4:00 PM) same day.
 */
export function evaluateDeliveryCutoff(currentTime: Date = new Date()): IstDeliveryStatus {
  const ist = getIstDate(currentTime);

  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  const istDateString = `${year}-${month}-${day}`;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const seconds = ist.getSeconds();
  const istTimeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const eveningHour = DELIVERY_CUTOFFS.evening.cutoffHourIst;
  const eveningMinute = DELIVERY_CUTOFFS.evening.cutoffMinuteIst;
  const morningHour = DELIVERY_CUTOFFS.morning.cutoffHourIst;
  const morningMinute = DELIVERY_CUTOFFS.morning.cutoffMinuteIst;

  const isEligibleForSameDayEvening =
    hours < eveningHour || (hours === eveningHour && minutes <= eveningMinute);
  const isEligibleForNextMorning =
    hours < morningHour || (hours === morningHour && minutes <= morningMinute);

  let nextEarliestSlot: 'morning' | 'evening';
  let targetDate = new Date(ist);

  if (isEligibleForSameDayEvening) {
    // Before 4:00 PM IST: Same day evening is earliest
    nextEarliestSlot = 'evening';
  } else if (isEligibleForNextMorning) {
    // Between 4:00 PM and 9:00 PM IST: Next morning is earliest
    nextEarliestSlot = 'morning';
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    // After 9:00 PM IST: Next day evening is earliest
    nextEarliestSlot = 'evening';
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const nextYear = targetDate.getFullYear();
  const nextMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const nextDay = String(targetDate.getDate()).padStart(2, '0');
  const nextDeliveryDate = `${nextYear}-${nextMonth}-${nextDay}`;

  return {
    istDateString,
    istTimeString,
    istHour: hours,
    istMinute: minutes,
    isEligibleForNextMorning,
    isEligibleForSameDayEvening,
    nextEarliestSlot,
    nextDeliveryDate,
  };
}

/**
 * Ensures UTF-8 normalization (NFC) and preserves Hindi Devanagari Unicode characters
 * (e.g. 'दुग्धसार', 'संजय विहार', 'शुक्ला फार्म') without mojibake or corrupt control bytes.
 */
export function normalizeUtf8String(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  // Normalize Unicode to Canonical Decomposition followed by Canonical Composition (NFC)
  const normalized = str.normalize('NFC');
  // Strip non-printable ASCII control characters (keeping newline, carriage return, tab, and full Unicode space)
  return normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Returns true if current time is before the daily cut-off hour in IST
 * (default: `DELIVERY_CUTOFFS.morning.cutoffHourIst` = 21 = 9:00 PM IST).
 */
export function isWithinDeliveryCutoff(
  currentTime: Date = new Date(),
  cutoffHour = DELIVERY_CUTOFFS.morning.cutoffHourIst
): boolean {
  const ist = getIstDate(currentTime);
  return ist.getHours() < cutoffHour;
}

/**
 * Returns exact Asia/Kolkata date and time parts
 */
export function getKolkataTimeParts(currentTime: Date = new Date()): { hours: number; minutes: number; day: number; month: number; year: number } {
  const ist = getIstDate(currentTime);
  return {
    hours: ist.getHours(),
    minutes: ist.getMinutes(),
    day: ist.getDate(),
    month: ist.getMonth() + 1,
    year: ist.getFullYear(),
  };
}

/**
 * Adds days in UTC calendar logic
 */
export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

