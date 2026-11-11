import { AuthUser } from '../types';
import { Order, Subscription } from '../../src/types';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { logAuditEvent } from '../services/auditService';

export interface ScopedDataStores {
  orders: Order[];
  subscriptions: Subscription[];
}

/**
 * Scoped Repository enforcing strict Row-Level Security (RLS) & IDOR prevention.
 * Every query automatically injects the tenant / customer boundary.
 */
export class ScopedRepository {
  private user: AuthUser;
  private stores: ScopedDataStores;

  constructor(user: AuthUser, stores: ScopedDataStores) {
    this.user = user;
    this.stores = stores;
  }

  public get orders() {
    return {
      /**
       * List orders scoped strictly to the authenticated user's role and boundary
       */
      findMany: (filter?: { status?: string; limit?: number; includeDeleted?: boolean }): Order[] => {
        let results = this.stores.orders;

        // Filter out soft-deleted orders by default
        if (!filter?.includeDeleted) {
          results = results.filter((o) => !(o as any).deleted_at);
        }

        if (this.user.role === 'customer') {
          // Customers can only see their own orders
          results = results.filter(
            (o) =>
              (o.userId && o.userId === this.user.id) ||
              (o.customerId && o.customerId === this.user.id) ||
              (o.customerEmail && o.customerEmail.toLowerCase() === this.user.email.toLowerCase())
          );
        } else if (this.user.role === 'dealer') {
          // Dealers can only see orders within their assigned dealer ID or serviceable pincodes
          results = results.filter((o) => {
            if (this.user.dealerId && o.dealerId === this.user.dealerId) return true;
            const pincode = o.deliveryPincode || o.shippingAddress?.pincode || (o.deliveryAddress as any)?.pincode;
            return Boolean(this.user.assignedPincodes && pincode && this.user.assignedPincodes.includes(pincode));
          });
        }
        // super_admin sees all orders

        if (filter?.status) {
          results = results.filter((o) => o.status === filter.status);
        }

        if (filter?.limit) {
          results = results.slice(0, filter.limit);
        }

        return results;
      },

      /**
       * Retrieve single order by ID with mandatory IDOR ownership check
       */
      findById: (orderId: string): Order => {
        const order = this.stores.orders.find((o) => o.id === orderId);
        if (!order) {
          throw new NotFoundError(`Order with ID ${orderId} does not exist.`);
        }

        // Ownership enforcement (IDOR protection)
        if (this.user.role === 'customer') {
          const isOwner =
            (order.userId && order.userId === this.user.id) ||
            (order.customerId && order.customerId === this.user.id) ||
            (order.customerEmail && order.customerEmail.toLowerCase() === this.user.email.toLowerCase());
          if (!isOwner) {
            throw new ForbiddenError('Access denied: You do not have permission to view or access this order.');
          }
        } else if (this.user.role === 'dealer') {
          const pincode = order.deliveryPincode || order.shippingAddress?.pincode || (order.deliveryAddress as any)?.pincode;
          const isInTerritory =
            (this.user.dealerId && order.dealerId === this.user.dealerId) ||
            Boolean(this.user.assignedPincodes && pincode && this.user.assignedPincodes.includes(pincode));
          if (!isInTerritory) {
            throw new ForbiddenError('Access denied: This order falls outside your assigned dealer territory.');
          }
        }

        return order;
      },

      /**
       * Mutate order status (Disallowed for customers)
       */
      updateStatus: (orderId: string, newStatus: Order['status'], clientIp?: string): Order => {
        if (this.user.role === 'customer') {
          throw new ForbiddenError('Customers are not permitted to modify order delivery status.');
        }

        // Check ownership/territory first
        const order = this.orders.findById(orderId);
        const oldStatus = order.status;
        order.status = newStatus;
        order.updatedAt = new Date().toISOString();

        // Audit log the status update
        logAuditEvent({
          actor: this.user,
          action: 'ORDER_STATUS_CHANGED',
          targetType: 'order',
          targetId: order.id,
          details: { oldStatus, newStatus },
          ip: clientIp,
        });

        return order;
      },
    };
  }

  public get subscriptions() {
    return {
      /**
       * List subscriptions scoped strictly to the authenticated user's role
       */
      findMany: (filter?: { status?: string; includeDeleted?: boolean }): Subscription[] => {
        let results = this.stores.subscriptions;

        // Filter out soft-deleted subscriptions by default
        if (!filter?.includeDeleted) {
          results = results.filter((s) => !(s as any).deleted_at);
        }

        if (this.user.role === 'customer') {
          results = results.filter(
            (s) =>
              (s.customerId && s.customerId === this.user.id) ||
              (s.customerEmail && s.customerEmail.toLowerCase() === this.user.email.toLowerCase())
          );
        } else if (this.user.role === 'dealer') {
          results = results.filter(
            (s) =>
              (this.user.dealerId && s.dealerId === this.user.dealerId) ||
              (this.user.assignedPincodes &&
                s.deliveryAddress?.pincode &&
                this.user.assignedPincodes.includes(s.deliveryAddress.pincode))
          );
        }

        if (filter?.status) {
          results = results.filter((s) => s.status === filter.status);
        }

        return results;
      },

      /**
       * Retrieve subscription by ID with mandatory IDOR ownership check
       */
      findById: (subId: string): Subscription => {
        const sub = this.stores.subscriptions.find((s) => s.id === subId);
        if (!sub) {
          throw new NotFoundError(`Subscription with ID ${subId} does not exist.`);
        }

        if (this.user.role === 'customer') {
          const isOwner =
            (sub.customerId && sub.customerId === this.user.id) ||
            (sub.customerEmail && sub.customerEmail.toLowerCase() === this.user.email.toLowerCase());
          if (!isOwner) {
            throw new ForbiddenError('Access denied: You do not have permission to view this subscription.');
          }
        } else if (this.user.role === 'dealer') {
          const isInTerritory =
            (this.user.dealerId && sub.dealerId === this.user.dealerId) ||
            (this.user.assignedPincodes &&
              sub.deliveryAddress?.pincode &&
              this.user.assignedPincodes.includes(sub.deliveryAddress.pincode));
          if (!isInTerritory) {
            throw new ForbiddenError('Access denied: Subscription outside your assigned dealer territory.');
          }
        }

        return sub;
      },

      /**
       * Cancel subscription: Customers can only cancel their own; dealers within territory
       */
      cancel: (subId: string, reason?: string, clientIp?: string): Subscription => {
        const sub = this.subscriptions.findById(subId);
        sub.status = 'cancelled';
        sub.updatedAt = new Date().toISOString();

        logAuditEvent({
          actor: this.user,
          action: 'SUBSCRIPTION_MODIFIED',
          targetType: 'subscription',
          targetId: sub.id,
          details: { action: 'cancel', reason },
          ip: clientIp,
        });

        return sub;
      },
    };
  }
}

/**
 * Factory helper: creates a scoped repository bound to the authenticated user
 */
export function repoForUser(user: AuthUser, stores: ScopedDataStores): ScopedRepository {
  return new ScopedRepository(user, stores);
}
