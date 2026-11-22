import { AuthUser, D1Database, D1PreparedStatement, UserRole, WorkerEnv } from '../types';
import { BadRequestError, ConflictError, ForbiddenError } from '../errors/AppError';
import { generateId, sha256Hex, utcNowIso } from './client';
import { UserRow } from './types';
import { buildAuditLogStatement } from './auditRepo';
import { EnterprisePortalRole, EnterpriseStaffRegistry, MAX_ENTERPRISE_STAFF_ACCOUNTS } from '../services/staffAccessRegistry';

const USER_AUTH_COLUMNS = `id, google_sub, email, email_hash, name, phone, avatar_url, role, status, created_at, updated_at, deleted_at`;

function parseEmailSecretList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Super Admin is determined ONLY by SUPER_ADMIN_EMAILS Worker secret.
 * In non-production dev/tests without SUPER_ADMIN_EMAILS set, falls back to primary owner email.
 */
export function getSuperAdminEmails(env?: WorkerEnv): string[] {
  const procEnv = typeof process !== 'undefined' && process?.env ? process.env : {};
  const raw = env?.SUPER_ADMIN_EMAILS ?? procEnv.SUPER_ADMIN_EMAILS ?? '';
  const list = parseEmailSecretList(raw);
  if (list.length > 0) return list;

  const isProd = (env?.ENVIRONMENT || procEnv.ENVIRONMENT || procEnv.NODE_ENV) === 'production';
  return isProd ? [] : ['sumitpawar65005@gmail.com'];
}

/**
 * DEALER_EMAILS secret only bootstraps a dealer account on FIRST login if not already in D1.
 */
export function getBootstrapDealerEmails(env?: WorkerEnv): string[] {
  const procEnv = typeof process !== 'undefined' && process?.env ? process.env : {};
  const raw = env?.DEALER_EMAILS ?? procEnv.DEALER_EMAILS ?? '';
  return parseEmailSecretList(raw);
}

/**
 * Load dealer ID and normalized pincodes for a dealer user.
 */
async function loadDealerContext(
  db: D1Database,
  userId: string
): Promise<{ dealerId?: string; assignedPincodes?: string[] }> {
  const dealer = await db
    .prepare(`SELECT id FROM dealers WHERE user_id = ? AND status = 'active' LIMIT 1`)
    .bind(userId)
    .first<{ id: string }>();

  if (!dealer) return {};

  const pincodesRes = await db
    .prepare(`SELECT pincode FROM dealer_pincodes WHERE dealer_id = ? ORDER BY pincode ASC`)
    .bind(dealer.id)
    .all<{ pincode: string }>();

  return {
    dealerId: dealer.id,
    assignedPincodes: (pincodesRes.results || []).map((r) => r.pincode),
  };
}

/**
 * Upsert Google-authenticated user in Cloudflare D1 using bound prepared statements.
 *
 * Role Authority Rules:
 *   1. super_admin: determined ONLY by SUPER_ADMIN_EMAILS Worker secret.
 *   2. manager / dealer: managed in D1 by super_admin.
 *   3. DEALER_EMAILS secret ONLY bootstraps a dealer on first login (new user).
 *   4. Otherwise: 'customer'.
 *
 * Account Deletion Reactivation Rule:
 *   If a deleted/anonymized account logs in again with the same Google sub OR same email
 *   (matched via email_hash), reactivates the OLD users.id row instead of creating a new one.
 */
