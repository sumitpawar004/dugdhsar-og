import { AuthUser, D1Database, D1PreparedStatement } from '../types';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors/AppError';
import { clampPagination, generateId, utcNowIso } from './client';
import { buildAuditLogStatement } from './auditRepo';
import {
  AddressRow,
  AuditLogRow,
  OrderItemRow,
  OrderRow,
  OrderStatus,
  OrderType,
  PaymentRow,
  PlanRow,
  ProductCategory,
  ProductRow,
  ProductVariantRow,
  ReviewRow,
  SiteSettingRow,
  SubscriptionInvoiceRow,
  SubscriptionPauseRow,
  SubscriptionRow,
  SubscriptionStatus,
  UserRow,
} from './types';

// Explicit column lists — never use SELECT * on growing tables
const ORDER_SUMMARY_COLUMNS = `
  o.id, o.order_number, o.order_type, o.user_id, o.dealer_id, o.subscription_id,
  o.address_id, o.coupon_id, o.shipping_address_json, o.delivery_pincode,
  o.delivery_date, o.delivery_slot, o.status, o.payment_method, o.payment_status,
  o.subtotal_paise, o.tax_paise, o.delivery_fee_paise, o.discount_paise, o.total_paise,
  o.qr_token, o.qr_verified_at, o.qr_verified_by, o.notes, o.created_at, o.updated_at
`;

const SUBSCRIPTION_COLUMNS = `
  s.id, s.user_id, s.dealer_id, s.address_id, s.plan_id, s.product_id, s.variant_id,
  s.quantity, s.frequency, s.delivery_slot, s.unit_price_paise, s.billing_cycle,
  s.paid_through_date, s.start_date, s.next_delivery_date, s.status, s.notes,
  s.created_at, s.updated_at
`;

const PAYMENT_COLUMNS = `
  p.id, p.order_id, p.subscription_id, p.subscription_invoice_id, p.user_id,
  p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.status,
  p.amount_paise, p.refunded_amount_paise, p.currency, p.signature_verified,
  p.error_code, p.created_at, p.updated_at
`;

const ADDRESS_COLUMNS = `
  id, user_id, label, recipient_name, phone, line1, line2, landmark,
  city, state, pincode, lat, lng, is_default, created_at, updated_at
`;

function isOpsRole(user: AuthUser): boolean {
  return user.role === 'super_admin' || user.role === 'manager';
}

/**
 * Mandatory User-Scoped D1 Repository.
 *
 * Every query automatically injects the role/owner/dealer boundary:
 *   - customer: ONLY own rows (user_id = user.id)
 *   - dealer: ONLY own customers' / territory rows (dealer_id = user.dealerId or dealer_customers)
 *   - manager / super_admin: full operational visibility (super_admin exclusive for audit_logs & staff)
 *
 * Route handlers MUST call createD1Repo(db).forUser(user) and NEVER write raw unscoped queries.
 */
export class ScopedD1Repository {
  private readonly db: D1Database;
  private readonly user: AuthUser;

  constructor(db: D1Database, user: AuthUser) {
    this.db = db;
    this.user = user;
  }

  private async resolveDealerId(): Promise<string | null> {
    if (this.user.dealerId) return this.user.dealerId;
    if (this.user.role !== 'dealer') return null;
    const row = await this.db
      .prepare(`SELECT id FROM dealers WHERE user_id = ? AND status = 'active' LIMIT 1`)
      .bind(this.user.id)
      .first<{ id: string }>();
    return row?.id ?? null;
  }

  // =========================================================================
  // 1. PROFILE (Strictly Own Row)
  // =========================================================================
  public get profile() {
    return {
      get: async (): Promise<Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'avatar_url' | 'role' | 'status' | 'created_at' | 'updated_at'> | null> => {
        return this.db
          .prepare(
            `SELECT id, email, name, phone, avatar_url, role, status, created_at, updated_at
             FROM users
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`
          )
          .bind(this.user.id)
          .first();
      },

      update: async (input: { name?: string; phone?: string | null }): Promise<void> => {
        const now = utcNowIso();
        await this.db
          .prepare(
            `UPDATE users
             SET name = COALESCE(?, name),
                 phone = CASE WHEN ? = 1 THEN ? ELSE phone END,
                 updated_at = ?
             WHERE id = ? AND deleted_at IS NULL`
          )
          .bind(
            input.name?.trim() || null,
            input.phone !== undefined ? 1 : 0,
            input.phone ?? null,
            now,
            this.user.id
          )
          .run();
      },
    };
  }

