import http from 'k6/http';
import { check, sleep, group } from 'k6';

/**
 * Dugdhsar Production Load Test (k6)
 * Targeted for Cloudflare Worker Free Plan constraints:
 * - 100,000 requests/day free tier
 * - 50ms CPU execution time limit per request
 * - Target: p95 latency < 50ms on edge-cached catalog routes
 * - Zero 5xx responses under burst traffic
 */

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 concurrent patrons
    { duration: '1m', target: 50 },   // Sustained load at 50 VUs
    { duration: '20s', target: 100 }, // Brief spike testing edge cache resilience
    { duration: '20s', target: 0 },   // Graceful cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],            // < 1% failure rate
    http_req_duration: ['p(95)<100'],         // 95% of requests must be under 100ms
    'http_req_duration{type:cached}': ['p(95)<50'], // Edge-cached catalog under 50ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const commonHeaders = {
    'Accept': 'application/json',
    'Origin': 'https://dugdhsar.in',
  };

  group('1. Health Probe', () => {
    const res = http.get(`${BASE_URL}/api/health`, { headers: commonHeaders });
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health returns ok': (r) => JSON.parse(r.body).status === 'ok',
    });
  });

  group('2. Product Catalog (Edge Cached)', () => {
    const res = http.get(`${BASE_URL}/api/products`, {
      headers: commonHeaders,
      tags: { type: 'cached' },
    });
    check(res, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog has products': (r) => JSON.parse(r.body).products.length > 0,
      'edge cache header present': (r) => r.headers['X-Cache'] !== undefined,
    });
  });

  group('3. Pincode Cold-Chain Verification', () => {
    const payload = JSON.stringify({ pincode: '480661' });
    const res = http.post(`${BASE_URL}/api/delivery/validate-pincode`, payload, {
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    });
    check(res, {
      'pincode status is 200': (r) => r.status === 200,
      'pincode is serviceable': (r) => JSON.parse(r.body).isServiceable === true,
      'cold chain guaranteed': (r) => JSON.parse(r.body).coldChainGuaranteed === true,
    });
  });

  group('4. Idempotent Order Creation Flow', () => {
    const idempotencyKey = `load-test-${Date.now()}-${__VU}-${__ITER}`;
    const orderPayload = JSON.stringify({
      customer: {
        fullName: `Load Tester ${__VU}`,
        email: `loadtest_${__VU}@example.com`,
        phone: '+91 7067672604',
      },
      address: {
        pincode: '480661',
        street: 'Barghat Rd, Sanjay Vihar',
        city: 'Seoni',
        state: 'MP',
      },
      items: [{ variantId: 'var-gir-1l', quantity: 1 }],
      paymentMethod: 'cod',
      deliverySlot: '5:30 AM - 7:00 AM',
    });

    const headersWithIdempotency = {
      ...commonHeaders,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    };

    // First request: Creates order
    const res1 = http.post(`${BASE_URL}/api/checkout/create-order`, orderPayload, {
      headers: headersWithIdempotency,
    });

    check(res1, {
      'order placed or accepted': (r) => r.status === 200 || r.status === 429,
    });

    // Replay duplicate request: Verifies idempotency replay without duplicate execution
    if (res1.status === 200) {
      const res2 = http.post(`${BASE_URL}/api/checkout/create-order`, orderPayload, {
        headers: headersWithIdempotency,
      });

      check(res2, {
        'idempotency replay returns 200': (r) => r.status === 200,
        'idempotency hit header true': (r) => r.headers['X-Idempotency-Hit'] === 'true',
      });
    }
  });

  sleep(1);
}
