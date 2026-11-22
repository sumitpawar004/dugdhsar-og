import { AuthUser, D1Database, D1PreparedStatement } from '../types';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors/AppError';
import {
  clampPagination,
  generateId,
  generateOrderNumber,
  generateQrToken,
  utcNowIso,
} from './client';
import { buildAuditLogStatement } from './auditRepo';
import { createD1Repo } from './repo';
import {
  BillingCycle,
  CouponRow,
  DeliverySlotCode,
  EnquiryRow,
  EnquiryStatus,
  OrderItemRow,
  OrderRow,
  OrderStatus,
  PaymentMethod,
  PlanRow,
  ProductCategory,
  ProductRow,
  ProductVariantRow,
  ReviewRow,
  ReviewStatus,
  SubscriptionFrequency,
  SubscriptionRow,
} from './types';
import {
  checkIstCutoffForDate,
  computeNextDeliveryDate,
  getIstNowParts,
  getTomorrowIstYmd,
} from '../lib/istDate';

interface DeliveryZoneConfig {
  id: string;
  zoneName: string;
  city: string;
  state: string;
  pincodes: string[];
  minOrderPaise: number;
  deliveryFeePaise: number;
  freeDeliveryThresholdPaise: number;
  isActive: boolean;
}

export function normalizePaymentMethod(method: string): PaymentMethod {
  if (method === 'razorpay' || method === 'online') return 'razorpay';
  if (method === 'upi_on_delivery' || method === 'upi') return 'upi_on_delivery';
  return 'cod';
}

export async function loadDeliveryZonesFromD1(db: D1Database): Promise<DeliveryZoneConfig[]> {
  const row = await db
    .prepare(`SELECT value_json FROM site_settings WHERE key = 'delivery_zones' LIMIT 1`)
    .first<{ value_json: string }>();
  if (!row?.value_json) return [];
  try {
    const parsed = JSON.parse(row.value_json);
    return Array.isArray(parsed) ? (parsed as DeliveryZoneConfig[]) : [];
  } catch {
    return [];
  }
}

export async function findZoneForPincodeInD1(
  db: D1Database,
  pincode: string
): Promise<{ serviceable: boolean; zone: DeliveryZoneConfig | null; dealerId: string | null }> {
  const [zones, dealerPin] = await Promise.all([
    loadDeliveryZonesFromD1(db),
    db
      .prepare(
        `SELECT dp.dealer_id
         FROM dealer_pincodes dp
         INNER JOIN dealers d ON d.id = dp.dealer_id
         WHERE dp.pincode = ? AND d.status = 'active'
         LIMIT 1`
      )
      .bind(pincode)
      .first<{ dealer_id: string }>(),
  ]);

  const zone = zones.find((z) => z.isActive && Array.isArray(z.pincodes) && z.pincodes.includes(pincode)) || null;
  return {
    serviceable: Boolean(zone || dealerPin),
    zone,
    dealerId: dealerPin?.dealer_id ?? null,
  };
}

/**
 * Server-side cart calculation strictly from D1 product_variants, coupons, and site_settings.
 */
export async function calculateCheckoutInD1(
  db: D1Database,
  userId: string | null,
  input: { items: Array<{ variantId: string; quantity: number }>; pincode?: string; couponCode?: string }
): Promise<{
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  isServiceable: boolean;
  resolvedItems: Array<{
    productId: string;
    variantId: string;
    productName: string;
    sizeLabel: string;
    unitPricePaise: number;
    quantity: number;
    totalPaise: number;
    stockQty: number;
  }>;
  coupon: CouponRow | null;
  dealerId: string | null;
}> {
  const variantIds = Array.from(new Set(input.items.map((i) => i.variantId)));
  if (variantIds.length === 0) {
    throw new BadRequestError('At least one cart item is required.');
  }

  const placeholders = variantIds.map(() => '?').join(', ');
  const variantsRes = await db
    .prepare(
      `SELECT pv.id, pv.product_id, pv.size_label, pv.price_paise, pv.stock_qty, pv.is_active,
              p.name AS product_name, p.is_active AS product_active
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id IN (${placeholders}) AND p.deleted_at IS NULL`
    )
    .bind(...variantIds)
    .all<{
      id: string;
      product_id: string;
      size_label: string;
      price_paise: number;
      stock_qty: number;
      is_active: number;
      product_name: string;
      product_active: number;
    }>();

  const variantMap = new Map((variantsRes.results || []).map((v) => [v.id, v]));
  let subtotalPaise = 0;
  const resolvedItems: Array<{
    productId: string;
    variantId: string;
    productName: string;
    sizeLabel: string;
    unitPricePaise: number;
    quantity: number;
    totalPaise: number;
    stockQty: number;
  }> = [];

  for (const item of input.items) {
    const row = variantMap.get(item.variantId);
    if (!row || row.is_active !== 1 || row.product_active !== 1) {
      throw new BadRequestError(`Product variant "${item.variantId}" is unavailable.`);
    }
    const lineTotal = row.price_paise * item.quantity;
    subtotalPaise += lineTotal;
    resolvedItems.push({
      productId: row.product_id,
      variantId: row.id,
      productName: row.product_name,
      sizeLabel: row.size_label,
      unitPricePaise: row.price_paise,
      quantity: item.quantity,
      totalPaise: lineTotal,
      stockQty: row.stock_qty,
    });
  }

  let isServiceable = true;
  let deliveryFeePaise = 0;
  let dealerId: string | null = null;

  if (input.pincode) {
    const pinCheck = await findZoneForPincodeInD1(db, input.pincode);
    isServiceable = pinCheck.serviceable;
    dealerId = pinCheck.dealerId;
    if (pinCheck.zone) {
      deliveryFeePaise =
        subtotalPaise >= pinCheck.zone.freeDeliveryThresholdPaise ? 0 : pinCheck.zone.deliveryFeePaise;
    }
  }

  let discountPaise = 0;
  let validCoupon: CouponRow | null = null;

  if (input.couponCode) {
    const cleanCode = input.couponCode.trim().toUpperCase();
    const nowIso = utcNowIso();
    const coupon = await db
      .prepare(
        `SELECT id, code, type, value, min_order_paise, max_discount_paise,
                max_uses, per_user_limit, used_count, valid_from, valid_to, is_active, created_at, updated_at
         FROM coupons
         WHERE code = ? AND is_active = 1
         LIMIT 1`
      )
      .bind(cleanCode)
      .first<CouponRow>();

    if (
      coupon &&
      coupon.valid_from <= nowIso &&
      coupon.valid_to >= nowIso &&
      subtotalPaise >= coupon.min_order_paise &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses)
    ) {
      let withinUserLimit = true;
      if (userId) {
        const usedByUser = await db
          .prepare(`SELECT COUNT(*) AS cnt FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?`)
          .bind(coupon.id, userId)
          .first<{ cnt: number }>();
        if ((usedByUser?.cnt || 0) >= coupon.per_user_limit) {
          withinUserLimit = false;
        }
      }

      if (withinUserLimit) {
        const rawDiscount =
          coupon.type === 'percentage'
            ? Math.round((subtotalPaise * coupon.value) / 100)
            : coupon.value;
        discountPaise = coupon.max_discount_paise
          ? Math.min(rawDiscount, coupon.max_discount_paise)
          : rawDiscount;
        discountPaise = Math.min(discountPaise, subtotalPaise);
        validCoupon = coupon;
      }
    }
  }

  const taxPaise = 0;
  const totalPaise = subtotalPaise + taxPaise + deliveryFeePaise - discountPaise;

  return {
    subtotalPaise,
    taxPaise,
    deliveryFeePaise,
    discountPaise,
    totalPaise,
    isServiceable,
    resolvedItems,
    coupon: validCoupon,
    dealerId,
  };
}