export async function upsertGoogleUser(
  db: D1Database,
  env: WorkerEnv | undefined,
  params: {
    googleSub: string | null;
    email: string;
    name: string;
    avatarUrl?: string | null;
  }
): Promise<{ user: AuthUser; reactivated: boolean; created: boolean; updated: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = (params.name || cleanEmail.split('@')[0] || 'Patron').trim().slice(0, 120);
  const emailHash = await sha256Hex(cleanEmail);
  const now = utcNowIso();

  const superAdmins = getSuperAdminEmails(env);
  const bootstrapDealers = getBootstrapDealerEmails(env);
  const isSecretSuperAdmin = superAdmins.includes(cleanEmail);
  const isBootstrapDealer = bootstrapDealers.includes(cleanEmail);

  // Lookup existing user by google_sub OR email_hash OR email
  let existing: UserRow | null = null;
  if (params.googleSub) {
    existing = await db
      .prepare(
        `SELECT ${USER_AUTH_COLUMNS} FROM users
         WHERE google_sub = ? OR email_hash = ? OR email = ?
         LIMIT 1`
      )
      .bind(params.googleSub, emailHash, cleanEmail)
      .first<UserRow>();
  } else {
    existing = await db
      .prepare(
        `SELECT ${USER_AUTH_COLUMNS} FROM users
         WHERE email_hash = ? OR email = ?
         LIMIT 1`
      )
      .bind(emailHash, cleanEmail)
      .first<UserRow>();
  }

  let userId: string;
  let finalRole: UserRole;
  let reactivated = false;
  let created = false;
  let updated = false;

  if (existing) {
    if (existing.status === 'suspended') {
      throw new ForbiddenError('This account has been suspended. Please contact DUGDHSAR support.');
    }

    userId = existing.id;
    reactivated = existing.status === 'deleted' || Boolean(existing.deleted_at);

    let existingDealerRow: { id: string } | null = null;
    if (!isSecretSuperAdmin && (existing.role === 'dealer' || isBootstrapDealer)) {
      existingDealerRow = await db
        .prepare(`SELECT id FROM dealers WHERE user_id = ? LIMIT 1`)
        .bind(userId)
        .first<{ id: string }>();
    }

    // Role resolution for existing user:
    // 1. super_admin comes strictly from SUPER_ADMIN_EMAILS (never from D1 data).
    // 2. Existing manager / dealer roles managed in D1 are preserved.
    // 3. DEALER_EMAILS bootstraps dealer ONLY if no dealer row exists yet.
    // 4. Otherwise customer (demotes stale super_admin rows if removed from secret).
    if (isSecretSuperAdmin) {
      finalRole = 'super_admin';
    } else if (existing.role === 'manager' || existing.role === 'dealer') {
      finalRole = existing.role;
    } else if (isBootstrapDealer && !existingDealerRow) {
      finalRole = 'dealer';
    } else {
      finalRole = 'customer';
    }

    const nextGoogleSub = params.googleSub ?? existing.google_sub;
    const nextAvatarUrl = params.avatarUrl !== undefined && params.avatarUrl !== null
      ? params.avatarUrl
      : existing.avatar_url;

    const needsUserUpdate =
      reactivated ||
      existing.google_sub !== nextGoogleSub ||
      existing.email !== cleanEmail ||
      existing.email_hash !== emailHash ||
      existing.name !== cleanName ||
      existing.avatar_url !== nextAvatarUrl ||
      existing.role !== finalRole ||
      existing.status !== 'active' ||
      existing.deleted_at !== null;

    const statements: D1PreparedStatement[] = [];

    if (needsUserUpdate) {
      statements.push(
        db
          .prepare(
            `UPDATE users
             SET google_sub = ?,
                 email = ?,
                 email_hash = ?,
                 name = ?,
                 avatar_url = ?,
                 role = ?,
                 status = 'active',
                 deleted_at = NULL,
                 updated_at = ?
             WHERE id = ?`
          )
          .bind(
            nextGoogleSub,
            cleanEmail,
            emailHash,
            cleanName,
            nextAvatarUrl,
            finalRole,
            now,
            userId
          )
      );
    }

    if (finalRole === 'dealer' && !existingDealerRow) {
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO dealers (id, user_id, business_name, status, created_at, updated_at)
             VALUES (?, ?, ?, 'active', ?, ?)`
          )
          .bind(generateId(), userId, cleanName, now, now)
      );
    }

    if (statements.length > 0) {
      await db.batch(statements);
      updated = true;
    }
  } else {
    created = true;
    updated = true;
    userId = generateId();
    if (isSecretSuperAdmin) {
      finalRole = 'super_admin';
    } else if (isBootstrapDealer) {
      finalRole = 'dealer';
    } else {
      finalRole = 'customer';
    }

    const statements: D1PreparedStatement[] = [
      db
        .prepare(
          `INSERT INTO users (
            id, google_sub, email, email_hash, name, phone, avatar_url, role, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 'active', ?, ?)`
        )
        .bind(
          userId,
          params.googleSub,
          cleanEmail,
          emailHash,
          cleanName,
          params.avatarUrl ?? null,
          finalRole,
          now,
          now
        ),
    ];

    if (finalRole === 'dealer') {
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO dealers (id, user_id, business_name, status, created_at, updated_at)
             VALUES (?, ?, ?, 'active', ?, ?)`
          )
          .bind(generateId(), userId, cleanName, now, now)
      );
    }

    await db.batch(statements);
  }

  const dealerCtx = finalRole === 'dealer' ? await loadDealerContext(db, userId) : {};

  return {
    user: {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      role: finalRole,
      avatarUrl: params.avatarUrl || existing?.avatar_url || undefined,
      dealerId: dealerCtx.dealerId,
      assignedPincodes: dealerCtx.assignedPincodes,
    },
    reactivated,
    created,
    updated,
  };
}

