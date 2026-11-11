import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { allocateInventoryFefo, softDeleteOrder, softDeleteSubscription, InventoryContext } from '../server/services/orderService';
import { getCached, setCached, invalidateCatalogCache, CACHE_KEYS } from '../server/services/cacheService';
import { idempotencyMiddleware, computeRequestHash } from '../server/middleware/idempotency';
import { repoForUser } from '../server/db/scopedRepo';
import { InventoryBatch, Order, Subscription } from '../src/types';
import { AuthUser } from '../server/types';
import { ConflictError, BadRequestError } from '../server/errors/AppError';

describe('Phase 4: Persistence, Concurrency, Idempotency & Caching', () => {
  const dummyEnv = {
    JWT_SECRET: 'super-secret-key-that-is-at-least-32-chars-long!',
    CACHE: {
      store: new Map<string, string>(),
      async get(key: string) {
        return this.store.get(key) || null;
      },
      async put(key: string, val: string, _opts?: any) {
        this.store.set(key, val);
      },
      async delete(key: string) {
        this.store.delete(key);
      }
    }
  } as any;

  beforeEach(() => {
    dummyEnv.CACHE.store.clear();
  });

  // -------------------------------------------------------------------------
  // 1. D1 SQLite 3NF Database Migration Schema
  // -------------------------------------------------------------------------
  describe('D1 SQLite Database Migration Schema', () => {
    it('should have migrations/0001_initial.sql containing 3NF schema tables and indexes', () => {
      const migrationPath = path.resolve(process.cwd(), 'migrations/0001_initial.sql');
      assert.strictEqual(fs.existsSync(migrationPath), true);

      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS users'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS products'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS product_variants'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS inventory_batches'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS inventory_movements'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS orders'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS order_items'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS subscriptions'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS idempotency_keys'));
      assert.ok(sql.includes('deleted_at'));
      assert.ok(sql.includes('idx_orders_customer'));
      assert.ok(sql.includes('idx_batches_variant_expiry'));
    });
  });

  // -------------------------------------------------------------------------
  // 2. Concurrency-Safe FEFO (First-Expired, First-Out) Inventory Allocation
  // -------------------------------------------------------------------------
  describe('FEFO Inventory Deduction', () => {
    it('should deduct from earliest expiring batch first', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString();

      const batches: InventoryBatch[] = [
        {
          id: 'batch-later',
          variantId: 'var-1L',
          batchNumber: 'B-002',
          mfgDate: '2026-11-10T04:00:00Z',
          expiryDate: inThreeDays,
          initialQuantity: 10,
          onHandQuantity: 10,
          reservedQuantity: 0,
          coldChainTempC: 3.2,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'batch-earlier',
          variantId: 'var-1L',
          batchNumber: 'B-001',
          mfgDate: '2026-11-09T04:00:00Z',
          expiryDate: tomorrow,
          initialQuantity: 5,
          onHandQuantity: 5,
          reservedQuantity: 0,
          coldChainTempC: 3.0,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const context: InventoryContext = {
        batches,
        movements: []
      };

      // Request 7 units: should take all 5 from batch-earlier and 2 from batch-later
      const allocation = allocateInventoryFefo('var-1L', 7, context, 'order-test-1');

      assert.strictEqual(allocation.totalAllocated, 7);
      assert.deepStrictEqual(allocation.allocatedBatchIds, ['batch-earlier', 'batch-later']);

      const bEarlier = batches.find(b => b.id === 'batch-earlier')!;
      const bLater = batches.find(b => b.id === 'batch-later')!;

      assert.strictEqual(bEarlier.onHandQuantity, 0);
      assert.strictEqual(bEarlier.status, 'depleted');
      assert.strictEqual(bLater.onHandQuantity, 8);
      assert.strictEqual(bLater.status, 'active');

      // Verify audit movement was recorded
      assert.strictEqual(context.movements.length, 2);
      assert.strictEqual(context.movements[0].delta, -5);
      assert.strictEqual(context.movements[1].delta, -2);
    });

    it('should throw BadRequestError if requested stock exceeds total available', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const batches: InventoryBatch[] = [
        {
          id: 'batch-small',
          variantId: 'var-1L',
          batchNumber: 'B-SMALL',
          mfgDate: '2026-11-09T04:00:00Z',
          expiryDate: tomorrow,
          initialQuantity: 3,
          onHandQuantity: 3,
          reservedQuantity: 1, // only 2 available
          coldChainTempC: 3.1,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const context: InventoryContext = { batches, movements: [] };

      assert.throws(() => {
        allocateInventoryFefo('var-1L', 5, context, 'order-overflow');
      }, /Insufficient fresh cold-chain stock/);
    });

    it('should skip quarantined and expired batches', () => {
      const expiredDate = new Date(Date.now() - 86400000).toISOString();
      const validDate = new Date(Date.now() + 86400000).toISOString();

      const batches: InventoryBatch[] = [
        {
          id: 'batch-expired',
          variantId: 'var-1L',
          batchNumber: 'B-EXPIRED',
          mfgDate: '2026-11-01T04:00:00Z',
          expiryDate: expiredDate,
          initialQuantity: 50,
          onHandQuantity: 50,
          reservedQuantity: 0,
          coldChainTempC: 3.0,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'batch-quarantined',
          variantId: 'var-1L',
          batchNumber: 'B-QUARANTINED',
          mfgDate: '2026-11-10T04:00:00Z',
          expiryDate: validDate,
          initialQuantity: 50,
          onHandQuantity: 50,
          reservedQuantity: 0,
          coldChainTempC: 5.5,
          status: 'active',
          isQuarantined: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'batch-valid',
          variantId: 'var-1L',
          batchNumber: 'B-VALID',
          mfgDate: '2026-11-10T04:00:00Z',
          expiryDate: validDate,
          initialQuantity: 10,
          onHandQuantity: 10,
          reservedQuantity: 0,
          coldChainTempC: 3.2,
          status: 'active',
          isQuarantined: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const context: InventoryContext = { batches, movements: [] };
      const allocation = allocateInventoryFefo('var-1L', 5, context, 'order-valid-only');

      assert.deepStrictEqual(allocation.allocatedBatchIds, ['batch-valid']);
      const validBatch = batches.find(b => b.id === 'batch-valid')!;
      assert.strictEqual(validBatch.onHandQuantity, 5);
    });
  });

  // -------------------------------------------------------------------------
  // 3. 24-Hour Idempotency Replay & Conflict Protection
  // -------------------------------------------------------------------------
  describe('Idempotency Replay and Conflict Protection', () => {
    it('computes deterministic SHA-256 request hash regardless of key order', async () => {
      const hash1 = await computeRequestHash('POST', '/api/orders', { b: 2, a: 1 });
      const hash2 = await computeRequestHash('POST', '/api/orders', { a: 1, b: 2 });
      assert.strictEqual(hash1, hash2);
    });

    it('rejects keys that are too short (< 8 chars)', async () => {
      const middleware = idempotencyMiddleware();
      const mockReq = {
        method: 'POST',
        headers: { 'idempotency-key': 'short' },
        url: '/api/orders',
        body: {}
      } as any;
      const mockRes = {} as any;

      let errorCaught: any = null;
      await middleware(mockReq, mockRes, (err) => {
        errorCaught = err;
      });

      assert.ok(errorCaught instanceof BadRequestError);
      assert.ok(errorCaught.message.includes('between 8 and 128 characters'));
    });

    it('records and replays responses with X-Idempotency-Hit: true on repeated request', async () => {
      const middleware = idempotencyMiddleware();
      const key = `idem-test-${Date.now()}`;
      const payload = { items: [{ id: 1 }] };

      // 1. First execution
      let firstNextCalled = false;
      const mockReq1 = {
        method: 'POST',
        headers: { 'idempotency-key': key },
        url: '/api/orders',
        body: payload,
        env: dummyEnv
      } as any;

      let capturedBody1: any = null;
      const headers1: Record<string, string> = {};
      const mockRes1: any = {
        statusCode: 200,
        headers: headers1,
        setHeader: (k: string, v: string) => { headers1[k.toLowerCase()] = v; },
        json: function(b: any) {
          capturedBody1 = b;
          return this;
        },
        send: function(b: any) {
          capturedBody1 = b;
          return this;
        }
      };

      await middleware(mockReq1, mockRes1, () => {
        firstNextCalled = true;
      });

      assert.strictEqual(firstNextCalled, true);
      mockRes1.json({ success: true, orderId: 'ord-123' });
      assert.deepStrictEqual(capturedBody1, { success: true, orderId: 'ord-123' });

      // 2. Second execution with identical payload -> should intercept without calling next()
      let secondNextCalled = false;
      const mockReq2 = {
        method: 'POST',
        headers: { 'idempotency-key': key },
        url: '/api/orders',
        body: payload,
        env: dummyEnv
      } as any;

      let replayBody: any = null;
      let replayStatus = 0;
      const headers2: Record<string, string> = {};
      const mockRes2: any = {
        statusCode: 200,
        status: (s: number) => { replayStatus = s; },
        setHeader: (k: string, v: string) => { headers2[k.toLowerCase()] = v; },
        send: (b: any) => { replayBody = b; }
      };

      await middleware(mockReq2, mockRes2, () => {
        secondNextCalled = true;
      });

      assert.strictEqual(secondNextCalled, false);
      assert.strictEqual(headers2['x-idempotency-hit'], 'true');
      assert.strictEqual(JSON.parse(replayBody).orderId, 'ord-123');
    });

    it('rejects with ConflictError when idempotency key is reused with different request payload', async () => {
      const middleware = idempotencyMiddleware();
      const key = `idem-conflict-${Date.now()}`;

      // 1. First execution
      const mockReq1 = {
        method: 'POST',
        headers: { 'idempotency-key': key },
        url: '/api/orders',
        body: { amount: 100 },
        env: dummyEnv
      } as any;

      const mockRes1: any = {
        statusCode: 200,
        setHeader: () => {},
        json: function() { return this; },
        send: function() { return this; }
      };

      await middleware(mockReq1, mockRes1, () => {});
      mockRes1.json({ success: true });

      // 2. Second execution with modified body
      const mockReq2 = {
        method: 'POST',
        headers: { 'idempotency-key': key },
        url: '/api/orders',
        body: { amount: 500 }, // Tampered!
        env: dummyEnv
      } as any;

      let conflictError: any = null;
      await middleware(mockReq2, mockRes1, (err) => {
        conflictError = err;
      });

      assert.ok(conflictError instanceof ConflictError);
      assert.ok(conflictError.message.includes('Idempotency conflict'));
    });
  });

  // -------------------------------------------------------------------------
  // 4. Edge Catalog Caching & Event-Driven Invalidation
  // -------------------------------------------------------------------------
  describe('Edge Catalog Caching', () => {
    it('sets and retrieves cached catalog objects with fallback', async () => {
      await setCached(CACHE_KEYS.PRODUCTS, { products: [{ id: 'prod-1', name: 'Gir Milk' }] }, dummyEnv, 300);
      const cached = await getCached<any>(CACHE_KEYS.PRODUCTS, dummyEnv);
      assert.ok(cached);
      assert.strictEqual(cached.products[0].name, 'Gir Milk');
    });

    it('should purge catalog cache when invalidateCatalogCache is called', async () => {
      await setCached(CACHE_KEYS.PRODUCTS, { test: 'cached-data' }, dummyEnv);
      const cached = await getCached(CACHE_KEYS.PRODUCTS, dummyEnv);
      assert.deepStrictEqual(cached, { test: 'cached-data' });

      await invalidateCatalogCache(dummyEnv);
      const afterPurge = await getCached(CACHE_KEYS.PRODUCTS, dummyEnv);
      assert.strictEqual(afterPurge, null);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Soft Deletes & Row-Level Security Filtering
  // -------------------------------------------------------------------------
  describe('Soft Deletes & DPDP Compliance', () => {
    it('softDeleteOrder should populate deleted_at and update audit trail', () => {
      const order: Order = {
        id: 'ord-soft-1',
        orderNumber: 'ord-soft-1',
        userId: 'usr-123',
        customerName: 'Rohit Patil',
        customerEmail: 'rohit@example.com',
        customerPhone: '+91 9876543210',
        status: 'confirmed',
        items: [],
        subtotalPaise: 10000,
        taxPaise: 0,
        shippingPaise: 0,
        discountPaise: 0,
        totalPaise: 10000,
        paymentMethod: 'upi',
        paymentStatus: 'captured',
        deliveryAddress: { pincode: '480661', street: 'Barghat Rd' } as any,
        deliveryPincode: '480661',
        estimatedDelivery: 'Tomorrow Morning',
        deliverySlot: 'Morning',
        createdAt: new Date().toISOString()
      };

      softDeleteOrder(order, 'admin@dugdhsar.in', 'Customer duplicate order request');
      assert.ok((order as any).deleted_at);
    });

    it('softDeleteSubscription should set status to cancelled and deleted_at timestamp', () => {
      const sub: Subscription = {
        id: 'sub-soft-1',
        userId: 'usr-123',
        customerName: 'Rohit Patil',
        productName: 'A2 Milk',
        variant: '1L',
        quantity: 1,
        frequency: 'daily',
        deliverySlot: 'Morning',
        deliveryAddress: 'Seoni',
        startDate: '2026-11-01',
        status: 'active',
        nextDelivery: '2026-11-12'
      };

      softDeleteSubscription(sub, 'admin@dugdhsar.in', 'User relocation');
      assert.strictEqual(sub.status, 'cancelled');
      assert.ok((sub as any).deleted_at);
    });

    it('ScopedRepository should exclude soft-deleted records from findMany queries', () => {
      const testOrders: Order[] = [
        {
          id: 'ord-active',
          orderNumber: 'ord-active',
          userId: 'usr-patron',
          customerName: 'Active Patron',
          customerEmail: 'patron@example.com',
          customerPhone: '+91 9876543210',
          status: 'confirmed',
          items: [],
          subtotalPaise: 5000,
          taxPaise: 0,
          shippingPaise: 0,
          discountPaise: 0,
          totalPaise: 5000,
          paymentMethod: 'cod',
          paymentStatus: 'due_on_delivery',
          deliveryAddress: { pincode: '480661' } as any,
          deliveryPincode: '480661',
          estimatedDelivery: 'Tomorrow',
          deliverySlot: 'Morning',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ord-deleted',
          orderNumber: 'ord-deleted',
          userId: 'usr-patron',
          customerName: 'Deleted Patron',
          customerEmail: 'patron@example.com',
          customerPhone: '+91 9876543210',
          status: 'cancelled',
          deleted_at: new Date().toISOString(),
          items: [],
          subtotalPaise: 5000,
          taxPaise: 0,
          shippingPaise: 0,
          discountPaise: 0,
          totalPaise: 5000,
          paymentMethod: 'cod',
          paymentStatus: 'due_on_delivery',
          deliveryAddress: { pincode: '480661' } as any,
          deliveryPincode: '480661',
          estimatedDelivery: 'Tomorrow',
          deliverySlot: 'Morning',
          createdAt: new Date().toISOString()
        } as any
      ];

      const patronUser: AuthUser = {
        id: 'usr-patron',
        email: 'patron@example.com',
        fullName: 'Patron',
        role: 'customer'
      };

      const repo = repoForUser(patronUser, { orders: testOrders, subscriptions: [] });
      const orders = repo.orders.findMany();

      assert.strictEqual(orders.length, 1);
      assert.strictEqual(orders[0].id, 'ord-active');
    });
  });
});