/**
 * Atomic Order Creation in Cloudflare D1:
 * - Server-computes all prices strictly from D1 product_variants
 * - Checks IST delivery cut-off if deliveryDate specified
 * - Atomically deducts product_variants.stock_qty with WHERE stock_qty >= ?
 * - Inserts orders (with >=128-bit single-use qr_token), order_items, payments, and coupon_redemptions in db.batch()
 */
export async function createOrderInD1(
  db: D1Database,
  user: AuthUser,
  input: {
    items: Array<{ variantId: string; quantity: number }>;
    addressId?: string;
    shippingAddress?: Record<string, any>;
    deliveryDate?: string;
    deliverySlot: DeliverySlotCode;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    notes?: string;
  },
  ipAddress?: string | null
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  const scoped = createD1Repo(db).forUser(user);

  let resolvedAddressId: string | null = null;
  let resolvedPincode: string;
  let addressSnapshot: Record<string, unknown>;

  if (input.addressId) {
    const addr = await scoped.addresses.getById(input.addressId);
    resolvedAddressId = addr.id;
    resolvedPincode = addr.pincode;
    addressSnapshot = {
      label: addr.label,
      recipientName: addr.recipient_name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      lat: addr.lat,
      lng: addr.lng,
    };
  } else if (input.shippingAddress?.pincode) {
    resolvedPincode = String(input.shippingAddress.pincode).trim();
    addressSnapshot = {
      recipientName: input.shippingAddress.fullName || user.fullName,
      phone: input.shippingAddress.mobile || input.shippingAddress.phone || null,
      line1: input.shippingAddress.addressLine1 || input.shippingAddress.line1 || '',
      line2: input.shippingAddress.addressLine2 || input.shippingAddress.line2 || null,
      landmark: input.shippingAddress.landmark || null,
      city: input.shippingAddress.city || 'Seoni',
      state: input.shippingAddress.state || 'Madhya Pradesh',
      pincode: resolvedPincode,
    };
  } else {
    throw new BadRequestError('Either a saved addressId or a valid shippingAddress with 6-digit pincode is required.');
  }

  const deliveryDate = input.deliveryDate || getTomorrowIstYmd();
  const cutoff = checkIstCutoffForDate(deliveryDate, input.deliverySlot);
  if (!cutoff.allowed) {
    throw new BadRequestError(cutoff.reason || 'Delivery cut-off time has passed for the selected date.');
  }

  const calc = await calculateCheckoutInD1(db, user.id, {
    items: input.items,
    pincode: resolvedPincode,
    couponCode: input.couponCode,
  });

  if (!calc.isServiceable) {
    throw new BadRequestError(
      'Cannot place order: Destination pincode is outside our active local cold-chain delivery zone.'
    );
  }

  // Resolve assigned dealer (prefer explicit customer-dealer ownership, else pincode dealer)
  const customerDealer = await db
    .prepare(`SELECT dealer_id FROM dealer_customers WHERE customer_id = ? LIMIT 1`)
    .bind(user.id)
    .first<{ dealer_id: string }>();
  const dealerId = customerDealer?.dealer_id ?? calc.dealerId;

  const now = utcNowIso();
  const orderId = generateId();
  const orderNumber = generateOrderNumber('DUG', deliveryDate);
  const qrToken = generateQrToken();
  const paymentMethod = input.paymentMethod;
  const orderStatus: OrderStatus = paymentMethod === 'razorpay' ? 'pending' : 'confirmed';
  const paymentStatus = paymentMethod === 'razorpay' ? 'pending' : 'due_on_delivery';

  // Step 1: Atomic conditional stock deduction per variant (prevents overselling under concurrency)
  const deducted: Array<{ variantId: string; quantity: number }> = [];
  for (const item of calc.resolvedItems) {
    const stockRes = await db
      .prepare(
        `UPDATE product_variants
         SET stock_qty = stock_qty - ?, updated_at = ?
         WHERE id = ? AND is_active = 1 AND stock_qty >= ?`
      )
      .bind(item.quantity, now, item.variantId, item.quantity)
      .run();

    if (!stockRes.meta?.changes || stockRes.meta.changes === 0) {
      // Compensate any previously deducted items in this request
      if (deducted.length > 0) {
        await db.batch(
          deducted.map((d) =>
            db
              .prepare(`UPDATE product_variants SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?`)
              .bind(d.quantity, now, d.variantId)
          )
        );
      }
      throw new ConflictError(
        `Insufficient stock for ${item.productName} (${item.sizeLabel}). Please reduce quantity and retry.`
      );
    }
    deducted.push({ variantId: item.variantId, quantity: item.quantity });
  }

  // Step 2: Atomic batch insert for order + order_items + initial payment + optional coupon redemption
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO orders (
          id, order_number, order_type, user_id, dealer_id, subscription_id, address_id, coupon_id,
          shipping_address_json, delivery_pincode, delivery_date, delivery_slot, status,
          payment_method, payment_status, subtotal_paise, tax_paise, delivery_fee_paise,
          discount_paise, total_paise, qr_token, notes, created_at, updated_at
        ) VALUES (?, ?, 'one_time', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        orderId,
        orderNumber,
        user.id,
        dealerId,
        resolvedAddressId,
        calc.coupon?.id ?? null,
        JSON.stringify(addressSnapshot),
        resolvedPincode,
        deliveryDate,
        input.deliverySlot,
        orderStatus,
        paymentMethod,
        paymentStatus,
        calc.subtotalPaise,
        calc.taxPaise,
        calc.deliveryFeePaise,
        calc.discountPaise,
        calc.totalPaise,
        qrToken,
        input.notes?.trim() || null,
        now,
        now
      ),
  ];

  const createdItems: OrderItemRow[] = [];
  for (const item of calc.resolvedItems) {
    const itemId = generateId();
    createdItems.push({
      id: itemId,
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      product_name_snapshot: item.productName,
      size_snapshot: item.sizeLabel,
      unit_price_paise: item.unitPricePaise,
      quantity: item.quantity,
      total_paise: item.totalPaise,
    });
    statements.push(
      db
        .prepare(
          `INSERT INTO order_items (
            id, order_id, product_id, variant_id, product_name_snapshot,
            size_snapshot, unit_price_paise, quantity, total_paise
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          itemId,
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.sizeLabel,
          item.unitPricePaise,
          item.quantity,
          item.totalPaise
        )
    );
  }

  if (calc.totalPaise > 0) {
    statements.push(
      db
        .prepare(
          `INSERT INTO payments (
            id, order_id, subscription_id, subscription_invoice_id, user_id, provider,
            status, amount_paise, refunded_amount_paise, currency, signature_verified, created_at, updated_at
          ) VALUES (?, ?, NULL, NULL, ?, ?, 'created', ?, 0, 'INR', 0, ?, ?)`
        )
        .bind(generateId(), orderId, user.id, paymentMethod, calc.totalPaise, now, now)
    );
  }

  if (calc.coupon && calc.discountPaise > 0) {
    statements.push(
      db
        .prepare(
          `INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_paise, redeemed_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(generateId(), calc.coupon.id, user.id, orderId, calc.discountPaise, now),
      db
        .prepare(`UPDATE coupons SET used_count = used_count + 1, updated_at = ? WHERE id = ?`)
        .bind(now, calc.coupon.id)
    );
  }

  try {
    await db.batch(statements);
  } catch (err) {
    // Restore stock on unexpected batch failure
    await db
      .batch(
        deducted.map((d) =>
          db
            .prepare(`UPDATE product_variants SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?`)
            .bind(d.quantity, now, d.variantId)
        )
      )
      .catch(() => {});
    throw err;
  }

  const created = await scoped.orders.getById(orderId);
  return { order: created.order, items: created.items.length > 0 ? created.items : createdItems };
}

