import { WorkerEnv } from '../types';
import { ConflictError, ForbiddenError, BadRequestError } from '../errors/AppError';

/**
 * DUGDHSAR Enterprise Staff Access Registry
 * Strictly enforces a MAXIMUM of 3 privileged accounts across:
 *   1. Admin Console (admin) - 1 slot max
 *   2. Manager Operations (manager) - 1 slot max
 *   3. Dealer B2B Supply (dealer) - 1 slot max
 *
 * Total privileged accounts across all 3 portals can NEVER exceed 3.
 * Any other Google email signing in through Admin, Manager, or Dealer portals is blocked (403).
 */

export type EnterprisePortalRole = 'admin' | 'manager' | 'dealer';

export interface StaffSlotEntry {
  role: EnterprisePortalRole;
  label: string;
  email: string;
  name: string;
  assignedAt: string;
  locked?: boolean;
}

export interface EnterpriseStaffRegistry {
  maxAccounts: 3;
  admin: StaffSlotEntry;
  manager: StaffSlotEntry | null;
  dealer: StaffSlotEntry | null;
}

export const MAX_ENTERPRISE_STAFF_ACCOUNTS = 3;
export const PRIMARY_OWNER_ADMIN_EMAIL = 'sumitpawar65005@gmail.com';
const STAFF_REGISTRY_KV_KEY = 'enterprise_staff_registry_v1';

// In-memory registry state (synced with Cloudflare KV when available)
let memoryRegistry: EnterpriseStaffRegistry | null = null;

function createDefaultRegistry(env?: WorkerEnv): EnterpriseStaffRegistry {
  const configuredAdmin = (env?.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)[0];

  const ownerEmail = configuredAdmin || PRIMARY_OWNER_ADMIN_EMAIL;

  // Only populate Manager/Dealer automatically if explicitly configured in runtime env vars
  // (Not default placeholder env strings unless explicitly provided in Worker env)
  const rawManager = env?.MANAGER_EMAILS
    ? String(env.MANAGER_EMAILS).split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)[0]
    : '';
  const rawDealer = env?.EXPLICIT_DEALER_EMAIL
    ? String(env.EXPLICIT_DEALER_EMAIL).trim().toLowerCase()
    : '';

  const now = new Date().toISOString();

  return {
    maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
    admin: {
      role: 'admin',
      label: 'Admin Console',
      email: ownerEmail,
      name: 'Primary Owner Admin',
      assignedAt: now,
      locked: true,
    },
    manager: rawManager && rawManager !== ownerEmail
      ? {
          role: 'manager',
          label: 'Manager Operations',
          email: rawManager,
          name: 'Operations Manager',
          assignedAt: now,
        }
      : null,
    dealer: rawDealer && rawDealer !== ownerEmail && rawDealer !== rawManager
      ? {
          role: 'dealer',
          label: 'Dealer B2B Supply',
          email: rawDealer,
          name: 'Authorized B2B Dealer',
          assignedAt: now,
        }
      : null,
  };
}

export function resetStaffRegistryForTests(env?: WorkerEnv): void {
  memoryRegistry = createDefaultRegistry(env);
}

export async function getStaffRegistry(env?: WorkerEnv): Promise<EnterpriseStaffRegistry> {
  if (!memoryRegistry) {
    if (env?.CACHE) {
      try {
        const stored = await env.CACHE.get(STAFF_REGISTRY_KV_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as EnterpriseStaffRegistry;
          if (parsed?.admin?.email) {
            memoryRegistry = {
              ...createDefaultRegistry(env),
              ...parsed,
              maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
            };
            return memoryRegistry;
          }
        }
      } catch {
        // Fallback to clean default registry
      }
    }
    memoryRegistry = createDefaultRegistry(env);
  }
  return memoryRegistry;
}

async function persistRegistry(registry: EnterpriseStaffRegistry, env?: WorkerEnv): Promise<void> {
  memoryRegistry = registry;
  if (env?.CACHE) {
    try {
      await env.CACHE.put(STAFF_REGISTRY_KV_KEY, JSON.stringify(registry));
    } catch {
      // Non-fatal in local/test mode without KV
    }
  }
}

export function countActiveStaffAccounts(registry: EnterpriseStaffRegistry): number {
  const uniqueEmails = new Set<string>();
  if (registry.admin?.email) uniqueEmails.add(registry.admin.email.toLowerCase().trim());
  if (registry.manager?.email) uniqueEmails.add(registry.manager.email.toLowerCase().trim());
  if (registry.dealer?.email) uniqueEmails.add(registry.dealer.email.toLowerCase().trim());
  return uniqueEmails.size;
}