  // =========================================================================
  // 2. ADDRESSES (Strictly Scoped to user_id; IDOR-Protected)
  // =========================================================================
  public get addresses() {
    return {
      list: async (): Promise<AddressRow[]> => {
        const res = await this.db
          .prepare(
            `SELECT ${ADDRESS_COLUMNS}
             FROM addresses
             WHERE user_id = ? AND deleted_at IS NULL
             ORDER BY is_default DESC, created_at DESC
             LIMIT 50`
          )
          .bind(this.user.id)
          .all<AddressRow>();
        return res.results || [];
      },

      getById: async (addressId: string): Promise<AddressRow> => {
        const row = await this.db
          .prepare(
            `SELECT ${ADDRESS_COLUMNS}, deleted_at
             FROM addresses
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`
          )
          .bind(addressId)
          .first<AddressRow>();

        if (!row) {
          throw new NotFoundError('Address not found.');
        }
        if (row.user_id !== this.user.id && !isOpsRole(this.user)) {
          if (this.user.role === 'dealer') {
            const dealerId = await this.resolveDealerId();
            const ownsCustomer = dealerId
              ? await this.db
                  .prepare(`SELECT 1 AS ok FROM dealer_customers WHERE dealer_id = ? AND customer_id = ? LIMIT 1`)
                  .bind(dealerId, row.user_id)
                  .first<{ ok: number }>()
              : null;
            if (!ownsCustomer) {
              throw new ForbiddenError('Access denied: You cannot access another user’s address.');
            }
          } else {
            throw new ForbiddenError('Access denied: You cannot access another user’s address.');
          }
        }
        return row;
      },

      create: async (input: {
        label?: string;
        recipientName: string;
        phone?: string | null;
        line1: string;
        line2?: string | null;
        landmark?: string | null;
        city: string;
        state?: string;
        pincode: string;
        lat?: number | null;
        lng?: number | null;
        isDefault?: boolean;
      }): Promise<AddressRow> => {
        const id = generateId();
        const now = utcNowIso();
        const isDefault = input.isDefault ? 1 : 0;
        const latRounded = typeof input.lat === 'number' ? Number(input.lat.toFixed(6)) : null;
        const lngRounded = typeof input.lng === 'number' ? Number(input.lng.toFixed(6)) : null;

        const statements: D1PreparedStatement[] = [];
        if (isDefault === 1) {
          statements.push(
            this.db
              .prepare(`UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL`)
              .bind(now, this.user.id)
          );
        }
        statements.push(
          this.db
            .prepare(
              `INSERT INTO addresses (
                id, user_id, label, recipient_name, phone, line1, line2, landmark,
                city, state, pincode, lat, lng, is_default, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              id,
              this.user.id,
              input.label?.trim() || 'Home',
              input.recipientName.trim(),
              input.phone ?? null,
              input.line1.trim(),
              input.line2?.trim() || null,
              input.landmark?.trim() || null,
              input.city.trim(),
              input.state?.trim() || 'Madhya Pradesh',
              input.pincode.trim(),
              latRounded,
              lngRounded,
              isDefault,
              now,
              now
            )
        );

        await this.db.batch(statements);
        return this.addresses.getById(id);
      },

      softDelete: async (addressId: string): Promise<void> => {
        const existing = await this.addresses.getById(addressId);
        if (existing.user_id !== this.user.id && this.user.role !== 'super_admin') {
          throw new ForbiddenError('Access denied: Cannot delete another user’s address.');
        }
        const now = utcNowIso();
        await this.db
          .prepare(`UPDATE addresses SET is_default = 0, deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
          .bind(now, now, addressId, existing.user_id)
          .run();
      },
    };
  }

  // =========================================================================
  // 3. ORDERS (Role-Scoped, Paginated, IDOR-Protected, Single-Use QR Verify)
  // =========================================================================
  public get orders() {
    return {
      list: async (filter?: {
        status?: OrderStatus;
        deliveryDate?: string;
        orderType?: OrderType;
        limit?: number;
        offset?: number;
      }): Promise<{ items: OrderRow[]; limit: number; offset: number }> => {
        const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
        const clauses: string[] = ['o.deleted_at IS NULL'];
        const bindings: unknown[] = [];

        if (this.user.role === 'customer') {
          clauses.push('o.user_id = ?');
          bindings.push(this.user.id);
        } else if (this.user.role === 'dealer') {
          const dealerId = await this.resolveDealerId();
          if (!dealerId) return { items: [], limit, offset };
          clauses.push(
            `(o.dealer_id = ? OR o.user_id IN (SELECT customer_id FROM dealer_customers WHERE dealer_id = ?))`
          );
          bindings.push(dealerId, dealerId);
        }

        if (filter?.status) {
          clauses.push('o.status = ?');
          bindings.push(filter.status);
        }
        if (filter?.deliveryDate) {
          clauses.push('o.delivery_date = ?');
          bindings.push(filter.deliveryDate);
        }
        if (filter?.orderType) {
          clauses.push('o.order_type = ?');
          bindings.push(filter.orderType);
        }

        bindings.push(limit, offset);
        const sql = `
          SELECT ${ORDER_SUMMARY_COLUMNS}
          FROM orders o
          WHERE ${clauses.join(' AND ')}
          ORDER BY o.created_at DESC
          LIMIT ? OFFSET ?
        `;
        const res = await this.db.prepare(sql).bind(...bindings).all<OrderRow>();
        return { items: res.results || [], limit, offset };
      },

      getById: async (orderId: string): Promise<{ order: OrderRow; items: OrderItemRow[] }> => {
        const order = await this.db
          .prepare(
            `SELECT ${ORDER_SUMMARY_COLUMNS}
             FROM orders o
             WHERE (o.id = ? OR o.order_number = ?) AND o.deleted_at IS NULL
             LIMIT 1`
          )
          .bind(orderId, orderId)
          .first<OrderRow>();

        if (!order) {
          throw new NotFoundError('Order not found.');
        }

        await this.assertOrderAccess(order);

        const itemsRes = await this.db
          .prepare(
            `SELECT id, order_id, product_id, variant_id, product_name_snapshot,
                    size_snapshot, unit_price_paise, quantity, total_paise
             FROM order_items
             WHERE order_id = ?`
          )
          .bind(order.id)
          .all<OrderItemRow>();

        return { order, items: itemsRes.results || [] };
      },

      updateStatus: async (orderId: string, newStatus: OrderStatus, ipAddress?: string | null): Promise<OrderRow> => {
        if (this.user.role === 'customer') {
          throw new ForbiddenError('Customers cannot modify order delivery status.');
        }

        const { order } = await this.orders.getById(orderId);
        const now = utcNowIso();

        await this.db.batch([
          this.db
            .prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`)
            .bind(newStatus, now, order.id),
          buildAuditLogStatement(this.db, {
            actorUserId: this.user.id,
            actorEmail: this.user.email,
            actorRole: this.user.role,
            action: 'ORDER_STATUS_CHANGED',
            targetType: 'order',
            targetId: order.id,
            details: { oldStatus: order.status, newStatus },
            ipAddress,
          }),
        ]);

        return { ...order, status: newStatus, updated_at: now };
      },

      /**
       * Single-use atomic doorstep QR verification.
       * Allowed ONLY for the order's assigned dealer, manager, or super_admin.
       */
      verifyDoorstepQr: async (qrToken: string, ipAddress?: string | null): Promise<OrderRow> => {
        if (this.user.role === 'customer') {
          throw new ForbiddenError('Only assigned delivery dealers or admins can verify doorstep QR codes.');
        }
        const cleanToken = qrToken.trim();
        if (cleanToken.length < 32) {
          throw new BadRequestError('Invalid doorstep QR token format.');
        }

        const order = await this.db
          .prepare(
            `SELECT ${ORDER_SUMMARY_COLUMNS}
             FROM orders o
             WHERE o.qr_token = ? AND o.deleted_at IS NULL
             LIMIT 1`
          )
          .bind(cleanToken)
          .first<OrderRow>();

        if (!order) {
          throw new NotFoundError('No order matches this doorstep QR code.');
        }

        await this.assertOrderAccess(order);

        if (order.qr_verified_at) {
          throw new ConflictError('This doorstep QR code has already been verified and cannot be reused.');
        }

        const now = utcNowIso();
        // Atomic single-use conditional update prevents concurrent double-scan races
        const updateRes = await this.db
          .prepare(
            `UPDATE orders
             SET status = 'delivered',
                 qr_verified_at = ?,
                 qr_verified_by = ?,
                 updated_at = ?
             WHERE id = ? AND qr_verified_at IS NULL`
          )
          .bind(now, this.user.id, now, order.id)
          .run();

        if (!updateRes.meta?.changes || updateRes.meta.changes === 0) {
          throw new ConflictError('Doorstep QR code was already verified by another scan.');
        }

        await buildAuditLogStatement(this.db, {
          actorUserId: this.user.id,
          actorEmail: this.user.email,
          actorRole: this.user.role,
          action: 'ORDER_QR_VERIFIED',
          targetType: 'order',
          targetId: order.id,
          details: { orderNumber: order.order_number, verifiedAt: now },
          ipAddress,
        }).run();

        return {
          ...order,
          status: 'delivered',
          qr_verified_at: now,
          qr_verified_by: this.user.id,
          updated_at: now,
        };
      },
    };
  }

  private async assertOrderAccess(order: OrderRow): Promise<void> {
    if (isOpsRole(this.user)) return;

    if (this.user.role === 'customer') {
      if (order.user_id !== this.user.id) {
        throw new ForbiddenError('Access denied: You do not have permission to access this order.');
      }
      return;
    }

    if (this.user.role === 'dealer') {
      const dealerId = await this.resolveDealerId();
      if (!dealerId) {
        throw new ForbiddenError('Access denied: Dealer account is not active.');
      }
      if (order.dealer_id === dealerId) return;

      const ownership = await this.db
        .prepare(`SELECT 1 AS ok FROM dealer_customers WHERE dealer_id = ? AND customer_id = ? LIMIT 1`)
        .bind(dealerId, order.user_id)
        .first<{ ok: number }>();

      if (!ownership) {
        throw new ForbiddenError('Access denied: This order is outside your assigned dealer territory.');
      }
    }
  }

  // =========================================================================
  // 4. SUBSCRIPTIONS & SKIP DATES (Role-Scoped, Paginated, IDOR-Protected)
  // =========================================================================
  public get subscriptions() {
    return {
      list: async (filter?: {
        status?: SubscriptionStatus;
        limit?: number;
        offset?: number;
      }): Promise<{ items: SubscriptionRow[]; limit: number; offset: number }> => {
        const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
        const clauses: string[] = ['s.deleted_at IS NULL'];
        const bindings: unknown[] = [];

        if (this.user.role === 'customer') {
          clauses.push('s.user_id = ?');
          bindings.push(this.user.id);
        } else if (this.user.role === 'dealer') {
          const dealerId = await this.resolveDealerId();
          if (!dealerId) return { items: [], limit, offset };
          clauses.push(
            `(s.dealer_id = ? OR s.user_id IN (SELECT customer_id FROM dealer_customers WHERE dealer_id = ?))`
          );
          bindings.push(dealerId, dealerId);
        }

        if (filter?.status) {
          clauses.push('s.status = ?');
          bindings.push(filter.status);
        }

        bindings.push(limit, offset);
        const res = await this.db
          .prepare(
            `SELECT ${SUBSCRIPTION_COLUMNS}
             FROM subscriptions s
             WHERE ${clauses.join(' AND ')}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`
          )
          .bind(...bindings)
          .all<SubscriptionRow>();

        return { items: res.results || [], limit, offset };
      },

      getById: async (subId: string): Promise<{ subscription: SubscriptionRow; pauses: SubscriptionPauseRow[] }> => {
        const sub = await this.db
          .prepare(
            `SELECT ${SUBSCRIPTION_COLUMNS}
             FROM subscriptions s
             WHERE s.id = ? AND s.deleted_at IS NULL
             LIMIT 1`
          )
          .bind(subId)
          .first<SubscriptionRow>();

        if (!sub) {
          throw new NotFoundError('Subscription not found.');
        }

        await this.assertSubscriptionAccess(sub);

        const pausesRes = await this.db
          .prepare(
            `SELECT id, subscription_id, skip_date, reason, created_by, created_at
             FROM subscription_pauses
             WHERE subscription_id = ?
             ORDER BY skip_date DESC
             LIMIT 60`
          )
          .bind(sub.id)
          .all<SubscriptionPauseRow>();

        return { subscription: sub, pauses: pausesRes.results || [] };
      },

      updateStatus: async (
        subId: string,
        status: SubscriptionStatus,
        reason?: string,
        ipAddress?: string | null
      ): Promise<SubscriptionRow> => {
        const { subscription } = await this.subscriptions.getById(subId);
        const now = utcNowIso();

        await this.db.batch([
          this.db
            .prepare(`UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?`)
            .bind(status, now, subscription.id),
          buildAuditLogStatement(this.db, {
            actorUserId: this.user.id,
            actorEmail: this.user.email,
            actorRole: this.user.role,
            action: 'SUBSCRIPTION_STATUS_CHANGED',
            targetType: 'subscription',
            targetId: subscription.id,
            details: { oldStatus: subscription.status, newStatus: status, reason },
            ipAddress,
          }),
        ]);

        return { ...subscription, status, updated_at: now };
      },

      addSkipDate: async (subId: string, skipDate: string, reason?: string): Promise<void> => {
        const { subscription } = await this.subscriptions.getById(subId);
        await this.db
          .prepare(
            `INSERT OR IGNORE INTO subscription_pauses (id, subscription_id, skip_date, reason, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(generateId(), subscription.id, skipDate, reason?.trim() || null, this.user.id, utcNowIso())
          .run();
      },

      removeSkipDate: async (subId: string, skipDate: string): Promise<void> => {
        const { subscription } = await this.subscriptions.getById(subId);
        await this.db
          .prepare(`DELETE FROM subscription_pauses WHERE subscription_id = ? AND skip_date = ?`)
          .bind(subscription.id, skipDate)
          .run();
      },
    };
  }

  private async assertSubscriptionAccess(sub: SubscriptionRow): Promise<void> {
    if (isOpsRole(this.user)) return;

    if (this.user.role === 'customer') {
      if (sub.user_id !== this.user.id) {
        throw new ForbiddenError('Access denied: You cannot access another user’s subscription.');
      }
      return;
    }

    if (this.user.role === 'dealer') {
      const dealerId = await this.resolveDealerId();
      if (!dealerId) {
        throw new ForbiddenError('Access denied: Dealer account is not active.');
      }
      if (sub.dealer_id === dealerId) return;

      const ownership = await this.db
        .prepare(`SELECT 1 AS ok FROM dealer_customers WHERE dealer_id = ? AND customer_id = ? LIMIT 1`)
        .bind(dealerId, sub.user_id)
        .first<{ ok: number }>();

      if (!ownership) {
        throw new ForbiddenError('Access denied: Subscription falls outside your dealer territory.');
      }
    }
  }

  // =========================================================================
  // 5. SUBSCRIPTION INVOICES & PAYMENTS (Role-Scoped, Paginated)
  // =========================================================================
  public get invoices() {
    return {
      list: async (filter?: {
        status?: SubscriptionInvoiceRow['status'];
        limit?: number;
        offset?: number;
      }): Promise<{ items: SubscriptionInvoiceRow[]; limit: number; offset: number }> => {
        const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
        const clauses: string[] = [];
        const bindings: unknown[] = [];

        if (this.user.role === 'customer') {
          clauses.push('si.user_id = ?');
          bindings.push(this.user.id);
        } else if (this.user.role === 'dealer') {
          const dealerId = await this.resolveDealerId();
          if (!dealerId) return { items: [], limit, offset };
          clauses.push(`si.user_id IN (SELECT customer_id FROM dealer_customers WHERE dealer_id = ?)`);
          bindings.push(dealerId);
        }

        if (filter?.status) {
          clauses.push('si.status = ?');
          bindings.push(filter.status);
        }

        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        bindings.push(limit, offset);

        const res = await this.db
          .prepare(
            `SELECT si.id, si.invoice_number, si.subscription_id, si.user_id,
                    si.period_start, si.period_end, si.scheduled_deliveries,
                    si.skipped_deliveries, si.amount_paise, si.status,
                    si.due_date, si.paid_at, si.created_at, si.updated_at
             FROM subscription_invoices si
             ${whereSql}
             ORDER BY si.created_at DESC
             LIMIT ? OFFSET ?`
          )
          .bind(...bindings)
          .all<SubscriptionInvoiceRow>();

        return { items: res.results || [], limit, offset };
      },
    };
  }

  public get payments() {
    return {
      list: async (filter?: {
        orderId?: string;
        subscriptionId?: string;
        limit?: number;
        offset?: number;
      }): Promise<{ items: PaymentRow[]; limit: number; offset: number }> => {
        const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
        const clauses: string[] = [];
        const bindings: unknown[] = [];

        if (this.user.role === 'customer') {
          clauses.push('p.user_id = ?');
          bindings.push(this.user.id);
        } else if (this.user.role === 'dealer') {
          const dealerId = await this.resolveDealerId();
          if (!dealerId) return { items: [], limit, offset };
          clauses.push(`p.user_id IN (SELECT customer_id FROM dealer_customers WHERE dealer_id = ?)`);
          bindings.push(dealerId);
        }

        if (filter?.orderId) {
          clauses.push('p.order_id = ?');
          bindings.push(filter.orderId);
        }
        if (filter?.subscriptionId) {
          clauses.push('p.subscription_id = ?');
          bindings.push(filter.subscriptionId);
        }

        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        bindings.push(limit, offset);

        const res = await this.db
          .prepare(
            `SELECT ${PAYMENT_COLUMNS}
             FROM payments p
             ${whereSql}
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`
          )
          .bind(...bindings)
          .all<PaymentRow>();

        return { items: res.results || [], limit, offset };
      },
    };
  }

  // =========================================================================
  // 6. DEALER CUSTOMERS (Dealer Sees Own Customers Only; Ops Sees All)
  // =========================================================================
  public get dealerCustomers() {
    return {
      list: async (filter?: {
        limit?: number;
        offset?: number;
      }): Promise<{
        items: Array<{ id: string; name: string; email: string; phone: string | null; assigned_at: string }>;
        limit: number;
        offset: number;
      }> => {
        if (this.user.role === 'customer') {
          throw new ForbiddenError('Customers cannot list dealer customer assignments.');
        }

        const { limit, offset } = clampPagination(filter?.limit, filter?.offset);
        if (this.user.role === 'dealer') {
          const dealerId = await this.resolveDealerId();
          if (!dealerId) return { items: [], limit, offset };

          const res = await this.db
            .prepare(
              `SELECT u.id, u.name, u.email, u.phone, dc.assigned_at
               FROM dealer_customers dc
               INNER JOIN users u ON u.id = dc.customer_id
               WHERE dc.dealer_id = ? AND u.deleted_at IS NULL
               ORDER BY dc.assigned_at DESC
               LIMIT ? OFFSET ?`
            )
            .bind(dealerId, limit, offset)
            .all<{ id: string; name: string; email: string; phone: string | null; assigned_at: string }>();

          return { items: res.results || [], limit, offset };
        }

        const res = await this.db
          .prepare(
            `SELECT u.id, u.name, u.email, u.phone, dc.assigned_at
             FROM dealer_customers dc
             INNER JOIN users u ON u.id = dc.customer_id
             WHERE u.deleted_at IS NULL
             ORDER BY dc.assigned_at DESC
             LIMIT ? OFFSET ?`
          )
          .bind(limit, offset)
          .all<{ id: string; name: string; email: string; phone: string | null; assigned_at: string }>();

        return { items: res.results || [], limit, offset };
      },
    };
  }

  // =========================================================================
  // 7. AUDIT LOGS (Strictly Super Admin Only)
  // =========================================================================
  public get auditLogs() {
    return {
      list: async (filter?: {
        limit?: number;
        offset?: number;
      }): Promise<{ items: AuditLogRow[]; limit: number; offset: number }> => {
        if (this.user.role !== 'super_admin') {
          throw new ForbiddenError('Only Super Admin can inspect audit logs.');
        }
        const { limit, offset } = clampPagination(filter?.limit, filter?.offset, 100, 50);
        const res = await this.db
          .prepare(
            `SELECT id, actor_user_id, actor_email, actor_role, action,
                    target_type, target_id, details_json, ip_address, created_at
             FROM audit_logs
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`
          )
          .bind(limit, offset)
          .all<AuditLogRow>();

        return { items: res.results || [], limit, offset };
      },
    };
  }
}

/**
 * Public Catalog Read Queries (safe non-PII reads — intended to be cached in KV for 5 min).
 */
export class PublicCatalogD1Repository {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async listProductsWithVariants(category?: ProductCategory): Promise<Array<ProductRow & { variants: ProductVariantRow[] }>> {
    const productStmt = category
      ? this.db
          .prepare(
            `SELECT id, slug, name, hindi_name, category, description, heritage_story, badge,
                    image_url, shelf_life, purity_score, is_subscription_eligible, is_active,
                    display_order, created_at, updated_at, deleted_at
             FROM products
             WHERE category = ? AND is_active = 1 AND deleted_at IS NULL
             ORDER BY display_order ASC`
          )
          .bind(category)
      : this.db.prepare(
          `SELECT id, slug, name, hindi_name, category, description, heritage_story, badge,
                  image_url, shelf_life, purity_score, is_subscription_eligible, is_active,
                  display_order, created_at, updated_at, deleted_at
           FROM products
           WHERE is_active = 1 AND deleted_at IS NULL
           ORDER BY display_order ASC`
        );

    const [productsRes, variantsRes] = await this.db.batch<any>([
      productStmt,
      this.db.prepare(
        `SELECT id, product_id, sku, size_label, unit_ml_or_g, price_paise,
                compare_at_price_paise, stock_qty, is_subscription_eligible, is_active,
                created_at, updated_at
         FROM product_variants
         WHERE is_active = 1
         ORDER BY price_paise ASC`
      ),
    ]);

    const products = (productsRes.results || []) as ProductRow[];
    const variants = (variantsRes.results || []) as ProductVariantRow[];
    const variantsByProduct = new Map<string, ProductVariantRow[]>();

    for (const v of variants) {
      const list = variantsByProduct.get(v.product_id) || [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    return products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p.id) || [],
    }));
  }

  async listActivePlans(): Promise<PlanRow[]> {
    const res = await this.db
      .prepare(
        `SELECT id, code, name, product_id, variant_id, milk_type, frequency,
                price_paise, billing_cycle, is_active, created_at, updated_at
         FROM plans
         WHERE is_active = 1
         ORDER BY milk_type ASC, price_paise ASC`
      )
      .all<PlanRow>();
    return res.results || [];
  }

  async listApprovedReviews(productId?: string, limitInput = 25, offsetInput = 0): Promise<ReviewRow[]> {
    const { limit, offset } = clampPagination(limitInput, offsetInput, 50, 25);
    if (productId) {
      const res = await this.db
        .prepare(
          `SELECT id, product_id, user_id, author_name, author_city, rating,
                  title, comment, verified_purchase, status, created_at, updated_at
           FROM reviews
           WHERE product_id = ? AND status = 'approved'
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        )
        .bind(productId, limit, offset)
        .all<ReviewRow>();
      return res.results || [];
    }

    const res = await this.db
      .prepare(
        `SELECT id, product_id, user_id, author_name, author_city, rating,
                title, comment, verified_purchase, status, created_at, updated_at
         FROM reviews
         WHERE status = 'approved'
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<ReviewRow>();
    return res.results || [];
  }

  async getSiteSettings(): Promise<Record<string, unknown>> {
    const res = await this.db
      .prepare(`SELECT key, value_json, updated_by, updated_at FROM site_settings`)
      .all<SiteSettingRow>();
    const map: Record<string, unknown> = {};
    for (const row of res.results || []) {
      try {
        map[row.key] = JSON.parse(row.value_json);
      } catch {
        map[row.key] = row.value_json;
      }
    }
    return map;
  }
}

/**
 * Factory entry point for the D1 Data Access Layer.
 * Always instantiate inside a request handler with the request's env.DB.
 */
export function createD1Repo(db: D1Database) {
  return {
    forUser(user: AuthUser): ScopedD1Repository {
      return new ScopedD1Repository(db, user);
    },
    publicCatalog: new PublicCatalogD1Repository(db),
  };
}