/**
 * Race-safe conditional order status update (supports optional expectedStatus guard).
 */
export async function updateOrderStatusConditionalInD1(
  db: D1Database,
  user: AuthUser,
  orderId: string,
  newStatus: OrderStatus,
  expectedStatus?: OrderStatus,
  ipAddress?: string | null
): Promise<OrderRow> {
  if (user.role === 'customer') {
    throw new ForbiddenError('Customers cannot modify order delivery status.');
  }

  const scoped = createD1Repo(db).forUser(user);
  const { order } = await scoped.orders.getById(orderId);
  const targetExpected = expectedStatus || order.status;
  const now = utcNowIso();

  const updateRes = await db
    .prepare(
      `UPDATE orders
       SET status = ?, updated_at = ?
       WHERE id = ? AND status = ? AND deleted_at IS NULL`
    )
    .bind(newStatus, now, order.id, targetExpected)
    .run();

  if (!updateRes.meta?.changes || updateRes.meta.changes === 0) {
    throw new ConflictError(
      `Order status changed concurrently (expected "${targetExpected}"). Please refresh and retry.`
    );
  }

  await buildAuditLogStatement(db, {
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ORDER_STATUS_CHANGED',
    targetType: 'order',
    targetId: order.id,
    details: { fromStatus: targetExpected, toStatus: newStatus },
    ipAddress,
  }).run();

  return { ...order, status: newStatus, updated_at: now };
}