export async function authorizeStaffPortalLogin(
  emailInput: string,
  portalContext: EnterprisePortalRole,
  env?: WorkerEnv
): Promise<{
  allowed: boolean;
  resolvedRole?: EnterprisePortalRole;
  reason?: string;
  activeCount: number;
  maxAccounts: number;
}> {
  const email = emailInput.toLowerCase().trim();
  const registry = await getStaffRegistry(env);
  const activeCount = countActiveStaffAccounts(registry);

  const adminEmail = registry.admin?.email?.toLowerCase().trim();
  const managerEmail = registry.manager?.email?.toLowerCase().trim();
  const dealerEmail = registry.dealer?.email?.toLowerCase().trim();

  // Super Admin Owner is allowed on Admin Console, Manager Operations & Dealer B2B Supply
  if (email && email === adminEmail) {
    return {
      allowed: true,
      resolvedRole: 'admin',
      activeCount,
      maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
    };
  }

  // Manager Operations account: allowed ONLY on Manager Operations portal
  if (email && managerEmail && email === managerEmail) {
    if (portalContext === 'manager') {
      return {
        allowed: true,
        resolvedRole: 'manager',
        activeCount,
        maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
      };
    }
    return {
      allowed: false,
      activeCount,
      maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
      reason: `Access Denied: This Manager Operations account cannot access ${portalContext.toUpperCase()} Console.`,
    };
  }

  // Dealer B2B Supply account: allowed ONLY on Dealer B2B Supply portal
  if (email && dealerEmail && email === dealerEmail) {
    if (portalContext === 'dealer') {
      return {
        allowed: true,
        resolvedRole: 'dealer',
        activeCount,
        maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
      };
    }
    return {
      allowed: false,
      activeCount,
      maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
      reason: `Access Denied: This Dealer B2B Supply account cannot access ${portalContext.toUpperCase()} Console.`,
    };
  }

  return {
    allowed: false,
    activeCount,
    maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
    reason:
      `Access Denied (${activeCount}/${MAX_ENTERPRISE_STAFF_ACCOUNTS} Enterprise Accounts Limit): ` +
      'Admin Console, Manager Operations, and Dealer B2B Supply allow a maximum of 3 authorized Google accounts only. ' +
      'This email is not authorized. Please sign in as a Customer or contact the Primary Admin.',
  };
}

export async function assignEnterpriseStaffSlot(
  params: {
    role: EnterprisePortalRole;
    email: string;
    name?: string;
    replaceExisting?: boolean;
  },
  env?: WorkerEnv
): Promise<{ registry: EnterpriseStaffRegistry; activeCount: number }> {
  const email = params.email.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError('A valid Google email address is required.');
  }

  const registry = await getStaffRegistry(env);

  if (params.role === 'admin') {
    throw new ForbiddenError(
      'Primary Admin Console slot is locked to 1 Owner account to prevent unauthorized admin additions.'
    );
  }

  const adminEmail = registry.admin.email.toLowerCase().trim();
  const managerEmail = registry.manager?.email?.toLowerCase().trim();
  const dealerEmail = registry.dealer?.email?.toLowerCase().trim();

  if (email === adminEmail) {
    throw new ConflictError('Owner Admin already has full access across Admin, Manager & Dealer portals.');
  }

  if (params.role === 'manager' && dealerEmail === email) {
    throw new ConflictError('This Google email is already assigned to the Dealer B2B Supply slot.');
  }
  if (params.role === 'dealer' && managerEmail === email) {
    throw new ConflictError('This Google email is already assigned to the Manager Operations slot.');
  }

  const currentSlot = params.role === 'manager' ? registry.manager : registry.dealer;
  const activeCountBefore = countActiveStaffAccounts(registry);

  // Hard 3-account guard
  if (!currentSlot && activeCountBefore >= MAX_ENTERPRISE_STAFF_ACCOUNTS) {
    throw new ForbiddenError(
      `Maximum ${MAX_ENTERPRISE_STAFF_ACCOUNTS} enterprise accounts reached across Admin, Manager & Dealer.`
    );
  }

  if (currentSlot && !params.replaceExisting && currentSlot.email.toLowerCase() !== email) {
    throw new ConflictError(
      `${params.role === 'manager' ? 'Manager Operations' : 'Dealer B2B Supply'} slot is already assigned to ${currentSlot.email}. Remove or replace it first (max 1 per portal, 3 total).`
    );
  }

  const defaultName =
    params.name?.trim() ||
    email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const entry: StaffSlotEntry = {
    role: params.role,
    label: params.role === 'manager' ? 'Manager Operations' : 'Dealer B2B Supply',
    email,
    name: defaultName,
    assignedAt: new Date().toISOString(),
  };

  const nextRegistry: EnterpriseStaffRegistry = {
    ...registry,
    [params.role]: entry,
    maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
  };

  const activeAfter = countActiveStaffAccounts(nextRegistry);
  if (activeAfter > MAX_ENTERPRISE_STAFF_ACCOUNTS) {
    throw new ForbiddenError(`Hard limit violation: Total enterprise accounts cannot exceed ${MAX_ENTERPRISE_STAFF_ACCOUNTS}.`);
  }

  await persistRegistry(nextRegistry, env);
  return { registry: nextRegistry, activeCount: activeAfter };
}

export async function removeEnterpriseStaffSlot(
  role: EnterprisePortalRole,
  env?: WorkerEnv
): Promise<{ registry: EnterpriseStaffRegistry; activeCount: number }> {
  if (role === 'admin') {
    throw new ForbiddenError('Cannot remove Primary Owner Admin account.');
  }
  const registry = await getStaffRegistry(env);
  const nextRegistry: EnterpriseStaffRegistry = {
    ...registry,
    [role]: null,
    maxAccounts: MAX_ENTERPRISE_STAFF_ACCOUNTS,
  };
  await persistRegistry(nextRegistry, env);
  return {
    registry: nextRegistry,
    activeCount: countActiveStaffAccounts(nextRegistry),
  };
}
