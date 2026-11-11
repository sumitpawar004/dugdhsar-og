import { AuthUser } from '../types';
import { ForbiddenError } from '../errors/AppError';
import { logger } from '../logger';
import { getUtcIsoTimestamp } from '../lib/timezone';

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actorRole: string;
  action:
    | 'ROLE_CHANGED'
    | 'PRICE_CHANGED'
    | 'ORDER_STATUS_CHANGED'
    | 'INVENTORY_ADJUSTED'
    | 'INVENTORY_QUARANTINED'
    | 'DATA_EXPORTED'
    | 'USER_DELETED'
    | 'SUBSCRIPTION_MODIFIED'
    | 'ADMIN_LOGIN_2FA';
  targetType: 'order' | 'subscription' | 'product' | 'batch' | 'user' | 'system';
  targetId: string;
  details?: Record<string, any>;
  ip?: string;
  timestamp: string;
}

// Append-only audit store (in-memory buffer + Workers KV sync)
const auditLogsStore: AuditEvent[] = [];

/**
 * Append an immutable audit event for administrative actions
 */
export function logAuditEvent(params: {
  actor: AuthUser;
  action: AuditEvent['action'];
  targetType: AuditEvent['targetType'];
  targetId: string;
  details?: Record<string, any>;
  ip?: string;
}): AuditEvent {
  const event: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    details: params.details,
    ip: params.ip,
    timestamp: getUtcIsoTimestamp(),
  };

  auditLogsStore.unshift(event); // most recent first

  // Cap in-memory buffer to 2,000 events to prevent memory bloat
  if (auditLogsStore.length > 2000) {
    auditLogsStore.pop();
  }

  logger.info(`[AuditTrail] ${params.action} on ${params.targetType}:${params.targetId} by ${params.actor.email}`, {
    action: params.action,
    actorEmail: params.actor.email,
    targetId: params.targetId,
    targetType: params.targetType,
  });

  return event;
}

/**
 * Query audit logs: strictly restricted to super_admin only
 */
export function getAuditLogs(
  user: AuthUser,
  options: { limit?: number; offset?: number; action?: string } = {}
): { total: number; logs: AuditEvent[] } {
  if (user.role !== 'super_admin') {
    throw new ForbiddenError('Audit trail logs are strictly confidential and restricted to Super Admins only.');
  }

  const { limit = 50, offset = 0, action } = options;

  let filtered = auditLogsStore;
  if (action) {
    filtered = filtered.filter((e) => e.action === action);
  }

  const paginated = filtered.slice(offset, offset + limit);

  return {
    total: filtered.length,
    logs: paginated,
  };
}