/**
 * Create a new subscription in D1 with server-computed price & IST cut-off check.
 */
export async function createSubscriptionInD1(
  db: D1Database,
  user: AuthUser,
  input: {
    planId?: string;
    productId?: string;
    variantId?: string;
    addressId?: string;
    deliveryAddress?: Record<string, any>;
    quantity: number;
    frequency: SubscriptionFrequency;
    deliverySlot: DeliverySlotCode;
    billingCycle: BillingCycle;
    startDate?: string;
    notes?: string;
  },
  ipAddress?: string | null
): Promise<SubscriptionRow> {
  const scoped = createD1Repo(db).forUser(user);

  // Resolve or create address
  let addressId = input.addressId;
  let pincode = '';
  if (addressId) {
    const addr = await scoped.addresses.getById(addressId);
    pincode = addr.pincode;
  } else if (input.deliveryAddress?.pincode) {
    const createdAddr = await scoped.addresses.create({
      label: 'Milk Delivery',
      recipientName: input.deliveryAddress.fullName || user.fullName,
      phone: input.deliveryAddress.mobile || input.deliveryAddress.phone || null,
      line1: input.deliveryAddress.addressLine1 || input.deliveryAddress.line1 || 'Seoni Delivery Address',
      line2: input.deliveryAddress.addressLine2 || input.deliveryAddress.line2 || null,
      landmark: input.deliveryAddress.landmark || null,
      city: input.deliveryAddress.city || 'Seoni',
      state: input.deliveryAddress.state || 'Madhya Pradesh',
      pincode: String(input.deliveryAddress.pincode).trim(),
      lat: input.deliveryAddress.lat ?? null,
      lng: input.deliveryAddress.lng ?? null,
      isDefault: false,
    });
    addressId = createdAddr.id;
    pincode = createdAddr.pincode;
  } else {
    throw new BadRequestError('An addressId or deliveryAddress is required to start a subscription.');
  }

  // Resolve product + variant + unit_price_paise strictly from D1
  let planId: string | null = null;
  let productId = input.productId || '';
  let variantId = input.variantId || '';
  let unitPricePaise = 0;

  if (input.planId) {
    const plan = await db
      .prepare(
        `SELECT id, product_id, variant_id, price_paise, is_active
         FROM plans WHERE id = ? AND is_active = 1 LIMIT 1`
      )
      .bind(input.planId)
      .first<Pick<PlanRow, 'id' | 'product_id' | 'variant_id' | 'price_paise' | 'is_active'>>();
    if (!plan) throw new NotFoundError('Selected subscription plan not found or inactive.');
    planId = plan.id;
    productId = plan.product_id;
    variantId = plan.variant_id;
    unitPricePaise = plan.price_paise;
  } else {
    if (!variantId) {
      throw new BadRequestError('Either planId or variantId is required.');
    }
    const variant = await db
      .prepare(
        `SELECT pv.id, pv.product_id, pv.price_paise, pv.is_subscription_eligible
         FROM product_variants pv
         INNER JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ? AND pv.is_active = 1 AND p.is_active = 1 AND p.deleted_at IS NULL
         LIMIT 1`
      )
      .bind(variantId)
      .first<{ id: string; product_id: string; price_paise: number; is_subscription_eligible: number }>();
    if (!variant) throw new NotFoundError('Selected product variant not found.');
    if (variant.is_subscription_eligible !== 1) {
      throw new BadRequestError('Selected product variant is not eligible for recurring subscriptions.');
    }
    productId = variant.product_id;
    variantId = variant.id;
    unitPricePaise = variant.price_paise;
  }

  const startDate = input.startDate || getTomorrowIstYmd();
  const cutoff = checkIstCutoffForDate(startDate, input.deliverySlot);
  if (!cutoff.allowed) {
    throw new BadRequestError(cutoff.reason || 'Start date cut-off has passed.');
  }

  const pinCheck = await findZoneForPincodeInD1(db, pincode);
  if (!pinCheck.serviceable) {
    throw new BadRequestError('Subscription delivery is not yet serviceable at this pincode.');
  }

  const customerDealer = await db
    .prepare(`SELECT dealer_id FROM dealer_customers WHERE customer_id = ? LIMIT 1`)
    .bind(user.id)
    .first<{ dealer_id: string }>();
  const dealerId = customerDealer?.dealer_id ?? pinCheck.dealerId;

  const id = generateId();
  const now = utcNowIso();

  await db.batch([
    db
      .prepare(
        `INSERT INTO subscriptions (
          id, user_id, dealer_id, address_id, plan_id, product_id, variant_id,
          quantity, frequency, delivery_slot, unit_price_paise, billing_cycle,
          paid_through_date, start_date, next_delivery_date, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'active', ?, ?, ?)`
      )
      .bind(
        id,
        user.id,
        dealerId,
        addressId,
        planId,
        productId,
        variantId,
        input.quantity,
        input.frequency,
        input.deliverySlot,
        unitPricePaise,
        input.billingCycle,
        startDate,
        startDate,
        input.notes?.trim() || null,
        now,
        now
      ),
    buildAuditLogStatement(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'SUBSCRIPTION_CREATED',
      targetType: 'subscription',
      targetId: id,
      details: { variantId, quantity: input.quantity, frequency: input.frequency, startDate },
      ipAddress,
    }),
  ]);

  const created = await scoped.subscriptions.getById(id);
  return created.subscription;
}

