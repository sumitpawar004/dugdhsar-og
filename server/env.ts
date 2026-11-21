import { z } from 'zod';

/**
 * DUGDHSAR Centralized Environment & Secret Schema
 * Validates runtime secrets and configuration with fail-fast semantics.
 */
export const EnvSchema = z.object({
  // Runtime Environment
  ENVIRONMENT: z.enum(['production', 'staging', 'development', 'test']).default('development'),
  NODE_ENV: z.string().optional(),
  APP_URL: z.string().optional(),

  // Application Secrets
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default(
    'dugdhsar_vedic_dairy_session_jwt_secret_dev_only_2026'
  ),

  // Google OAuth & Service Account
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().url().optional(),

  // Meta / Instagram Graph API
  IG_ACCESS_TOKEN: z.string().optional(),
  IG_USER_ID: z.string().optional(),
  IG_APP_ID: z.string().optional(),
  IG_APP_SECRET: z.string().optional(),
  IG_VERIFY_TOKEN: z.string().default('dugdhsar_ig_verify_token'),

  // Role Mappings
  SUPER_ADMIN_EMAILS: z.string().default('sumitpawar65005@gmail.com,admin@dugdhsar.in'),
  DEALER_EMAILS: z.string().default('dealer@dugdhsar.in,manager@dugdhsar.in'),

  // Optional Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Outbound Network Controls
  OUTBOUND_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(3),
  CIRCUIT_BREAKER_RESET_MS: z.coerce.number().int().positive().default(30000),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

let cachedEnv: ValidatedEnv | null = null;

/**
 * Validates raw environment bindings (Cloudflare env or process.env).
 * Fails fast with descriptive diagnostics if production requirements are breached.
 */
export function validateEnv(rawEnv?: Record<string, any>): ValidatedEnv {
  const merged: Record<string, any> = {
    ...(typeof process !== 'undefined' && process?.env ? process.env : {}),
    ...(rawEnv || {}),
  };

  const parsed = EnvSchema.safeParse(merged);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    const errorMsg = `[DUGDHSAR Config Error] Missing or invalid environment variables:\n${errorDetails}\n\n` +
      `Fix: For local development, add these to .dev.vars.\n` +
      `For Cloudflare Workers production, set via: wrangler secret put <KEY_NAME>\n`;

    console.error(errorMsg);

    // Fail fast in production or staging
    if (merged.ENVIRONMENT === 'production' || merged.ENVIRONMENT === 'staging') {
      throw new Error(errorMsg);
    }

    // In local development, fall back to safe stubs rather than crashing the dev server
    return EnvSchema.parse({
      ...merged,
      JWT_SECRET: merged.JWT_SECRET || 'dugdhsar_vedic_dairy_session_jwt_secret_dev_only_2026',
    });
  }

  // Extra production security check: Do not allow dev secret in production
  if (
    parsed.data.ENVIRONMENT === 'production' &&
    parsed.data.JWT_SECRET.includes('dev_only')
  ) {
    const errorMsg = '[DUGDHSAR Security Alert] Production deployment cannot use the default dev JWT_SECRET! Set a secure secret via: wrangler secret put JWT_SECRET';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  cachedEnv = parsed.data;
  return parsed.data;
}

export const REQUIRED_PRODUCTION_ENV_KEYS = [
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'IG_ACCESS_TOKEN',
] as const;

let hasLoggedMissingEnv = false;

/**
 * Returns ONLY the names of missing required secrets/vars (never returns values).
 */
export function getMissingRequiredEnvKeys(rawEnv?: Record<string, any>): string[] {
  const procEnv = typeof process !== 'undefined' && process?.env ? process.env : {};
  const missing: string[] = [];

  for (const key of REQUIRED_PRODUCTION_ENV_KEYS) {
    const val = rawEnv?.[key] ?? procEnv[key];
    const strVal = typeof val === 'string' ? val.trim() : '';
    if (!strVal || (key === 'JWT_SECRET' && strVal.includes('dev_only'))) {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Runs once inside the first request handler (when Cloudflare Worker secrets are bound)
 * and logs ONLY the names of missing required env vars.
 */
export function logMissingEnvOnce(rawEnv?: Record<string, any>): string[] {
  const missing = getMissingRequiredEnvKeys(rawEnv);
  if (!hasLoggedMissingEnv) {
    hasLoggedMissingEnv = true;
    if (missing.length > 0) {
      console.warn(`missing env: ${missing.join(', ')}`);
    } else {
      console.log('startup env check: all required env bindings present');
    }
  }
  return missing;
}

export function getCachedEnv(): ValidatedEnv {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}