/**
 * Fetch fresh AuthUser from D1 (used by /api/auth/refresh and /api/auth/me).
 * Returns null if user is deleted or suspended.
 */
export async function getAuthUserById(
  db: D1Database,
  userId: string,
  env?: WorkerEnv
): Promise<AuthUser | null> {
  const row = await db
    .prepare(
      `SELECT ${USER_AUTH_COLUMNS} FROM users
       WHERE id = ? AND status = 'active' AND deleted_at IS NULL
       LIMIT 1`
    )
    .bind(userId)
    .first<UserRow>();

  if (!row) return null;

  const isSecretSuperAdmin = getSuperAdminEmails(env).includes(row.email.toLowerCase());
  const effectiveRole: UserRole = isSecretSuperAdmin
    ? 'super_admin'
    : row.role === 'super_admin'
      ? 'customer'
      : row.role;

  const dealerCtx = effectiveRole === 'dealer' ? await loadDealerContext(db, row.id) : {};

  return {
    id: row.id,
    email: row.email,
    fullName: row.name,
    role: effectiveRole,
    avatarUrl: row.avatar_url || undefined,
    dealerId: dealerCtx.dealerId,
    assignedPincodes: dealerCtx.assignedPincodes,
  };
}

/**
 * Persist a revoked JWT JTI into Cloudflare D1 revoked_sessions.
 */
export async function revokeSessionInDb(
  db: D1Database,
  params: { jti: string; userId: string; reason?: string; expiresAtMs: number }
): Promise<void> {
  const now = utcNowIso();
  const expiresAtIso = utcNowIso(new Date(params.expiresAtMs));
  await db
    .prepare(
      `INSERT OR IGNORE INTO revoked_sessions (jti, user_id, reason, revoked_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(params.jti, params.userId, params.reason ?? 'logout', now, expiresAtIso)
    .run();
}

/**
 * Fast primary-key lookup in D1 revoked_sessions.
 */
export async function isSessionRevokedInDb(db: D1Database, jti: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 AS revoked FROM revoked_sessions WHERE jti = ? LIMIT 1`)
    .bind(jti)
    .first<{ revoked: number }>();
  return Boolean(row);
}

/**
 * Account Deletion / Erasure (DPDP Act compliant):
 * - Anonymizes PII on users (name, phone, email, avatar_url) and addresses
 * - Keeps email_hash + google_sub so re-signup with the same email reactivates the old user row
 * - Cancels active/paused subscriptions
 * - Keeps orders & payments intact for accounting/legal integrity
 * - Writes one audit_logs entry atomically via db.batch()
 */