/**
 * Update subscription quantity/frequency/slot/status/price with role & IST cut-off checks.
 */
export async function updateSubscriptionInD1(
  db: D1Database,
  user: AuthUser,
  subId: string,
  updates: {
    quantity?: number;
    frequency?: SubscriptionFrequency;
    deliverySlot?: DeliverySlotCode;
    addressId?: string;
    status?: 'active' | 'paused' | 'cancelled';
    unitPricePaise?: number;
    notes?: string | null;
  },
  ipAddress?: string | null
): Promise<SubscriptionRow> {
  const scoped = createD1Repo(db).forUser(user);
  const { subscription } = await scoped.subscriptions.getById(subId);

  if (updates.unitPricePaise !== undefined && user.role === 'customer') {
    throw new ForbiddenError('Customers cannot override subscription unit price.');
  }

  if (updates.addressId) {
    await scoped.addresses.getById(updates.addressId);
  }

  const nextQuantity = updates.quantity ?? subscription.quantity;
  const nextFrequency = updates.frequency ?? subscription.frequency;
  const nextSlot = updates.deliverySlot ?? subscription.delivery_slot;
  const nextAddressId = updates.addressId ?? subscription.address_id;
  const nextStatus = updates.status ?? subscription.status;
  const nextUnitPrice =
    updates.unitPricePaise !== undefined ? updates.unitPricePaise : subscription.unit_price_paise;
  const nextNotes = updates.notes !== undefined ? updates.notes : subscription.notes;

  // If resuming from paused, ensure next_delivery_date is at least tomorrow IST
  let nextDeliveryDate = subscription.next_delivery_date;
  const tomorrow = getTomorrowIstYmd();
  if (nextStatus === 'active' && nextDeliveryDate < tomorrow) {
    nextDeliveryDate = computeNextDeliveryDate(getIstNowParts().ymd, nextFrequency);
  }

  const now = utcNowIso();
  await db.batch([
    db
      .prepare(
        `UPDATE subscriptions
         SET quantity = ?, frequency = ?, delivery_slot = ?, address_id = ?,
             status = ?, unit_price_paise = ?, next_delivery_date = ?, notes = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        nextQuantity,
        nextFrequency,
        nextSlot,
        nextAddressId,
        nextStatus,
        nextUnitPrice,
        nextDeliveryDate,
        nextNotes,
        now,
        subscription.id
      ),
    buildAuditLogStatement(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'SUBSCRIPTION_UPDATED',
      targetType: 'subscription',
      targetId: subscription.id,
      details: { ...updates },
      ipAddress,
    }),
  ]);

  return {
    ...subscription,
    quantity: nextQuantity,
    frequency: nextFrequency,
    delivery_slot: nextSlot,
    address_id: nextAddressId,
    status: nextStatus,
    unit_price_paise: nextUnitPrice,
    next_delivery_date: nextDeliveryDate,
    notes: nextNotes,
    updated_at: now,
  };
}

/**
 * Add a skip date to a subscription enforcing IST cut-off rules.
 */
export async function skipSubscriptionDateInD1(
  db: D1Database,
  user: AuthUser,
  subId: string,
  skipDate: string,
  reason?: string
): Promise<void> {
  const scoped = createD1Repo(db).forUser(user);
  const { subscription } = await scoped.subscriptions.getById(subId);

  if (subscription.status === 'cancelled') {
    throw new BadRequestError('Cannot skip delivery on a cancelled subscription.');
  }

  // Enforce IST cut-off for customers (admins/managers can override operationally)
  if (user.role === 'customer') {
    const cutoff = checkIstCutoffForDate(skipDate, subscription.delivery_slot);
    if (!cutoff.allowed) {
      throw new BadRequestError(cutoff.reason || 'IST delivery cut-off time has already passed.');
    }
  }

  await scoped.subscriptions.addSkipDate(subscription.id, skipDate, reason);
}

/**
 * Update a saved address scoped to user_id (or super_admin).
 */
export async function updateAddressInD1(
  db: D1Database,
  user: AuthUser,
  addressId: string,
  input: {
    label?: string;
    recipientName?: string;
    phone?: string | null;
    line1?: string;
    line2?: string | null;
    landmark?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: number | null;
    lng?: number | null;
    isDefault?: boolean;
  }
) {
  const scoped = createD1Repo(db).forUser(user);
  const existing = await scoped.addresses.getById(addressId);
  if (existing.user_id !== user.id && user.role !== 'super_admin') {
    throw new ForbiddenError('Access denied: Cannot edit another user’s address.');
  }

  const now = utcNowIso();
  const isDefault = input.isDefault !== undefined ? (input.isDefault ? 1 : 0) : existing.is_default;
  const lat = input.lat !== undefined ? (input.lat === null ? null : Number(input.lat.toFixed(6))) : existing.lat;
  const lng = input.lng !== undefined ? (input.lng === null ? null : Number(input.lng.toFixed(6))) : existing.lng;

  const statements: D1PreparedStatement[] = [];
  if (isDefault === 1) {
    statements.push(
      db
        .prepare(`UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL`)
        .bind(now, existing.user_id)
    );
  }
  statements.push(
    db
      .prepare(
        `UPDATE addresses
         SET label = ?, recipient_name = ?, phone = ?, line1 = ?, line2 = ?, landmark = ?,
             city = ?, state = ?, pincode = ?, lat = ?, lng = ?, is_default = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        input.label?.trim() || existing.label,
        input.recipientName?.trim() || existing.recipient_name,
        input.phone !== undefined ? input.phone : existing.phone,
        input.line1?.trim() || existing.line1,
        input.line2 !== undefined ? input.line2 : existing.line2,
        input.landmark !== undefined ? input.landmark : existing.landmark,
        input.city?.trim() || existing.city,
        input.state?.trim() || existing.state,
        input.pincode?.trim() || existing.pincode,
        lat,
        lng,
        isDefault,
        now,
        existing.id,
        existing.user_id
      )
  );

  await db.batch(statements);
  return scoped.addresses.getById(existing.id);
}

/**
 * Admin / Manager: Create a product + initial variant atomically in D1.
 */
export async function adminCreateProductInD1(
  db: D1Database,
  actor: AuthUser,
  input: {
    name: string;
    hindiName?: string;
    slug?: string;
    category: ProductCategory;
    description: string;
    heritageStory?: string;
    badge?: string;
    imageUrl?: string;
    shelfLife?: string;
    purityScore?: number;
    isSubscriptionEligible?: boolean;
    displayOrder?: number;
    variant: {
      sizeLabel: string;
      unitMlOrG: number;
      pricePaise: number;
      compareAtPricePaise?: number | null;
      stockQty: number;
      sku?: string;
    };
  },
  ipAddress?: string | null
): Promise<{ productId: string; variantId: string }> {
  const productId = generateId();
  const variantId = generateId();
  const now = utcNowIso();
  const slug =
    input.slug?.trim().toLowerCase() ||
    `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${productId.slice(0, 6)}`;
  const sku =
    input.variant.sku?.trim().toUpperCase() ||
    `DUG-${input.category.slice(0, 3).toUpperCase()}-${variantId.slice(0, 6).toUpperCase()}`;

  await db.batch([
    db
      .prepare(
        `INSERT INTO products (
          id, slug, name, hindi_name, category, description, heritage_story, badge,
          image_url, shelf_life, purity_score, is_subscription_eligible, is_active,
          display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      )
      .bind(
        productId,
        slug,
        input.name,
        input.hindiName || input.name,
        input.category,
        input.description,
        input.heritageStory || null,
        input.badge || null,
        input.imageUrl || '/assets/aistudio/image_fe6cbcdf.png',
        input.shelfLife || null,
        input.purityScore ?? 495,
        input.isSubscriptionEligible ? 1 : 0,
        input.displayOrder ?? 99,
        now,
        now
      ),
    db
      .prepare(
        `INSERT INTO product_variants (
          id, product_id, sku, size_label, unit_ml_or_g, price_paise,
          compare_at_price_paise, stock_qty, is_subscription_eligible, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(
        variantId,
        productId,
        sku,
        input.variant.sizeLabel,
        input.variant.unitMlOrG,
        input.variant.pricePaise,
        input.variant.compareAtPricePaise ?? null,
        input.variant.stockQty,
        input.isSubscriptionEligible ? 1 : 0,
        now,
        now
      ),
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'PRODUCT_CREATED',
      targetType: 'product',
      targetId: productId,
      details: { name: input.name, category: input.category, pricePaise: input.variant.pricePaise },
      ipAddress,
    }),
  ]);

  return { productId, variantId };
}

/**
 * Admin / Manager: Update variant price, active flag, or atomic stock adjustment.
 */
export async function adminUpdateVariantInD1(
  db: D1Database,
  actor: AuthUser,
  variantId: string,
  updates: {
    pricePaise?: number;
    compareAtPricePaise?: number | null;
    stockQty?: number;
    stockDelta?: number;
    isActive?: boolean;
  },
  ipAddress?: string | null
): Promise<ProductVariantRow> {
  const existing = await db
    .prepare(
      `SELECT id, product_id, sku, size_label, unit_ml_or_g, price_paise,
              compare_at_price_paise, stock_qty, is_subscription_eligible, is_active, created_at, updated_at
       FROM product_variants WHERE id = ? LIMIT 1`
    )
    .bind(variantId)
    .first<ProductVariantRow>();

  if (!existing) throw new NotFoundError('Product variant not found.');

  const now = utcNowIso();
  const nextPrice = updates.pricePaise ?? existing.price_paise;
  const nextCompare =
    updates.compareAtPricePaise !== undefined ? updates.compareAtPricePaise : existing.compare_at_price_paise;
  const nextActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existing.is_active;

  let nextStock = existing.stock_qty;
  if (typeof updates.stockDelta === 'number') {
    const res = await db
      .prepare(
        `UPDATE product_variants
         SET price_paise = ?, compare_at_price_paise = ?, stock_qty = stock_qty + ?, is_active = ?, updated_at = ?
         WHERE id = ? AND stock_qty + ? >= 0`
      )
      .bind(nextPrice, nextCompare, updates.stockDelta, nextActive, now, variantId, updates.stockDelta)
      .run();
    if (!res.meta?.changes || res.meta.changes === 0) {
      throw new BadRequestError('Stock adjustment would result in negative inventory.');
    }
    nextStock = existing.stock_qty + updates.stockDelta;
  } else {
    nextStock = updates.stockQty ?? existing.stock_qty;
    await db
      .prepare(
        `UPDATE product_variants
         SET price_paise = ?, compare_at_price_paise = ?, stock_qty = ?, is_active = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(nextPrice, nextCompare, nextStock, nextActive, now, variantId)
      .run();
  }

  await buildAuditLogStatement(db, {
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'VARIANT_UPDATED',
    targetType: 'product_variant',
    targetId: variantId,
    details: { ...updates, resultingStock: nextStock },
    ipAddress,
  }).run();

  return {
    ...existing,
    price_paise: nextPrice,
    compare_at_price_paise: nextCompare,
    stock_qty: nextStock,
    is_active: nextActive,
    updated_at: now,
  };
}

/**
 * Admin / Manager: Edit subscription plan pricing / frequency / active status.
 */
export async function adminUpdatePlanInD1(
  db: D1Database,
  actor: AuthUser,
  planId: string,
  updates: {
    name?: string;
    pricePaise?: number;
    frequency?: SubscriptionFrequency;
    billingCycle?: BillingCycle;
    isActive?: boolean;
  },
  ipAddress?: string | null
): Promise<PlanRow> {
  const existing = await db
    .prepare(
      `SELECT id, code, name, product_id, variant_id, milk_type, frequency,
              price_paise, billing_cycle, is_active, created_at, updated_at
       FROM plans WHERE id = ? LIMIT 1`
    )
    .bind(planId)
    .first<PlanRow>();

  if (!existing) throw new NotFoundError('Subscription plan not found.');

  const now = utcNowIso();
  const nextName = updates.name ?? existing.name;
  const nextPrice = updates.pricePaise ?? existing.price_paise;
  const nextFreq = updates.frequency ?? existing.frequency;
  const nextBilling = updates.billingCycle ?? existing.billing_cycle;
  const nextActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existing.is_active;

  await db.batch([
    db
      .prepare(
        `UPDATE plans
         SET name = ?, price_paise = ?, frequency = ?, billing_cycle = ?, is_active = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(nextName, nextPrice, nextFreq, nextBilling, nextActive, now, planId),
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'PLAN_UPDATED',
      targetType: 'plan',
      targetId: planId,
      details: { ...updates },
      ipAddress,
    }),
  ]);

  return {
    ...existing,
    name: nextName,
    price_paise: nextPrice,
    frequency: nextFreq,
    billing_cycle: nextBilling,
    is_active: nextActive,
    updated_at: now,
  };
}

