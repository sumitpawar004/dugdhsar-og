import { D1Database, D1PreparedStatement, UserRole } from '../types';
import { generateId, utcNowIso } from './client';

export interface AuditWriteInput {
  actorUserId?: string | null;
  actorEmail: string;
  actorRole: UserRole | 'system';
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Build a prepared statement for an important audit log entry (for use inside db.batch).
 * Only log high-value admin, role, financial, or security events — never per-request telemetry.
 */
export function buildAuditLogStatement(db: D1Database, input: AuditWriteInput): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_logs (
        id, actor_user_id, actor_email, actor_role, action, target_type, target_id, details_json, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      generateId(),
      input.actorUserId ?? null,
      input.actorEmail.toLowerCase().trim(),
      input.actorRole,
      input.action,
      input.targetType,
      input.targetId,
      input.details ? JSON.stringify(input.details) : null,
      input.ipAddress ?? null,
      utcNowIso()
    );
}

/**
 * Write a single important audit log entry directly to D1.
 */
export async function writeAuditLog(db: D1Database, input: AuditWriteInput): Promise<void> {
  await buildAuditLogStatement(db, input).run();
}