export async function anonymizeUserAccount(
  db: D1Database,
  params: {
    userId: string;
    actorEmail: string;
    actorRole: UserRole;
    ipAddress?: string | null;
    jti?: string;
  }
): Promise<{ anonymizedAt: string }> {
  const now = utcNowIso();
  const redactedEmail = `deleted_${params.userId.toLowerCase()}@redacted.invalid`;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE users
         SET name = 'Deleted User',
             phone = NULL,
             avatar_url = NULL,
             email = ?,
             status = 'deleted',
             deleted_at = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .bind(redactedEmail, now, now, params.userId),

    db
      .prepare(
        `UPDATE addresses
         SET recipient_name = 'Deleted User',
             phone = NULL,
             line1 = 'Redacted',
             line2 = NULL,
             landmark = NULL,
             lat = NULL,
             lng = NULL,
             is_default = 0,
             deleted_at = COALESCE(deleted_at, ?),
             updated_at = ?
         WHERE user_id = ?`
      )
      .bind(now, now, params.userId),

    db
      .prepare(
        `UPDATE subscriptions
         SET status = 'cancelled',
             deleted_at = COALESCE(deleted_at, ?),
             updated_at = ?
         WHERE user_id = ? AND status IN ('active', 'paused')`
      )
      .bind(now, now, params.userId),

    buildAuditLogStatement(db, {
      actorUserId: params.userId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'USER_ACCOUNT_ERASED',
      targetType: 'user',
      targetId: params.userId,
      details: { anonymizedAt: now, preservedOrdersAndPayments: true },
      ipAddress: params.ipAddress,
    }),
  ];

  if (params.jti) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO revoked_sessions (jti, user_id, reason, revoked_at, expires_at)
           VALUES (?, ?, 'account_deleted', ?, ?)`
        )
        .bind(params.jti, params.userId, now, utcNowIso(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)))
    );
  }

  await db.batch(statements);
  return { anonymizedAt: now };
}

/**
 * Read the D1-backed staff slots view (1 super_admin from secret + up to 1 manager + 1 dealer in D1).
 * Replaces KV enterprise_staff_registry_v1 cleanly when D1 is bound.
 */
export async function getD1StaffRegistry(
  db: D1Database,
  env?: WorkerEnv
): Promise<{ registry: EnterpriseStaffRegistry; activeCount: number }> {
  const superAdmins = getSuperAdminEmails(env);
  const ownerEmail = superAdmins[0] || 'sumitpawar65005@gmail.com';

  const staffRes = await db
    .prepare(
      `SELECT id, email, name, role, updated_at
       FROM users
       WHERE role IN ('manager', 'dealer') AND status = 'active' AND deleted_at IS NULL
       ORDER BY created_at ASC`
    )
    .all<{ id: string; email: string; name: string; role: 'manager' | 'dealer'; updated_at: string }>();

  const rows = staffRes.results || [];
  const managerRow = rows.find((r) => r.role === 'manager') || null;
  const dealerRow = rows.find((r) => r.role === 'dealer') || null;

  const registry: EnterpriseStaffRegistry = {
    maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
    admin: {
      role: 'admin',
      label: 'Admin Console',
      email: ownerEmail,
      name: 'Primary Owner Admin',
      assignedAt: utcNowIso(),
      locked: true,
    },
    manager: managerRow
      ? {
          role: 'manager',
          label: 'Manager Operations',
          email: managerRow.email,
          name: managerRow.name,
          assignedAt: managerRow.updated_at,
        }
      : null,
    dealer: dealerRow
      ? {
          role: 'dealer',
          label: 'Dealer B2B Supply',
          email: dealerRow.email,
          name: dealerRow.name,
          assignedAt: dealerRow.updated_at,
        }
      : null,
  };

  const uniqueEmails = new Set<string>([ownerEmail]);
  if (managerRow) uniqueEmails.add(managerRow.email.toLowerCase());
  if (dealerRow) uniqueEmails.add(dealerRow.email.toLowerCase());

  return { registry, activeCount: uniqueEmails.size };
}

/**
 * Super Admin assigns or replaces the Manager or Dealer account directly in D1.
 * Enforces max-3 privileged account cap (1 super_admin + 1 manager + 1 dealer).
 */
export async function assignD1StaffSlot(
  db: D1Database,
  actor: AuthUser,
  env: WorkerEnv | undefined,
  params: {
    role: EnterprisePortalRole;
    email: string;
    name?: string;
    replaceExisting?: boolean;
    pincodes?: string[];
  },
  ipAddress?: string | null
): Promise<{ registry: EnterpriseStaffRegistry; activeCount: number }> {
  if (actor.role !== 'super_admin') {
    throw new ForbiddenError('Only Super Admin can manage Manager or Dealer accounts.');
  }
  if (params.role === 'admin') {
    throw new ForbiddenError('Super Admin is managed strictly via SUPER_ADMIN_EMAILS Worker secret.');
  }

  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new BadRequestError('A valid Google email address is required.');
  }

  const superAdmins = getSuperAdminEmails(env);
  if (superAdmins.includes(cleanEmail)) {
    throw new ConflictError('Owner Super Admin already has full access across Admin, Manager & Dealer portals.');
  }

  const targetRole: 'manager' | 'dealer' = params.role;
  const otherRole: 'manager' | 'dealer' = targetRole === 'manager' ? 'dealer' : 'manager';
  const now = utcNowIso();
  const emailHash = await sha256Hex(cleanEmail);

  const currentSlotsRes = await db
    .prepare(
      `SELECT id, email, role FROM users
       WHERE role IN ('manager', 'dealer') AND status = 'active' AND deleted_at IS NULL`
    )
    .all<{ id: string; email: string; role: 'manager' | 'dealer' }>();

  const currentSlots = currentSlotsRes.results || [];
  const existingSameRole = currentSlots.find((r) => r.role === targetRole);
  const existingOtherRole = currentSlots.find((r) => r.role === otherRole);

  if (existingOtherRole && existingOtherRole.email.toLowerCase() === cleanEmail) {
    throw new ConflictError(`This email is already assigned to the ${otherRole} role.`);
  }

  if (existingSameRole && existingSameRole.email.toLowerCase() !== cleanEmail && !params.replaceExisting) {
    throw new ConflictError(
      `The ${targetRole} slot is already assigned to ${existingSameRole.email}. Remove or enable replaceExisting first.`
    );
  }

  const existingUser = await db
    .prepare(`SELECT id, name FROM users WHERE email_hash = ? OR email = ? LIMIT 1`)
    .bind(emailHash, cleanEmail)
    .first<{ id: string; name: string }>();

  const displayName =
    params.name?.trim() ||
    existingUser?.name ||
    cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const userId = existingUser?.id || generateId();
  const statements: D1PreparedStatement[] = [];

  // Demote previous occupant of this slot if replacing
  if (existingSameRole && existingSameRole.email.toLowerCase() !== cleanEmail) {
    statements.push(
      db
        .prepare(`UPDATE users SET role = 'customer', updated_at = ? WHERE id = ?`)
        .bind(now, existingSameRole.id)
    );
    if (targetRole === 'dealer') {
      statements.push(
        db
          .prepare(`UPDATE dealers SET status = 'inactive', updated_at = ? WHERE user_id = ?`)
          .bind(now, existingSameRole.id)
      );
    }
  }

  // Upsert target user with new role
  if (existingUser) {
    statements.push(
      db
        .prepare(
          `UPDATE users
           SET email = ?, email_hash = ?, name = ?, role = ?, status = 'active', deleted_at = NULL, updated_at = ?
           WHERE id = ?`
        )
        .bind(cleanEmail, emailHash, displayName, targetRole, now, userId)
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO users (id, google_sub, email, email_hash, name, phone, avatar_url, role, status, created_at, updated_at)
           VALUES (?, NULL, ?, ?, ?, NULL, NULL, ?, 'active', ?, ?)`
        )
        .bind(userId, cleanEmail, emailHash, displayName, targetRole, now, now)
    );
  }

  // Ensure dealers table row & optional dealer_pincodes when assigning dealer
  if (targetRole === 'dealer') {
    const existingDealer = await db
      .prepare(`SELECT id FROM dealers WHERE user_id = ? LIMIT 1`)
      .bind(userId)
      .first<{ id: string }>();

    const dealerId = existingDealer?.id || generateId();
    if (existingDealer) {
      statements.push(
        db
          .prepare(`UPDATE dealers SET status = 'active', updated_at = ? WHERE id = ?`)
          .bind(now, dealerId)
      );
    } else {
      statements.push(
        db
          .prepare(
            `INSERT INTO dealers (id, user_id, business_name, status, created_at, updated_at)
             VALUES (?, ?, ?, 'active', ?, ?)`
          )
          .bind(dealerId, userId, `${displayName} B2B Supply`, now, now)
      );
    }

    if (params.pincodes && params.pincodes.length > 0) {
      for (const pin of params.pincodes) {
        if (/^\d{6}$/.test(pin)) {
          statements.push(
            db
              .prepare(`INSERT OR IGNORE INTO dealer_pincodes (dealer_id, pincode, created_at) VALUES (?, ?, ?)`)
              .bind(dealerId, pin, now)
          );
        }
      }
    }
  }

  statements.push(
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STAFF_SLOT_UPDATED',
      targetType: 'user',
      targetId: userId,
      details: { role: targetRole, assignedEmail: cleanEmail },
      ipAddress,
    })
  );

  await db.batch(statements);
  return getD1StaffRegistry(db, env);
}

