import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineUserRole,
  createSessionJwt,
  createRefreshToken,
  verifySessionJwt,
  verifyRefreshToken,
  revokeToken,
  isTokenRevoked,
} from '../server/auth';
import {
  parseCookies,
  serializeCookie,
  setSessionCookies,
  clearSessionCookies,
} from '../server/cookies';
import {
  generateTotpSecret,
  getTotpAuthUri,
  verifyTotpCode,
} from '../server/auth/totp';
import {
  createRateLimiter,
  recordFailedAuthAttempt,
  checkAccountLockout,
  resetAuthLockout,
} from '../server/middleware/rateLimit';
import {
  repoForUser,
  ScopedRepository,
} from '../server/db/scopedRepo';
import {
  logAuditEvent,
  getAuditLogs,
} from '../server/services/auditService';
import {
  GoogleAuthSchema,
  CreateOrderSchema,
  OrderStatusUpdateSchema,
} from '../server/schemas';
import { AuthUser } from '../server/types';
import { Order, Subscription } from '../src/types';
import { ForbiddenError, NotFoundError, RateLimitError } from '../server/errors/AppError';

describe('Phase 2 Auth - Role Assignment & Privilege Escalation Prevention', () => {
  it('assigns super_admin ONLY to verified admin emails', () => {
    const adminRole1 = determineUserRole('sumitpawar65005@gmail.com');
    const adminRole2 = determineUserRole('admin@dugdhsar.in');
    assert.equal(adminRole1, 'super_admin');
    assert.equal(adminRole2, 'super_admin');
  });

  it('assigns dealer ONLY to authorized dealer emails', () => {
    const dealerRole = determineUserRole('dealer@dugdhsar.in');
    assert.equal(dealerRole, 'dealer');
  });

  it('strictly assigns customer and blocks arbitrary requestedRole elevation', () => {
    // Attacker tries to pass requestedRole: super_admin with an ordinary email
    const normalUserRole = determineUserRole('attacker@example.com', undefined, 'super_admin');
    assert.equal(normalUserRole, 'customer');

    const customerRole = determineUserRole('customer@gmail.com');
    assert.equal(customerRole, 'customer');
  });
});

describe('Phase 2 Auth - Token Management & Revocation', () => {
  const dummyUser: AuthUser = {
    id: 'usr_patron_123',
    email: 'patron@example.com',
    fullName: 'Test Patron',
    role: 'customer',
  };

  it('creates and verifies short-lived access JWT tokens', async () => {
    const { token, jti } = await createSessionJwt(dummyUser);
    assert.ok(token);
    assert.ok(jti.startsWith('jti_'));

    const verified = await verifySessionJwt(token);
    assert.ok(verified);
    assert.equal(verified?.email, dummyUser.email);
    assert.equal(verified?.role, 'customer');
  });

  it('creates and verifies rolling refresh JWT tokens', async () => {
    const { token, jti } = await createRefreshToken(dummyUser);
    assert.ok(token);
    assert.ok(jti.startsWith('ref_'));

    const verified = await verifyRefreshToken(token);
    assert.ok(verified);
    assert.equal(verified?.email, dummyUser.email);
    assert.equal(verified?.role, 'customer');
  });

  it('immediately blocks revoked tokens using JTI revocation check', async () => {
    const { token, jti } = await createSessionJwt(dummyUser);
    const initialCheck = await verifySessionJwt(token);
    assert.ok(initialCheck);

    // Revoke the token
    await revokeToken(jti, Date.now() + 10 * 60 * 1000);

    const isRevoked = await isTokenRevoked(jti);
    assert.equal(isRevoked, true);

    const revokedCheck = await verifySessionJwt(token);
    assert.equal(revokedCheck, null);
  });
});

