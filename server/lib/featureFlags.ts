import { WorkerEnv, AuthUser } from '../types';
import { logger } from '../logger';

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  /** Percentage of users (0 to 100) who should receive this feature */
  rolloutPercentage?: number;
  /** Restrict feature to specific user roles */
  allowedRoles?: string[];
  /** Specific user emails allowlisted for beta testing */
  allowlistEmails?: string[];
}

/**
 * Built-in default feature flags for Dugdhsar Cold-Chain Dairy
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  instant_upi_checkout: {
    key: 'instant_upi_checkout',
    description: 'Direct UPI QR code and payment intent generation at checkout',
    enabled: true,
  },
  evening_delivery_slot: {
    key: 'evening_delivery_slot',
    description: 'Evening 5:30 PM - 7:00 PM cold-chain delivery slot in Seoni',
    enabled: true,
  },
  whatsapp_order_notifications: {
    key: 'whatsapp_order_notifications',
    description: 'Automated WhatsApp dispatch and delivery confirmation updates',
    enabled: true,
  },
  vedic_purity_certificates_download: {
    key: 'vedic_purity_certificates_download',
    description: 'Patron lab report and batch A2 beta-casein purity PDF download',
    enabled: true,
  },
  experimental_scheduled_subscriptions: {
    key: 'experimental_scheduled_subscriptions',
    description: 'Custom subscription schedules (e.g. alternate Wednesdays only)',
    enabled: true,
    allowedRoles: ['super_admin', 'dealer'],
  },
};

// Local isolate memory store
const memoryFlags = new Map<string, FeatureFlag>(
  Object.entries(DEFAULT_FEATURE_FLAGS)
);

/**
 * Deterministic hash (0-99) of user identifier for stable percentage rollouts
 */
function hashIdentifier(identifier: string): number {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

/**
 * Evaluate if a feature flag is enabled for a given context
 */
export async function isFeatureEnabled(
  flagKey: string,
  env?: WorkerEnv,
  context?: { user?: AuthUser; identifier?: string }
): Promise<boolean> {
  let flag: FeatureFlag | undefined = memoryFlags.get(flagKey);

  // Check Workers KV for dynamic runtime overrides
  if (env?.CACHE) {
    try {
      const kvFlagRaw = await env.CACHE.get(`flag:${flagKey}`);
      if (kvFlagRaw) {
        flag = JSON.parse(kvFlagRaw);
      }
    } catch (err: any) {
      logger.warn(`[FeatureFlags] KV lookup failed for ${flagKey}`, { error: err.message });
    }
  }

  // Fallback to default if not registered
  if (!flag) {
    flag = DEFAULT_FEATURE_FLAGS[flagKey];
  }

  if (!flag) {
    return false;
  }

  // Master switch
  if (!flag.enabled) {
    return false;
  }

  // Explicit email allowlist for beta features (takes precedence over role)
  if (flag.allowlistEmails && flag.allowlistEmails.length > 0) {
    const userEmail = context?.user?.email?.toLowerCase();
    if (userEmail && flag.allowlistEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      return true;
    }
    // If specific email allowlist is defined and user is not on it, deny
    return false;
  }

  // Role-based gate
  if (flag.allowedRoles && flag.allowedRoles.length > 0) {
    const role = context?.user?.role;
    if (!role || !flag.allowedRoles.includes(role)) {
      return false;
    }
  }

  // Percentage-based rollout
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const id = context?.identifier || context?.user?.id || context?.user?.email || 'anonymous';
    const bucket = hashIdentifier(id);
    return bucket < flag.rolloutPercentage;
  }

  return true;
}

/**
 * List all active feature flags (for client configuration)
 */
export async function getAllFeatureFlags(
  env?: WorkerEnv,
  context?: { user?: AuthUser; identifier?: string }
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(DEFAULT_FEATURE_FLAGS)) {
    result[key] = await isFeatureEnabled(key, env, context);
  }
  return result;
}

/**
 * Update a feature flag dynamically at the edge (super_admin restricted)
 */
export async function setFeatureFlag(
  flag: FeatureFlag,
  env?: WorkerEnv
): Promise<void> {
  memoryFlags.set(flag.key, flag);
  if (env?.CACHE) {
    try {
      await env.CACHE.put(`flag:${flag.key}`, JSON.stringify(flag));
      logger.info(`[FeatureFlags] Flag ${flag.key} updated dynamically in KV`);
    } catch (err: any) {
      logger.warn(`[FeatureFlags] Failed to write flag to KV: ${flag.key}`, { error: err.message });
    }
  }
}