export async function adminUpsertSiteSettingInD1(
  db: D1Database,
  actor: AuthUser,
  key: string,
  value: unknown,
  ipAddress?: string | null
): Promise<void> {
  const now = utcNowIso();
  await db.batch([
    db
      .prepare(
        `INSERT INTO site_settings (key, value_json, updated_by, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      )
      .bind(key, JSON.stringify(value), actor.id, now),
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SITE_SETTING_UPDATED',
      targetType: 'site_setting',
      targetId: key,
      ipAddress,
    }),
  ]);
}

export async function submitReviewInD1(
  db: D1Database,
  user: AuthUser | null,
  input: {
    productId: string;
    authorName: string;
    authorCity?: string;
    rating: number;
    title: string;
    comment: string;
  }
): Promise<ReviewRow> {
  const product = await db
    .prepare(`SELECT id FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(input.productId)
    .first<{ id: string }>();
  if (!product) throw new NotFoundError('Product not found.');

  let verifiedPurchase = 0;
  if (user?.id) {
    const delivered = await db
      .prepare(
        `SELECT 1 AS ok
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
         LIMIT 1`
      )
      .bind(user.id, input.productId)
      .first<{ ok: number }>();
    if (delivered) verifiedPurchase = 1;
  }

  const id = generateId();
  const now = utcNowIso();
  await db
    .prepare(
      `INSERT INTO reviews (
        id, product_id, user_id, author_name, author_city, rating,
        title, comment, verified_purchase, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
    .bind(
      id,
      input.productId,
      user?.id ?? null,
      input.authorName,
      input.authorCity || null,
      input.rating,
      input.title,
      input.comment,
      verifiedPurchase,
      now,
      now
    )
    .run();

  return {
    id,
    product_id: input.productId,
    user_id: user?.id ?? null,
    author_name: input.authorName,
    author_city: input.authorCity || null,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    verified_purchase: verifiedPurchase,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };
}

export async function moderateReviewInD1(
  db: D1Database,
  actor: AuthUser,
  reviewId: string,
  status: ReviewStatus,
  ipAddress?: string | null
): Promise<void> {
  const now = utcNowIso();
  const res = await db
    .prepare(`UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(status, now, reviewId)
    .run();
  if (!res.meta?.changes) throw new NotFoundError('Review not found.');

  await buildAuditLogStatement(db, {
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'REVIEW_MODERATED',
    targetType: 'review',
    targetId: reviewId,
    details: { status },
    ipAddress,
  }).run();
}

export async function submitEnquiryInD1(
  db: D1Database,
  input: { name: string; email: string; phone?: string; subject?: string; message: string }
): Promise<EnquiryRow> {
  const id = generateId();
  const now = utcNowIso();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject?.trim() || 'Website Contact Enquiry';

  await db
    .prepare(
      `INSERT INTO enquiries (id, name, email, phone, subject, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
    .bind(id, input.name.trim(), email, input.phone?.trim() || null, subject, input.message.trim(), now, now)
    .run();

  return {
    id,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || null,
    subject,
    message: input.message.trim(),
    status: 'new',
    handled_by: null,
    created_at: now,
    updated_at: now,
  };
}

export async function listEnquiriesInD1(
  db: D1Database,
  filter?: { status?: EnquiryStatus; limit?: number; offset?: number }
): Promise<{ items: EnquiryRow[]; limit: number; offset: number }> {
  const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
  const res = filter?.status
    ? await db
        .prepare(
          `SELECT id, name, email, phone, subject, message, status, handled_by, created_at, updated_at
           FROM enquiries WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .bind(filter.status, limit, offset)
        .all<EnquiryRow>()
    : await db
        .prepare(
          `SELECT id, name, email, phone, subject, message, status, handled_by, created_at, updated_at
           FROM enquiries ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .bind(limit, offset)
        .all<EnquiryRow>();

  return { items: res.results || [], limit, offset };
}

export async function updateEnquiryStatusInD1(
  db: D1Database,
  actor: AuthUser,
  enquiryId: string,
  status: EnquiryStatus
): Promise<void> {
  const res = await db
    .prepare(`UPDATE enquiries SET status = ?, handled_by = ?, updated_at = ? WHERE id = ?`)
    .bind(status, actor.id, utcNowIso(), enquiryId)
    .run();
  if (!res.meta?.changes) throw new NotFoundError('Enquiry not found.');
}

export async function assignDealerPincodesInD1(
  db: D1Database,
  actor: AuthUser,
  dealerId: string,
  pincodes: string[],
  ipAddress?: string | null
): Promise<void> {
  const dealer = await db.prepare(`SELECT id FROM dealers WHERE id = ? LIMIT 1`).bind(dealerId).first<{ id: string }>();
  if (!dealer) throw new NotFoundError('Dealer not found.');

  const now = utcNowIso();
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM dealer_pincodes WHERE dealer_id = ?`).bind(dealerId),
    ...pincodes.map((pin) =>
      db
        .prepare(`INSERT OR IGNORE INTO dealer_pincodes (dealer_id, pincode, created_at) VALUES (?, ?, ?)`)
        .bind(dealerId, pin, now)
    ),
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'DEALER_PINCODES_UPDATED',
      targetType: 'dealer',
      targetId: dealerId,
      details: { pincodes },
      ipAddress,
    }),
  ];
  await db.batch(statements);
}

export async function assignDealerCustomerInD1(
  db: D1Database,
  actor: AuthUser,
  dealerId: string,
  customerId: string,
  ipAddress?: string | null
): Promise<void> {
  const now = utcNowIso();
  await db.batch([
    db
      .prepare(
        `INSERT INTO dealer_customers (id, dealer_id, customer_id, assigned_at, assigned_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(customer_id) DO UPDATE SET dealer_id = excluded.dealer_id, assigned_at = excluded.assigned_at, assigned_by = excluded.assigned_by`
      )
      .bind(generateId(), dealerId, customerId, now, actor.id),
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'DEALER_CUSTOMER_ASSIGNED',
      targetType: 'dealer',
      targetId: dealerId,
      details: { customerId },
      ipAddress,
    }),
  ]);
}