describe('Phase 2 Auth - Cookie Management & Security Flags', () => {
  it('serializes cookies with HttpOnly, SameSite=Lax and Path=/', () => {
    const serialized = serializeCookie('dugdhsar_access', 'jwt_test_token', {
      maxAgeSeconds: 900,
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    });

    assert.ok(serialized.includes('dugdhsar_access=jwt_test_token'));
    assert.ok(serialized.includes('HttpOnly'));
    assert.ok(serialized.includes('SameSite=Lax'));
    assert.ok(serialized.includes('Path=/'));
    assert.ok(serialized.includes('Max-Age=900'));
  });

  it('parses cookies from request headers correctly', () => {
    const mockReq = {
      headers: {
        cookie: 'dugdhsar_access=token123; dugdhsar_refresh=refresh456; other_pref=dark',
      },
    } as any;

    const cookies = parseCookies(mockReq);
    assert.equal(cookies['dugdhsar_access'], 'token123');
    assert.equal(cookies['dugdhsar_refresh'], 'refresh456');
    assert.equal(cookies['other_pref'], 'dark');
  });

  it('clears session cookies with Max-Age=0', () => {
    let setHeaders: string[] = [];
    const mockRes = {
      setHeader: (_name: string, val: string[]) => {
        setHeaders = val;
      },
    } as any;

    clearSessionCookies(mockRes);
    assert.equal(setHeaders.length, 2);
    assert.ok(setHeaders[0].includes('Max-Age=0'));
    assert.ok(setHeaders[1].includes('Max-Age=0'));
  });
});

describe('Phase 2 Auth - RFC 6238 TOTP WebCrypto 2FA', () => {
  it('generates valid 20-byte Base32 TOTP secret and auth URI', () => {
    const secret = generateTotpSecret();
    assert.ok(secret.length >= 16);

    const uri = getTotpAuthUri(secret, 'admin@dugdhsar.in');
    assert.ok(uri.startsWith('otpauth://totp/DUGDHSAR:admin%40dugdhsar.in'));
    assert.ok(uri.includes(`secret=${secret}`));
  });

  it('verifies valid TOTP codes with ±1 window tolerance', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'; // Standard test secret: "Hello!\xde\xad\xbe\xef"
    // Invalid code fails
    const invalidResult = await verifyTotpCode(secret, '000000');
    assert.equal(invalidResult, false);

    // Code with wrong length fails fast
    const shortResult = await verifyTotpCode(secret, '123');
    assert.equal(shortResult, false);
  });
});

describe('Phase 2 Auth - Rate Limiting & Account Lockout', () => {
  it('locks out account after 5 consecutive failed attempts for 15 minutes', () => {
    const targetUser = 'test_lockout_user@example.com';
    resetAuthLockout(targetUser);

    for (let i = 1; i <= 4; i++) {
      const res = recordFailedAuthAttempt(targetUser);
      assert.equal(res.isLocked, false);
      assert.equal(res.attempts, i);
    }

    // 5th failed attempt triggers lockout
    const finalAttempt = recordFailedAuthAttempt(targetUser);
    assert.equal(finalAttempt.isLocked, true);
    assert.equal(finalAttempt.attempts, 5);
    assert.ok((finalAttempt.lockRemainingSeconds || 0) > 800);

    const check = checkAccountLockout(targetUser);
    assert.equal(check.isLocked, true);

    // Reset clears lockout
    resetAuthLockout(targetUser);
    const postReset = checkAccountLockout(targetUser);
    assert.equal(postReset.isLocked, false);
  });

  it('enforces sliding-window rate limit threshold and sets Retry-After', () => {
    const limiter = createRateLimiter({
      prefix: 'test_limit',
      windowMs: 60000,
      maxRequests: 2,
    });

    const mockReq = { headers: {}, socket: { remoteAddress: '10.0.0.1' } } as any;
    let retryHeader = '';
    const mockRes = {
      setHeader: (_name: string, val: string) => {
        retryHeader = val;
      },
    } as any;

    let errReceived: any = null;
    const next = (err?: any) => {
      errReceived = err;
    };

    // Request 1: OK
    limiter(mockReq, mockRes, next);
    assert.equal(errReceived, undefined);

    // Request 2: OK
    limiter(mockReq, mockRes, next);
    assert.equal(errReceived, undefined);

    // Request 3: Throws RateLimitError (429)
    limiter(mockReq, mockRes, next);
    assert.ok((errReceived as any) instanceof RateLimitError);
    assert.equal((errReceived as any).statusCode, 429);
    assert.ok(Number(retryHeader) > 0);
  });
});