/**
 * Super Admin revokes the Manager or Dealer slot in D1 (demotes to customer).
 */
export async function revokeD1StaffSlot(
  db: D1Database,
  actor: AuthUser,
  env: WorkerEnv | undefined,
  role: EnterprisePortalRole,
  ipAddress?: string | null
): Promise<{ registry: EnterpriseStaffRegistry; activeCount: number }> {
  if (actor.role !== 'super_admin') {
    throw new ForbiddenError('Only Super Admin can revoke staff slots.');
  }
  if (role === 'admin') {
    throw new ForbiddenError('Cannot revoke Super Admin via API; update SUPER_ADMIN_EMAILS secret.');
  }

  const now = utcNowIso();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(`UPDATE users SET role = 'customer', updated_at = ? WHERE role = ?`)
      .bind(now, role),
  ];

  if (role === 'dealer') {
    statements.push(
      db.prepare(`UPDATE dealers SET status = 'inactive', updated_at = ? WHERE status = 'active'`).bind(now)
    );
  }

  statements.push(
    buildAuditLogStatement(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STAFF_SLOT_REVOKED',
      targetType: 'staff_slot',
      targetId: role,
      details: { revokedRole: role },
      ipAddress,
    })
  );

  await db.batch(statements);
  return getD1StaffRegistry(db, env);
}