export async function getDealerSummaryInD1(db: D1Database, user: AuthUser, deliveryDate?: string) {
  const targetDate = deliveryDate || getIstNowParts().ymd;
  const scoped = createD1Repo(db).forUser(user);
  const [customers, deliveries, subs] = await Promise.all([
    scoped.dealerCustomers.list({ limit: 100, offset: 0 }),
    scoped.orders.list({ deliveryDate: targetDate, limit: 100, offset: 0 }),
    scoped.subscriptions.list({ status: 'active', limit: 100, offset: 0 }),
  ]);

  const deliveredCount = deliveries.items.filter((o) => o.status === 'delivered').length;
  const pendingCount = deliveries.items.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  return {
    deliveryDate: targetDate,
    assignedCustomersCount: customers.items.length,
    activeSubscriptionsCount: subs.items.length,
    deliveriesTotal: deliveries.items.length,
    deliveredCount,
    pendingCount,
  };
}

export async function getAdminReportsSummaryInD1(db: D1Database, deliveryDate?: string) {
  const targetDate = deliveryDate || getIstNowParts().ymd;
  const [ordersToday, activeSubs, openEnquiries, pendingReviews] = await db.batch<any>([
    db
      .prepare(
        `SELECT COUNT(*) AS count, COALESCE(SUM(total_paise), 0) AS revenue_paise,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count
         FROM orders
         WHERE delivery_date = ? AND deleted_at IS NULL AND status != 'cancelled'`
      )
      .bind(targetDate),
    db.prepare(`SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'active' AND deleted_at IS NULL`),
    db.prepare(`SELECT COUNT(*) AS count FROM enquiries WHERE status = 'new'`),
    db.prepare(`SELECT COUNT(*) AS count FROM reviews WHERE status = 'pending'`),
  ]);

  const ordRow = ordersToday.results?.[0] || { count: 0, revenue_paise: 0, delivered_count: 0 };
  return {
    deliveryDate: targetDate,
    ordersTodayCount: Number(ordRow.count || 0),
    deliveredTodayCount: Number(ordRow.delivered_count || 0),
    revenueTodayPaise: Number(ordRow.revenue_paise || 0),
    activeSubscriptionsCount: Number(activeSubs.results?.[0]?.count || 0),
    openEnquiriesCount: Number(openEnquiries.results?.[0]?.count || 0),
    pendingReviewsCount: Number(pendingReviews.results?.[0]?.count || 0),
  };
}