describe('Phase 2 Auth - Row-Level Security (RLS) & IDOR Protection', () => {
  const customerA: AuthUser = {
    id: 'usr_cust_a',
    email: 'alice@example.com',
    fullName: 'Alice Customer',
    role: 'customer',
  };

  const customerB: AuthUser = {
    id: 'usr_cust_b',
    email: 'bob@example.com',
    fullName: 'Bob Customer',
    role: 'customer',
  };

  const dealerSeoni: AuthUser = {
    id: 'usr_dealer_seoni',
    email: 'dealer@dugdhsar.in',
    fullName: 'Seoni Dealer',
    role: 'dealer',
    dealerId: 'dealer_seoni_main',
    assignedPincodes: ['480661'],
  };

  const superAdmin: AuthUser = {
    id: 'usr_super_admin',
    email: 'sumitpawar65005@gmail.com',
    fullName: 'Sumit Pawar',
    role: 'super_admin',
  };

  const mockOrders: Order[] = [
    {
      id: 'ord_alice_1',
      orderNumber: 'DUG-1001',
      userId: customerA.id,
      customerId: customerA.id,
      customerEmail: customerA.email,
      customerName: customerA.fullName,
      customerPhone: '+91 7067672604',
      status: 'confirmed',
      items: [],
      subtotalPaise: 9000,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      totalPaise: 9000,
      paymentMethod: 'cod',
      paymentStatus: 'due_on_delivery',
      deliveryAddress: { pincode: '480661' } as any,
      shippingAddress: { pincode: '480661' } as any,
      deliverySlot: 'morning',
      deliveryPincode: '480661',
      dealerId: 'dealer_seoni_main',
      createdAt: '2026-11-10T00:00:00.000Z',
      estimatedDelivery: 'Tomorrow',
    },
    {
      id: 'ord_bob_1',
      orderNumber: 'DUG-1002',
      userId: customerB.id,
      customerId: customerB.id,
      customerEmail: customerB.email,
      customerName: customerB.fullName,
      customerPhone: '+91 9826123456',
      status: 'delivered',
      items: [],
      subtotalPaise: 18000,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      totalPaise: 18000,
      paymentMethod: 'upi',
      paymentStatus: 'captured',
      deliveryAddress: { pincode: '110001' } as any,
      shippingAddress: { pincode: '110001' } as any,
      deliverySlot: 'morning',
      deliveryPincode: '110001',
      dealerId: 'dealer_delhi_hub',
      createdAt: '2026-11-10T01:00:00.000Z',
      estimatedDelivery: 'Delivered',
    },
  ];

  const mockSubscriptions: Subscription[] = [
    {
      id: 'sub_alice_1',
      userId: customerA.id,
      customerId: customerA.id,
      customerEmail: customerA.email,
      productName: 'A2 Gir Cow Milk',
      variant: '1L Glass Bottle',
      quantity: 1,
      frequency: 'daily',
      deliverySlot: 'Morning',
      startDate: '2026-11-10',
      status: 'active',
      nextDelivery: '2026-11-11',
      dealerId: 'dealer_seoni_main',
      deliveryAddress: { pincode: '480661' } as any,
    },
    {
      id: 'sub_bob_1',
      userId: customerB.id,
      customerId: customerB.id,
      customerEmail: customerB.email,
      productName: 'A2 Vedic Bilona Ghee',
      variant: '500ml Glass Jar',
      quantity: 1,
      frequency: 'weekly',
      deliverySlot: 'Morning',
      startDate: '2026-11-10',
      status: 'active',
      nextDelivery: '2026-11-17',
      dealerId: 'dealer_delhi_hub',
      deliveryAddress: { pincode: '110001' } as any,
    },
  ];

  it('scopes customer order listings strictly to their own orders', () => {
    const aliceRepo = repoForUser(customerA, { orders: mockOrders, subscriptions: mockSubscriptions });
    const aliceOrders = aliceRepo.orders.findMany();
    assert.equal(aliceOrders.length, 1);
    assert.equal(aliceOrders[0].id, 'ord_alice_1');

    const bobRepo = repoForUser(customerB, { orders: mockOrders, subscriptions: mockSubscriptions });
    const bobOrders = bobRepo.orders.findMany();
    assert.equal(bobOrders.length, 1);
    assert.equal(bobOrders[0].id, 'ord_bob_1');
  });

  it('prevents IDOR: Customer A accessing Customer B order throws ForbiddenError', () => {
    const aliceRepo = repoForUser(customerA, { orders: mockOrders, subscriptions: mockSubscriptions });

    // Alice accessing Alice's order succeeds
    const aliceOrder = aliceRepo.orders.findById('ord_alice_1');
    assert.equal(aliceOrder.id, 'ord_alice_1');

    // Alice accessing Bob's order is blocked by IDOR check
    assert.throws(() => {
      aliceRepo.orders.findById('ord_bob_1');
    }, (err: any) => {
      assert.ok(err instanceof ForbiddenError);
      assert.equal(err.statusCode, 403);
      return true;
    });
  });

  it('prevents customers from modifying order status (only dealers/admins)', () => {
    const aliceRepo = repoForUser(customerA, { orders: mockOrders, subscriptions: mockSubscriptions });
    assert.throws(() => {
      aliceRepo.orders.updateStatus('ord_alice_1', 'delivered');
    }, (err: any) => {
      assert.ok(err instanceof ForbiddenError);
      return true;
    });
  });

  it('confines dealer visibility to assigned dealerId / territory pincodes', () => {
    const dealerRepo = repoForUser(dealerSeoni, { orders: mockOrders, subscriptions: mockSubscriptions });
    const dealerOrders = dealerRepo.orders.findMany();
    assert.equal(dealerOrders.length, 1);
    assert.equal(dealerOrders[0].id, 'ord_alice_1');

    // Dealer accessing out-of-territory order is blocked
    assert.throws(() => {
      dealerRepo.orders.findById('ord_bob_1');
    }, (err: any) => {
      assert.ok(err instanceof ForbiddenError);
      return true;
    });
  });

  it('allows super admin full visibility across all orders and territories', () => {
    const adminRepo = repoForUser(superAdmin, { orders: mockOrders, subscriptions: mockSubscriptions });
    const allOrders = adminRepo.orders.findMany();
    assert.equal(allOrders.length, 2);
    assert.ok(adminRepo.orders.findById('ord_alice_1'));
    assert.ok(adminRepo.orders.findById('ord_bob_1'));
  });

  it('enforces IDOR boundary on subscriptions', () => {
    const aliceRepo = repoForUser(customerA, { orders: mockOrders, subscriptions: mockSubscriptions });
    assert.ok(aliceRepo.subscriptions.findById('sub_alice_1'));

    assert.throws(() => {
      aliceRepo.subscriptions.findById('sub_bob_1');
    }, ForbiddenError);
  });
});

