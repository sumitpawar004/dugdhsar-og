import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestD1, LocalTestD1Database } from './helpers/mockD1';
import {
  createD1Repo,
  upsertGoogleUser,
  assignD1StaffSlot,
  anonymizeUserAccount,
  createOrderInD1,
  createSubscriptionInD1,
  assignDealerPincodesInD1,
  assignDealerCustomerInD1,
} from '../../server/db';
import { AuthUser, WorkerEnv } from '../../server/types';
import { addDaysYmd, getTomorrowIstYmd } from '../../server/lib/istDate';

describe('D1 Role Isolation, Ownership (IDOR), Single-Use QR & DPDP Anonymization', () => {
  let db: LocalTestD1Database;
  let env: WorkerEnv;
  let superAdmin: AuthUser;
  let manager: AuthUser;
  let dealer: AuthUser;
  let customerA: AuthUser;
  let customerB: AuthUser;
  let futureDate: string;

  beforeEach(async () => {
    db = createTestD1();
    env = {
      DB: db,
      ENVIRONMENT: 'test',
      JWT_SECRET: 'test_super_secret_jwt_signing_key_32_bytes_min',
      SUPER_ADMIN_EMAILS: 'owner@dugdhsar.in',
      DEALER_EMAILS: '',
    };
    futureDate = addDaysYmd(getTomorrowIstYmd(), 3);

    superAdmin = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_owner_1',
        email: 'owner@dugdhsar.in',
        name: 'Primary Owner',
      })
    ).user;
    expect(superAdmin.role).toBe('super_admin');

    // Assign manager & dealer strictly in D1 via Super Admin
    await assignD1StaffSlot(db, superAdmin, env, {
      role: 'manager',
      email: 'ops.manager@dugdhsar.in',
      name: 'Ops Manager',
    });
    await assignD1StaffSlot(db, superAdmin, env, {
      role: 'dealer',
      email: 'seoni.dealer@dugdhsar.in',
      name: 'Seoni Territory Dealer',
    });

    manager = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_manager_1',
        email: 'ops.manager@dugdhsar.in',
        name: 'Ops Manager',
      })
    ).user;
    expect(manager.role).toBe('manager');

    dealer = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_dealer_1',
        email: 'seoni.dealer@dugdhsar.in',
        name: 'Seoni Territory Dealer',
      })
    ).user;
    expect(dealer.role).toBe('dealer');
    expect(dealer.dealerId).toBeTruthy();

    // Assign Seoni pincode to dealer
    await assignDealerPincodesInD1(db, superAdmin, dealer.dealerId!, ['480661']);

    customerA = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_cust_a',
        email: 'ananya@example.com',
        name: 'Ananya Sharma',
      })
    ).user;
    customerB = (
      await upsertGoogleUser(db, env, {
        googleSub: 'sub_cust_b',
        email: 'rohan@example.com',
        name: 'Rohan Verma',
      })
    ).user;

    // Assign customerA to dealer; leave customerB unassigned (using pincode 480771)
    await assignDealerCustomerInD1(db, superAdmin, dealer.dealerId!, customerA.id);
  });

  afterEach(() => {
    db.close();
  });

  it('prevents cross-customer IDOR on addresses, orders, and subscriptions', async () => {
    const repoA = createD1Repo(db).forUser(customerA);
    const repoB = createD1Repo(db).forUser(customerB);

    const addrA = await repoA.addresses.create({
      label: 'Home',
      recipientName: 'Ananya Sharma',
      phone: '9876543210',
      line1: '12 Barghat Road',
      city: 'Seoni',
      pincode: '480661',
      isDefault: true,
    });

    const addrB = await repoB.addresses.create({
      label: 'Home',
      recipientName: 'Rohan Verma',
      phone: '9876543211',
      line1: '45 Sukla Road',
      city: 'Sukla',
      pincode: '480771',
      isDefault: true,
    });

    const { order: orderA } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 2 }],
      addressId: addrA.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    const { order: orderB } = await createOrderInD1(db, customerB, {
      items: [{ variantId: 'bm-1l', quantity: 1 }],
      addressId: addrB.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    const subA = await createSubscriptionInD1(db, customerA, {
      planId: 'plan-cow-daily-1l',
      addressId: addrA.id,
      quantity: 1,
      frequency: 'daily',
      deliverySlot: 'morning',
      billingCycle: 'prepaid_monthly',
      startDate: futureDate,
    });

    // Customer A sees ONLY their own order & subscription
    const listA = await repoA.orders.list();
    expect(listA.items.map((o) => o.id)).toEqual([orderA.id]);

    // Customer B CANNOT read Customer A's address, order, or subscription
    await expect(repoB.addresses.getById(addrA.id)).rejects.toThrow(/Access denied/i);
    await expect(repoB.orders.getById(orderA.id)).rejects.toThrow(/Access denied/i);
    await expect(repoB.subscriptions.getById(subA.id)).rejects.toThrow(/Access denied/i);

    // Customer A CANNOT read Customer B's order
    await expect(repoA.orders.getById(orderB.id)).rejects.toThrow(/Access denied/i);
  });

  it('scopes dealer visibility strictly to assigned territory & customers', async () => {
    const repoA = createD1Repo(db).forUser(customerA);
    const repoB = createD1Repo(db).forUser(customerB);
    const repoDealer = createD1Repo(db).forUser(dealer);
    const repoManager = createD1Repo(db).forUser(manager);

    const addrA = await repoA.addresses.create({
      recipientName: 'Ananya Sharma',
      line1: '12 Barghat Road',
      city: 'Seoni',
      pincode: '480661',
    });
    const addrB = await repoB.addresses.create({
      recipientName: 'Rohan Verma',
      line1: '45 Sukla Road',
      city: 'Sukla',
      pincode: '480771',
    });

    const { order: orderA } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 1 }],
      addressId: addrA.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });
    const { order: orderB } = await createOrderInD1(db, customerB, {
      items: [{ variantId: 'bm-1l', quantity: 1 }],
      addressId: addrB.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    // Dealer sees Customer A's order, NOT Customer B's order (outside territory)
    const dealerOrders = await repoDealer.orders.list();
    expect(dealerOrders.items.map((o) => o.id)).toEqual([orderA.id]);
    await expect(repoDealer.orders.getById(orderB.id)).rejects.toThrow(/outside your assigned dealer territory/i);

    // Dealer sees only assigned customers
    const dealerCustomers = await repoDealer.dealerCustomers.list();
    expect(dealerCustomers.items.map((c) => c.id)).toEqual([customerA.id]);

    // Manager sees both orders operationally
    const managerOrders = await repoManager.orders.list();
    expect(managerOrders.items.map((o) => o.id).sort()).toEqual([orderA.id, orderB.id].sort());
  });

  it('enforces single-use doorstep QR verification and restricts audit_logs to super_admin only', async () => {
    const repoA = createD1Repo(db).forUser(customerA);
    const repoDealer = createD1Repo(db).forUser(dealer);
    const repoManager = createD1Repo(db).forUser(manager);
    const repoAdmin = createD1Repo(db).forUser(superAdmin);

    const addrA = await repoA.addresses.create({
      recipientName: 'Ananya Sharma',
      line1: '12 Barghat Road',
      city: 'Seoni',
      pincode: '480661',
    });

    const { order } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 1 }],
      addressId: addrA.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    expect(order.qr_token).toBeTruthy();
    expect(order.qr_token!.length).toBeGreaterThanOrEqual(32);

    // Customer cannot self-verify doorstep QR
    await expect(repoA.orders.verifyDoorstepQr(order.qr_token!)).rejects.toThrow(/Only assigned delivery dealers/i);

    // Assigned dealer verifies QR once -> succeeds & marks delivered
    const verified = await repoDealer.orders.verifyDoorstepQr(order.qr_token!);
    expect(verified.status).toBe('delivered');
    expect(verified.qr_verified_by).toBe(dealer.id);

    // Second scan of the same QR token MUST fail (single-use)
    await expect(repoDealer.orders.verifyDoorstepQr(order.qr_token!)).rejects.toThrow(/already been verified/i);

    // Audit logs strictly super_admin only
    await expect(repoA.auditLogs.list()).rejects.toThrow(/Only Super Admin/i);
    await expect(repoDealer.auditLogs.list()).rejects.toThrow(/Only Super Admin/i);
    await expect(repoManager.auditLogs.list()).rejects.toThrow(/Only Super Admin/i);
    const logs = await repoAdmin.auditLogs.list();
    expect(logs.items.some((l) => l.action === 'ORDER_QR_VERIFIED')).toBe(true);
  });

  it('anonymizes account while preserving orders and reactivates same user row on re-signup', async () => {
    const repoA = createD1Repo(db).forUser(customerA);
    const addrA = await repoA.addresses.create({
      recipientName: 'Ananya Sharma',
      line1: '12 Barghat Road',
      city: 'Seoni',
      pincode: '480661',
    });
    const { order } = await createOrderInD1(db, customerA, {
      items: [{ variantId: 'wm-1l', quantity: 1 }],
      addressId: addrA.id,
      deliveryDate: futureDate,
      deliverySlot: 'morning',
      paymentMethod: 'cod',
    });

    await anonymizeUserAccount(db, {
      userId: customerA.id,
      actorEmail: customerA.email,
      actorRole: customerA.role,
    });

    // Order row is still preserved in D1 for legal/tax accounting
    const preservedOrder = await db
      .prepare(`SELECT id, user_id, total_paise FROM orders WHERE id = ?`)
      .bind(order.id)
      .first<{ id: string; user_id: string; total_paise: number }>();
    expect(preservedOrder?.id).toBe(order.id);
    expect(preservedOrder?.user_id).toBe(customerA.id);

    // User row is anonymized
    const anonUser = await db
      .prepare(`SELECT status, name, deleted_at FROM users WHERE id = ?`)
      .bind(customerA.id)
      .first<{ status: string; name: string; deleted_at: string | null }>();
    expect(anonUser?.status).toBe('deleted');
    expect(anonUser?.name).toBe('Deleted User');
    expect(anonUser?.deleted_at).toBeTruthy();

    // Re-signing up with same Google account reactivates the exact same user row ID
    const reactivated = await upsertGoogleUser(db, env, {
      googleSub: 'sub_cust_a',
      email: 'ananya@example.com',
      name: 'Ananya Returned',
    });
    expect(reactivated.reactivated).toBe(true);
    expect(reactivated.user.id).toBe(customerA.id);
    expect(reactivated.user.fullName).toBe('Ananya Returned');
  });
});
