import { Order, OrderItem, InventoryBatch, InventoryMovement, Subscription } from '../../src/types';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/AppError';
import { logAuditEvent } from './auditService';
import { logger } from '../logger';

export interface InventoryContext {
  batches: InventoryBatch[];
  movements: InventoryMovement[];
}

/**
 * Concurrency-Safe FEFO (First-Expired, First-Out) Inventory Deduction
 * Guarantees no overselling even under concurrent checkout requests.
 */
export function allocateInventoryFefo(
  variantId: string,
  quantityRequested: number,
  context: InventoryContext,
  referenceId: string,
  actorEmail = 'system@dugdhsar.in'
): { allocatedBatchIds: string[]; totalAllocated: number } {
  if (quantityRequested <= 0) {
    throw new BadRequestError('Requested quantity must be greater than zero.');
  }

  const now = new Date();

  // 1. Find all active, non-quarantined batches with valid expiry and available stock
  const candidateBatches = context.batches
    .filter(
      (b) =>
        b.variantId === variantId &&
        !b.isQuarantined &&
        b.status === 'active' &&
        new Date(b.expiryDate) > now &&
        b.onHandQuantity - b.reservedQuantity > 0
    )
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FEFO order

  // 2. Check total availability before mutating any batch
  const totalAvailable = candidateBatches.reduce(
    (sum, b) => sum + (b.onHandQuantity - b.reservedQuantity),
    0
  );

  if (totalAvailable < quantityRequested) {
    throw new BadRequestError(
      `Insufficient fresh cold-chain stock for variant "${variantId}". Requested: ${quantityRequested}, Available: ${totalAvailable}.`
    );
  }

  // 3. Atomically allocate from earliest expiring batches
  let remainingToDeduct = quantityRequested;
  const allocatedBatchIds: string[] = [];
  const timestamp = new Date().toISOString();

  for (const batch of candidateBatches) {
    if (remainingToDeduct <= 0) break;

    const availableInBatch = batch.onHandQuantity - batch.reservedQuantity;
    const take = Math.min(availableInBatch, remainingToDeduct);

    batch.onHandQuantity -= take;
    batch.updatedAt = timestamp;
    if (batch.onHandQuantity === 0) {
      batch.status = 'depleted';
    }

    remainingToDeduct -= take;
    allocatedBatchIds.push(batch.id);

    // Record immutable audit movement
    context.movements.push({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      batchId: batch.id,
      variantId,
      delta: -take,
      movementType: 'order_deduction',
      reason: `Order fulfillment for ${referenceId}`,
      actorEmail,
      referenceId,
      createdAt: timestamp,
    });
  }

  return {
    allocatedBatchIds,
    totalAllocated: quantityRequested,
  };
}

/**
 * Soft Delete an Order (Sets deleted_at without destroying record for compliance)
 */
export function softDeleteOrder(
  order: Order,
  actorEmail: string,
  reason?: string
): Order {
  const timestamp = new Date().toISOString();
  order.updatedAt = timestamp;
  (order as any).deleted_at = timestamp;

  logAuditEvent({
    actor: { id: 'admin', email: actorEmail, fullName: 'Admin', role: 'super_admin' },
    action: 'ORDER_STATUS_CHANGED',
    targetType: 'order',
    targetId: order.id,
    details: { action: 'soft_delete', reason },
  });

  logger.info(`[OrderService] Order ${order.id} soft-deleted by ${actorEmail}`);
  return order;
}

/**
 * Soft Delete a Subscription
 */
export function softDeleteSubscription(
  sub: Subscription,
  actorEmail: string,
  reason?: string
): Subscription {
  const timestamp = new Date().toISOString();
  sub.updatedAt = timestamp;
  sub.status = 'cancelled';
  (sub as any).deleted_at = timestamp;

  logAuditEvent({
    actor: { id: 'admin', email: actorEmail, fullName: 'Admin', role: 'super_admin' },
    action: 'SUBSCRIPTION_MODIFIED',
    targetType: 'subscription',
    targetId: sub.id,
    details: { action: 'soft_delete', reason },
  });

  logger.info(`[OrderService] Subscription ${sub.id} soft-deleted by ${actorEmail}`);
  return sub;
}
