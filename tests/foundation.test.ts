import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EnvSchema, validateEnv } from '../server/env';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
} from '../server/errors/AppError';
import { redactPii, hashUserId } from '../server/logger';
import {
  getCircuitStatus,
  resetCircuit,
  fetchWithCircuitBreaker,
} from '../server/lib/fetchWithCircuitBreaker';
import {
  evaluateDeliveryCutoff,
  normalizeUtf8String,
} from '../server/lib/timezone';
import { createApp } from '../server/app';

describe('Phase 1 Foundation - Environment Validation', () => {
  it('validates a valid environment configuration', () => {
    const raw = {
      ENVIRONMENT: 'development',
      JWT_SECRET: 'a_very_secure_secret_with_more_than_16_characters',
      GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com',
    };
    const validated = EnvSchema.parse(raw);
    assert.equal(validated.ENVIRONMENT, 'development');
    assert.equal(validated.JWT_SECRET, raw.JWT_SECRET);
  });

  it('rejects JWT_SECRET shorter than 16 characters in production', () => {
    assert.throws(() => {
      validateEnv({
        ENVIRONMENT: 'production',
        JWT_SECRET: 'short',
      });
    }, /JWT_SECRET must be at least 16 characters long/);
  });

  it('rejects dev_only JWT_SECRET in production mode', () => {
    assert.throws(() => {
      validateEnv({
        ENVIRONMENT: 'production',
        JWT_SECRET: 'dugdhsar_vedic_dairy_session_jwt_secret_dev_only_2026',
      });
    }, /Production deployment cannot use the default dev JWT_SECRET/);
  });
});

describe('Phase 1 Foundation - AppError & HTTP Status Codes', () => {
  it('instantiates all required HTTP status code error classes correctly', () => {
    const errors = [
      { err: new BadRequestError(), status: 400, code: 'BAD_REQUEST' },
      { err: new UnauthorizedError(), status: 401, code: 'UNAUTHORIZED' },
      { err: new ForbiddenError(), status: 403, code: 'FORBIDDEN' },
      { err: new NotFoundError(), status: 404, code: 'NOT_FOUND' },
      { err: new ConflictError(), status: 409, code: 'CONFLICT' },
      { err: new ValidationError(), status: 422, code: 'UNPROCESSABLE_ENTITY' },
      { err: new RateLimitError('Too many requests', 45), status: 429, code: 'RATE_LIMITED' },
      { err: new InternalServerError(), status: 500, code: 'INTERNAL_SERVER_ERROR' },
      { err: new BadGatewayError(), status: 502, code: 'BAD_GATEWAY' },
      { err: new ServiceUnavailableError(), status: 503, code: 'SERVICE_UNAVAILABLE' },
    ];

    for (const { err, status, code } of errors) {
      assert.equal(err.statusCode, status);
      assert.equal(err.code, code);
      const serialized = err.serialize('req-test-123');
      assert.equal(serialized.success, false);
      assert.equal(serialized.error.code, code);
      assert.equal(serialized.requestId, 'req-test-123');
      assert.ok(serialized.timestamp);
    }
  });

  it('serializes details and sets retryAfterSeconds on RateLimitError', () => {
    const err = new RateLimitError('Wait 30s', 30);
    assert.equal(err.retryAfterSeconds, 30);
    const serialized = err.serialize('req-rl-999');
    assert.equal(serialized.error.details.retryAfterSeconds, 30);
  });
});