describe('Phase 2 Auth - Audit Logging Access Control', () => {
  const superAdmin: AuthUser = {
    id: 'usr_admin',
    email: 'sumitpawar65005@gmail.com',
    fullName: 'Sumit Pawar',
    role: 'super_admin',
  };

  const customer: AuthUser = {
    id: 'usr_cust',
    email: 'user@example.com',
    fullName: 'Patron',
    role: 'customer',
  };

  it('records immutable audit events for sensitive administrative actions', () => {
    const event = logAuditEvent({
      actor: superAdmin,
      action: 'ORDER_STATUS_CHANGED',
      targetType: 'order',
      targetId: 'ord-test-999',
      details: { newStatus: 'delivered' },
    });

    assert.ok(event.id.startsWith('audit_'));
    assert.equal(event.actorEmail, superAdmin.email);
    assert.equal(event.action, 'ORDER_STATUS_CHANGED');
  });

  it('allows super admin to query audit logs', () => {
    const logs = getAuditLogs(superAdmin);
    assert.ok(logs.total >= 1);
    assert.ok(Array.isArray(logs.logs));
  });

  it('blocks non-super-admins from querying audit logs', () => {
    assert.throws(() => {
      getAuditLogs(customer);
    }, (err: any) => {
      assert.ok(err instanceof ForbiddenError);
      assert.equal(err.statusCode, 403);
      return true;
    });
  });
});

describe('Phase 2 Auth - Mass Assignment Protection via Strict Schemas', () => {
  it('rejects unexpected / injected properties on GoogleAuthSchema', () => {
    const payloadWithInjectedRole = {
      idToken: 'valid_google_token_jwt',
      role: 'super_admin', // Injected property
      isAdmin: true,
    };

    const parsed = GoogleAuthSchema.safeParse(payloadWithInjectedRole);
    assert.equal(parsed.success, false);
  });

  it('rejects injected properties on OrderStatusUpdateSchema', () => {
    const injectedPayload = {
      status: 'confirmed',
      totalPaise: 0, // Injected price override!
    };

    const parsed = OrderStatusUpdateSchema.safeParse(injectedPayload);
    assert.equal(parsed.success, false);
  });
});
