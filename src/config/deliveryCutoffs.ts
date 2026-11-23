/**
 * Single source of truth for Dugdhsar order, pause, and skip delivery cut-offs.
 *
 * Matches the Cloudflare D1 `site_settings` (`delivery_slots`) configuration:
 * - Morning delivery (05:00 - 10:00 IST): 21:00 IST previous evening (9:00 PM IST)
 * - Evening delivery (18:00 - 22:00 IST): 16:00 IST same day (4:00 PM IST)
 *
 * Shared across frontend pages (legal policies, FAQ, delivery slots) and
 * backend IST date/cut-off enforcement (`server/lib/istDate.ts`, `server/lib/timezone.ts`).
 */

export interface DeliverySlotCutoffConfig {
  id: 'morning' | 'evening';
  name: string;
  windowLabel: string;
  /** 24-hour HH:mm string matching D1 `site_settings` `cutoff` field (IST). */
  cutoffIst24h: string;
  cutoffHourIst: number;
  cutoffMinuteIst: number;
  /** Human-readable cut-off time in IST. */
  cutoffLabel: string;
  /** Compact cut-off label used in slot selectors and cards. */
  shortLabel: string;
}

export const DELIVERY_CUTOFFS = {
  timezone: 'Asia/Kolkata',
  timezoneAbbr: 'IST',
  morning: {
    id: 'morning',
    name: 'Morning Delivery',
    windowLabel: '5:00 AM – 10:00 AM IST',
    cutoffIst24h: '21:00',
    cutoffHourIst: 21,
    cutoffMinuteIst: 0,
    cutoffLabel: '9:00 PM IST (previous evening)',
    shortLabel: '9:00 PM IST previous night',
  } satisfies DeliverySlotCutoffConfig,
  evening: {
    id: 'evening',
    name: 'Evening Delivery',
    windowLabel: '6:00 PM – 10:00 PM IST',
    cutoffIst24h: '16:00',
    cutoffHourIst: 16,
    cutoffMinuteIst: 0,
    cutoffLabel: '4:00 PM IST (same day)',
    shortLabel: '4:00 PM IST same day',
  } satisfies DeliverySlotCutoffConfig,
  /** Combined human-readable policy summary used across Terms, Cancellation, Shipping, and FAQ. */
  summaryText:
    '9:00 PM IST (previous evening) for morning deliveries and 4:00 PM IST (same day) for evening deliveries',
  /** Compact combined cut-off label. */
  shortSummaryText: '9:00 PM IST (morning slot) / 4:00 PM IST (evening slot)',
} as const;