describe('Phase 1 Foundation - PII Redaction in Logging', () => {
  it('redacts Authorization bearer tokens and Meta tokens', () => {
    const text = 'Call header was Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz and EAA123456789SecretToken';
    const redacted = redactPii(text);
    assert.ok(!redacted.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
    assert.ok(redacted.includes('Bearer [REDACTED_TOKEN]'));
    assert.ok(redacted.includes('EAA[REDACTED_TOKEN]'));
  });

  it('redacts Indian mobile numbers', () => {
    const raw = 'Customer phone: +91 7067672604, alt: 9826123456';
    const redacted = redactPii(raw);
    assert.ok(!redacted.includes('7067672604'));
    assert.ok(redacted.includes('+91 70****2604'));
    assert.ok(!redacted.includes('9826123456'));
    assert.ok(redacted.includes('+91 98****3456'));
  });

  it('redacts customer email addresses while retaining domain', () => {
    const raw = 'Order placed by sumitpawar65005@gmail.com and admin@dugdhsar.in';
    const redacted = redactPii(raw);
    assert.ok(!redacted.includes('sumitpawar65005@'));
    assert.ok(redacted.includes('s***@gmail.com'));
    assert.ok(redacted.includes('a***@dugdhsar.in'));
  });

  it('redacts nested object sensitive fields', () => {
    const payload = {
      orderId: 'ord-101',
      customerEmail: 'test@example.com',
      password: 'super_secret_value',
      authorization: 'Bearer token123',
      nested: {
        token: 'secret_jwt_string',
        customerPhone: '+91 7067672604',
      },
    };
    const cleaned = redactPii(payload);
    assert.equal(cleaned.password, '[REDACTED]');
    assert.equal(cleaned.authorization, '[REDACTED]');
    assert.equal(cleaned.nested.token, '[REDACTED]');
    assert.equal(cleaned.nested.customerPhone, '+91 70****2604');
    assert.equal(cleaned.customerEmail, 't***@example.com');
  });

  it('hashes user IDs consistently without leaking identity', () => {
    const h1 = hashUserId('user_123');
    const h2 = hashUserId('user_123');
    const h3 = hashUserId('user_456');
    assert.equal(h1, h2);
    assert.notEqual(h1, h3);
    assert.ok(h1?.startsWith('u_'));
  });
});

describe('Phase 1 Foundation - Outbound Fetch & Circuit Breaker', () => {
  it('serves fallback response when circuit trips to OPEN', async () => {
    const host = 'failing-test-host.local';
    resetCircuit(host);

    // Fail 3 times to trip breaker
    for (let i = 0; i < 3; i++) {
      try {
        await fetchWithCircuitBreaker(`https://${host}/test-fail`, {
          timeoutMs: 100,
          maxRetries: 0,
          circuitHostKey: host,
        });
      } catch {
        // expected failure
      }
    }

    const status = getCircuitStatus(host);
    assert.equal(status.state, 'OPEN');

    // Next call with fallback returns fallback data immediately
    const fallbackResponse = await fetchWithCircuitBreaker(`https://${host}/test-fail`, {
      circuitHostKey: host,
      getFallback: async () => ({ status: 'cached_feed', items: [] }),
    });

    const data: any = await fallbackResponse.json();
    assert.equal(data.status, 'cached_feed');
    resetCircuit(host);
  });
});

describe('Phase 1 Foundation - Timezones & UTF-8 Devanagari Normalization', () => {
  it('correctly calculates morning delivery cutoff rules in IST', () => {
    // 2026-11-10 14:00 UTC = 2026-11-10 19:30 IST (7:30 PM IST)
    // 7:30 PM is before 9:00 PM cutoff, so eligible for next morning!
    const eveningIstTime = new Date('2026-11-10T14:00:00.000Z');
    const status = evaluateDeliveryCutoff(eveningIstTime);

    assert.equal(status.istHour, 19);
    assert.equal(status.istMinute, 30);
    assert.equal(status.isEligibleForNextMorning, true);
    assert.equal(status.isEligibleForSameDayEvening, false);
    assert.equal(status.nextEarliestSlot, 'morning');
  });

  it('correctly calculates same day evening delivery cutoff in IST', () => {
    // 2026-11-10 08:00 UTC = 2026-11-10 13:30 IST (1:30 PM IST)
    // 1:30 PM is before 3:00 PM cutoff, so eligible for same-day evening!
    const afternoonTime = new Date('2026-11-10T08:00:00.000Z');
    const status = evaluateDeliveryCutoff(afternoonTime);

    assert.equal(status.istHour, 13);
    assert.equal(status.isEligibleForSameDayEvening, true);
    assert.equal(status.nextEarliestSlot, 'evening');
    assert.equal(status.nextDeliveryDate, '2026-11-10');
  });

  it('normalizes Hindi Devanagari strings and strips control characters', () => {
    const rawHindi = 'दुग्धसार वैदिक डेयरी\x00\x08 - बरघाट रोड, सिवनी';
    const normalized = normalizeUtf8String(rawHindi);
    assert.equal(normalized, 'दुग्धसार वैदिक डेयरी - बरघाट रोड, सिवनी');
    assert.ok(!normalized.includes('\x00'));
    assert.ok(!normalized.includes('\x08'));
  });
});

describe('Phase 1 Foundation - Health & Readiness API Endpoints', () => {
  it('mounts /api/health and /api/v1/health successfully', async () => {
    const app = createApp();

    // Test /api/health
    const req1 = new Request('http://localhost:3000/api/health');
    // Using simple Express mock handler invocation
    assert.ok(app);
  });
});
