import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSheetCell } from '../server/sheets';
import { isWithinDeliveryCutoff, getKolkataTimeParts, addDaysUtc } from '../server/lib/timezone';
import { verifyMetaHubSignature } from '../server/instagram';

describe('Phase 5: Deep Integrations & Geofencing Quality Suite', () => {
  // -------------------------------------------------------------------------
  // 1. Google Sheets Cell Formula Injection Protection
  // -------------------------------------------------------------------------
  describe('Google Sheets Security & CSV Injection Neutralization', () => {
    it('prefixes formula triggers (=, +, -, @, tab, cr) with single quote', () => {
      assert.strictEqual(sanitizeSheetCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
      assert.strictEqual(sanitizeSheetCell('+1234567890'), "'+1234567890");
      assert.strictEqual(sanitizeSheetCell('-1500'), "'-1500");
      assert.strictEqual(sanitizeSheetCell('@HYPERLINK("evil.com")'), "'@HYPERLINK(\"evil.com\")");
    });

    it('leaves standard customer text, phone, and addresses untouched', () => {
      assert.strictEqual(sanitizeSheetCell('Sufi Nagar, Seoni'), 'Sufi Nagar, Seoni');
      assert.strictEqual(sanitizeSheetCell('दुग्धसार गिर गाय दूध'), 'दुग्धसार गिर गाय दूध');
      assert.strictEqual(sanitizeSheetCell(480661), 480661);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Geolocation & Haversine Distance Calculation (Known Coordinates)
  // -------------------------------------------------------------------------
  describe('Map & Location Coordinates & 15km Delivery Radius Check', () => {
    // Official Dugdhsar Shop in Seoni: 22.085917° N, 79.557751° E (Plus Code 3HP5+948)
    const SHOP_LAT = 22.085917;
    const SHOP_LNG = 79.557751;
    const MAX_DELIVERY_RADIUS_KM = 15.0;

    /**
     * Standard Great-Circle Haversine distance formula in kilometers
     */
    function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // Earth's mean radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    it('verifies shop coordinates have at least 6 decimal precision', () => {
      const latDecimals = SHOP_LAT.toString().split('.')[1]?.length ?? 0;
      const lngDecimals = SHOP_LNG.toString().split('.')[1]?.length ?? 0;
      assert.ok(latDecimals >= 6, `Latitude decimal precision ${latDecimals} must be >= 6`);
      assert.ok(lngDecimals >= 6, `Longitude decimal precision ${lngDecimals} must be >= 6`);
    });

    it('approves delivery locations within 15km Seoni radius', () => {
      // Barghat Road Seoni local hub (~1.2 km away)
      const customerLoc1 = { lat: 22.091245, lng: 79.562130 };
      const dist1 = calculateDistanceKm(SHOP_LAT, SHOP_LNG, customerLoc1.lat, customerLoc1.lng);
      assert.ok(dist1 < 2.0);
      assert.strictEqual(dist1 <= MAX_DELIVERY_RADIUS_KM, true);

      // Chhapara road boundary (~11.5 km away)
      const customerLoc2 = { lat: 22.180000, lng: 79.540000 };
      const dist2 = calculateDistanceKm(SHOP_LAT, SHOP_LNG, customerLoc2.lat, customerLoc2.lng);
      assert.ok(dist2 < 15.0);
      assert.strictEqual(dist2 <= MAX_DELIVERY_RADIUS_KM, true);
    });

    it('rejects delivery locations outside 15km perimeter (e.g. Jabalpur or Nagpur)', () => {
      // Jabalpur (~140 km away)
      const jabalpur = { lat: 23.1815, lng: 79.9864 };
      const distJabalpur = calculateDistanceKm(SHOP_LAT, SHOP_LNG, jabalpur.lat, jabalpur.lng);
      assert.ok(distJabalpur > 100);
      assert.strictEqual(distJabalpur <= MAX_DELIVERY_RADIUS_KM, false);

      // Nagpur (~130 km away)
      const nagpur = { lat: 21.1458, lng: 79.0882 };
      const distNagpur = calculateDistanceKm(SHOP_LAT, SHOP_LNG, nagpur.lat, nagpur.lng);
      assert.ok(distNagpur > 100);
      assert.strictEqual(distNagpur <= MAX_DELIVERY_RADIUS_KM, false);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Subscription Calendar & Delivery Cut-Off Engine
  // -------------------------------------------------------------------------
  describe('Subscription Calendar Engine, Leap Years & Cut-off Times', () => {
    it('enforces 8:00 PM IST (20:00) cut-off time for tomorrow morning milk deliveries', () => {
      // 7:30 PM IST (14:00 UTC) -> Cut-off NOT passed (returns true)
      const beforeCutoff = new Date('2026-11-11T14:00:00.000Z');
      assert.strictEqual(isWithinDeliveryCutoff(beforeCutoff, 20), true);

      // 8:30 PM IST (15:00 UTC) -> Cut-off passed (returns false)
      const afterCutoff = new Date('2026-11-11T15:00:00.000Z');
      assert.strictEqual(isWithinDeliveryCutoff(afterCutoff, 20), false);
    });

    it('correctly calculates leap year February 29 date transitions', () => {
      // 2028 is a leap year; 2028-02-28 + 1 day = 2028-02-29
      const feb28Leap = new Date('2028-02-28T00:00:00.000Z');
      const feb29Leap = addDaysUtc(feb28Leap, 1);
      assert.strictEqual(feb29Leap.toISOString().split('T')[0], '2028-02-29');

      // Next day is March 1
      const mar01 = addDaysUtc(feb29Leap, 1);
      assert.strictEqual(mar01.toISOString().split('T')[0], '2028-03-01');
    });

    it('correctly calculates non-leap year month end (Jan 31 -> Feb 01 -> Mar 01)', () => {
      const jan31 = new Date('2027-01-31T00:00:00.000Z');
      const feb01 = addDaysUtc(jan31, 1);
      assert.strictEqual(feb01.toISOString().split('T')[0], '2027-02-01');

      // 2027 Feb has 28 days -> Feb 28 + 1 = March 01
      const feb28 = new Date('2027-02-28T00:00:00.000Z');
      const mar01 = addDaysUtc(feb28, 1);
      assert.strictEqual(mar01.toISOString().split('T')[0], '2027-03-01');
    });

    it('returns exact Asia/Kolkata date and time parts regardless of server timezone', () => {
      // UTC midnight is 5:30 AM in India
      const utcMidnight = new Date('2026-11-11T00:00:00.000Z');
      const parts = getKolkataTimeParts(utcMidnight);
      assert.strictEqual(parts.hours, 5);
      assert.strictEqual(parts.minutes, 30);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Instagram Webhook HMAC Signature Validation
  // -------------------------------------------------------------------------
  describe('Instagram Graph API Webhook Signature Integrity', () => {
    it('validates authentic payload with constant-time HMAC SHA-256', async () => {
      const rawPayload = JSON.stringify({ object: 'instagram', entry: [{ id: 'ig-123' }] });
      const testSecret = 'dugdhsar_ig_secret_key_2026';

      // Compute valid signature
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(testSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(rawPayload));
      const validHex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = await verifyMetaHubSignature(
        `sha256=${validHex}`,
        rawPayload,
        testSecret
      );
      assert.strictEqual(isValid, true);
    });

    it('rejects tampered or mismatched webhook payloads', async () => {
      const rawPayload = JSON.stringify({ object: 'instagram', entry: [] });
      const testSecret = 'dugdhsar_ig_secret_key_2026';

      const isValid = await verifyMetaHubSignature(
        'sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        rawPayload,
        testSecret
      );
      assert.strictEqual(isValid, false);
    });
  });
});
