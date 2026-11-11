import { Request, Response, NextFunction } from 'express';
import { RateLimitError, ForbiddenError } from '../errors/AppError';
import { fetchWithCircuitBreaker } from '../lib/fetchWithCircuitBreaker';
import { logger } from '../logger';

interface RateLimitRecord {
  count: number;
  resetTimeMs: number;
}

// In-isolate sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Account lockout store: tracks consecutive failed auth attempts
interface LockoutRecord {
  failedAttempts: number;
  lockedUntilMs?: number;
}
const lockoutStore = new Map<string, LockoutRecord>();

export function getClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string') return cfIp;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Express Middleware: Sliding-window rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  prefix: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    maxRequests,
    prefix,
    message = 'Too many requests. Please slow down and try again later.',
    keyGenerator = (req) => `${prefix}:${(req as any).user?.id || getClientIp(req)}`,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now >= record.resetTimeMs) {
      record = {
        count: 1,
        resetTimeMs: now + windowMs,
      };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTimeMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      logger.warn(`[RateLimit] Exceeded ${prefix} threshold for key ${key}`, {
        key,
        retryAfterSeconds,
        count: record.count,
        maxRequests,
      });

      return next(new RateLimitError(message, retryAfterSeconds));
    }

    next();
  };
}

// Pre-configured Rate Limiters
export const authRateLimiter = createRateLimiter({
  prefix: 'auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 mins
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

export const orderRateLimiter = createRateLimiter({
  prefix: 'orders',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 30, // 30 orders/hour
  message: 'Order creation limit reached. Please wait before placing further orders.',
});

export const contactRateLimiter = createRateLimiter({
  prefix: 'contact',
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5,
  message: 'Too many contact messages submitted. Please wait 10 minutes.',
});

/**
 * Account Lockout Helpers:
 * Automatically lock account for 15 minutes after 5 consecutive failed authentication attempts
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function recordFailedAuthAttempt(identifier: string): { isLocked: boolean; attempts: number; lockRemainingSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  let record = lockoutStore.get(key);

  if (!record) {
    record = { failedAttempts: 1 };
  } else {
    // If previous lockout expired, reset
    if (record.lockedUntilMs && now >= record.lockedUntilMs) {
      record.failedAttempts = 1;
      record.lockedUntilMs = undefined;
    } else {
      record.failedAttempts++;
    }
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntilMs = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(key, record);
    const lockRemainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    logger.warn(`[AccountLockout] Account ${key} locked for ${lockRemainingSeconds} seconds after ${record.failedAttempts} failed attempts`);
    return { isLocked: true, attempts: record.failedAttempts, lockRemainingSeconds };
  }

  lockoutStore.set(key, record);
  return { isLocked: false, attempts: record.failedAttempts };
}

export function checkAccountLockout(identifier: string): { isLocked: boolean; lockRemainingSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const record = lockoutStore.get(key);
  if (!record || !record.lockedUntilMs) return { isLocked: false };

  const now = Date.now();
  if (now >= record.lockedUntilMs) {
    // Lock expired
    lockoutStore.delete(key);
    return { isLocked: false };
  }

  const lockRemainingSeconds = Math.ceil((record.lockedUntilMs - now) / 1000);
  return { isLocked: true, lockRemainingSeconds };
}

export function resetAuthLockout(identifier: string): void {
  lockoutStore.delete(identifier.toLowerCase().trim());
}

/**
 * Cloudflare Turnstile Verification Helper
 */
export async function verifyTurnstileToken(
  token: string,
  clientIp?: string,
  secretKey?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
  // If Turnstile secret is not set (e.g. In local development or testing), pass safely
  if (!secretKey || secretKey.startsWith('test_')) {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp) formData.append('remoteip', clientIp);

    const res = await fetchWithCircuitBreaker('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      timeoutMs: 5000,
    });

    if (!res.ok) {
      return { success: false, errorCodes: [`http_${res.status}`] };
    }

    const data: any = await res.json();
    return {
      success: !!data.success,
      errorCodes: data['error-codes'],
    };
  } catch (err: any) {
    logger.error('[Turnstile] Verification failed', { error: err.message });
    return { success: false, errorCodes: ['verification_exception'] };
  }
}
