import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { repoForUser } from '../server/db/scopedRepo';
import { validateOutboundUrl } from '../server/lib/ssrf';
import { safeJsonLdString } from '../src/lib/seo';
import { isAllowedOrigin } from '../server/middleware/csrf';
import { recordFailedAuthAttempt, checkAccountLockout, resetAuthLockout } from '../server/middleware/rateLimit';
import { allocateInventoryFefo } from '../server/services/orderService';
import { ForbiddenError, BadRequestError } from '../server/errors/AppError';
import { AuthUser } from '../server/types';
import { Order, InventoryBatch } from '../src/types';

describe('Phase 7: OWASP Top 10 Security & Penetration Testing Suite', () => {
  const patronAlice: AuthUser = {
    id: 'usr-alice-101',
    email: 'alice@example.com',
    fullName: 'Alice Patel',
    role: 'customer',
  };

  const patronBob: AuthUser = {
    id: 'usr-bob-202',
    email: 'bob@example.com',
    fullName: 'Bob Sharma',
    role: 'customer',
  };

  const dealerSeoni: AuthUser = {
    id: 'dealer-seoni-303',
    email: 'dealer@dugdhsar.in',
    fullName: 'Seoni Cold-Chain Dealer',
    role: 'dealer',
    dealerId: 'dealer-seoni',
    assignedPincodes: ['480661'],
  };

  const ordersDatabase: Order[] = [
    {
      id: 'ord-alice-001',
      orderNumber: 'DUG-ALICE-1',
      userId: patronAlice.id,
      customerId: patronAlice.id,
      customerName: patronAlice.fullName,
      customerEmail: patronAlice.email,
      customerPhone: '+91 9876543210',
      status: 'confirmed',
      items: [],
      subtotalPaise: 11000,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      totalPaise: 11000,
      paymentMethod: 'cod',
      paymentStatus: 'due_on_delivery',
      deliveryAddress: { pincode: '480661' } as any,
      deliveryPincode: '480661',
      estimatedDelivery: 'Tomorrow',
      deliverySlot: '5:30 AM - 7:00 AM',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ord-bob-002',
      orderNumber: 'DUG-BOB-2',
      userId: patronBob.id,
      customerId: patronBob.id,
      customerName: patronBob.fullName,
      customerEmail: patronBob.email,
      customerPhone: '+91 9123456789',
      status: 'confirmed',
      items: [],
      subtotalPaise: 22000,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      totalPaise: 22000,
      paymentMethod: 'upi',
      paymentStatus: 'captured',
      deliveryAddress: { pincode: '480881' } as any, // Outside Seoni territory
      deliveryPincode: '480881',
      estimatedDelivery: 'Tomorrow',
      deliverySlot: '5:30 AM - 7:00 AM',
      createdAt: new Date().toISOString(),
    },
  ];

  // -------------------------------------------------------------------------
  // 1. A01: Broken Access Control & IDOR Simulation
  // -------------------------------------------------------------------------
  describe('A01: Broken Access Control (IDOR & Privilege Escalation)', () => {
    it('simulates IDOR: Patron Alice attempting to read Patron Bob order is blocked with ForbiddenError', () => {
      const aliceRepo = repoForUser(patronAlice, { orders: ordersDatabase, subscriptions: [] });

      // Alice can read her own order
      const aliceOrder = aliceRepo.orders.findById('ord-alice-001');
      assert.strictEqual(aliceOrder.id, 'ord-alice-001');

      // Alice attempting to fetch Bob's order MUST throw ForbiddenError
      assert.throws(() => {
        aliceRepo.orders.findById('ord-bob-002');
      }, ForbiddenError);
    });

    it('simulates Privilege Escalation: Customer attempting to mutate order delivery status is blocked', () => {
      const aliceRepo = repoForUser(patronAlice, { orders: ordersDatabase, subscriptions: [] });

      assert.throws(() => {
        aliceRepo.orders.updateStatus('ord-alice-001', 'delivered');
      }, ForbiddenError);
    });

    it('simulates Territory Boundary: Dealer cannot view orders outside their assigned pincodes', () => {
      const dealerRepo = repoForUser(dealerSeoni, { orders: ordersDatabase, subscriptions: [] });

      // Dealer can see Alice's order (Pincode 480661 in territory)
      const allowedOrder = dealerRepo.orders.findById('ord-alice-001');
      assert.strictEqual(allowedOrder.id, 'ord-alice-001');

      // Dealer CANNOT see Bob's order (Pincode 480881 outside territory)
      assert.throws(() => {
        dealerRepo.orders.findById('ord-bob-002');
      }, ForbiddenError);
    });
  });

  // -------------------------------------------------------------------------
  // 2. A03: Injection & XSS Neutralization
  // -------------------------------------------------------------------------
  describe('A03: Injection & Anti-XSS Sanitization', () => {
    it('neutralizes malicious XSS script injection in JSON-LD structured data', () => {
      const maliciousPayload = {
        name: 'Vedic Milk <script>alert("XSS")</script>',
        description: '"><img src=x onerror=alert("HACKED")>',
        nested: 'Hello </script><script>stealCookies()</script>',
      };

      const safeOutput = safeJsonLdString(maliciousPayload);

      // Raw dangerous HTML/script tags MUST NOT exist in output
      assert.ok(!safeOutput.includes('<script>'));
      assert.ok(!safeOutput.includes('</script>'));
      assert.ok(!safeOutput.includes('<img'));

      // Escaped unicode representations MUST exist
      assert.ok(safeOutput.includes('\\u003cscript\\u003e'));
      assert.ok(safeOutput.includes('\\u003c/script\\u003e'));
      assert.ok(safeOutput.includes('\\u003cimg'));
    });
  });

  // -------------------------------------------------------------------------
  // 3. A10: Server-Side Request Forgery (SSRF) Defense
  // -------------------------------------------------------------------------
  describe('A10: Server-Side Request Forgery (SSRF) Defense', () => {
    it('blocks Cloud Metadata IP (169.254.169.254) theft attempts', () => {
      assert.throws(() => {
        validateOutboundUrl('http://169.254.169.254/latest/meta-data/');
      }, BadRequestError);
    });

    it('blocks private RFC 1918 internal IP ranges and loopbacks', () => {
      // Loopback
      assert.throws(() => validateOutboundUrl('http://127.0.0.1:8787/api/debug'), BadRequestError);
      assert.throws(() => validateOutboundUrl('http://localhost:3000/internal'), BadRequestError);

      // RFC 1918 Private Ranges
      assert.throws(() => validateOutboundUrl('https://10.0.0.1/admin'), BadRequestError);
      assert.throws(() => validateOutboundUrl('https://172.16.0.5/secrets'), BadRequestError);
      assert.throws(() => validateOutboundUrl('https://192.168.1.1/router'), BadRequestError);
    });

    it('rejects disallowed schemes (file:, gopher:, ftp:)', () => {
      assert.throws(() => validateOutboundUrl('file:///etc/passwd'), BadRequestError);
      assert.throws(() => validateOutboundUrl('ftp://internal-server.local/'), BadRequestError);
    });
  });

  // -------------------------------------------------------------------------
  // 4. CSRF Cross-Site Request Forgery Protection
  // -------------------------------------------------------------------------
  describe('CSRF Cross-Site Request Forgery Defense', () => {
    it('rejects mutating requests from unauthorized origins', () => {
      assert.strictEqual(isAllowedOrigin('https://malicious-attacker.com'), false);
      assert.strictEqual(isAllowedOrigin('https://dugdhsar.in.evil.com'), false);
      assert.strictEqual(isAllowedOrigin('http://dugdhsar.in'), false); // Non-HTTPS disallowed
    });

    it('accepts authentic production and preview origins', () => {
      assert.strictEqual(isAllowedOrigin('https://dugdhsar.in'), true);
      assert.strictEqual(isAllowedOrigin('https://www.dugdhsar.in'), true);
      assert.strictEqual(isAllowedOrigin('http://localhost:3000'), true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Brute Force & Account Lockout Defense
  // -------------------------------------------------------------------------
  describe('A07: Brute-Force & Credential Stuffing Account Lockout', () => {
    const testIp = '198.51.100.42';

    beforeEach(() => {
      resetAuthLockout(testIp);
    });

    it('locks account for 15 minutes after 5 consecutive failed authentication attempts', () => {
      // Attempts 1 to 4: not locked yet
      for (let i = 1; i <= 4; i++) {
        const result = recordFailedAuthAttempt(testIp);
        assert.strictEqual(result.isLocked, false);
      }

      // 5th attempt: triggers lock
      const fifthAttempt = recordFailedAuthAttempt(testIp);
      assert.strictEqual(fifthAttempt.isLocked, true);
      assert.ok((fifthAttempt.lockRemainingSeconds ?? 0) > 800); // ~900s (15 mins)

      // Subsequent check confirms locked status
      const lockCheck = checkAccountLockout(testIp);
      assert.strictEqual(lockCheck.isLocked, true);
    });

    it('resets lockout count upon successful authentication', () => {
      recordFailedAuthAttempt(testIp);
      recordFailedAuthAttempt(testIp);
      resetAuthLockout(testIp);

      const status = checkAccountLockout(testIp);
      assert.strictEqual(status.isLocked, false);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Concurrency, Over-selling & Negative Inventory Defense
  // -------------------------------------------------------------------------
  describe('A04: Concurrency & Negative Stock Allocation Defense', () => {
    it('prevents overselling when concurrent checkouts exceed fresh batch stock', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const testBatches: InventoryBatch[] = [
        {
          id: 'batch-test-fefo',
          batchNumber: 'B-TEST',
          variantId: 'var-gir-1l',
          mfgDate: '2026-11-10T04:00:00Z',
          expiryDate: tomorrow,
          initialQuantity: 5,
          onHandQuantity: 5,
          reservedQuantity: 0,
          coldChainTempC: 3.0,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const context = { batches: testBatches, movements: [] };

      // 1. Checkout 1: Requests 4 units -> Success, 1 remains
      const alloc1 = allocateInventoryFefo('var-gir-1l', 4, context, 'order-concurrent-1');
      assert.strictEqual(alloc1.totalAllocated, 4);
      assert.strictEqual(testBatches[0].onHandQuantity, 1);

      // 2. Checkout 2: Requests 2 units -> Must be atomically rejected with BadRequestError
      assert.throws(() => {
        allocateInventoryFefo('var-gir-1l', 2, context, 'order-concurrent-2');
      }, BadRequestError);

      // Stock must remain intact at 1 unit without corruption
      assert.strictEqual(testBatches[0].onHandQuantity, 1);
    });
  });
});
