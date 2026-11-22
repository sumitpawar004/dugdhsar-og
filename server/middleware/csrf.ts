import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';
import { logger } from '../logger';

/**
 * Primary production site origins.
 */
export const PRODUCTION_ORIGINS = [
  'https://dugdhsar.in',
  'https://www.dugdhsar.in',
] as const;

/**
 * Cloudflare Workers testing origins (kept allowed for testing only).
 */
export const TESTING_WORKERS_ORIGINS = [
  'https://dugdhsar-og.sumitpawar65005.workers.dev',
  'https://dugdhsar-og.workers.dev',
] as const;

const ALLOWED_ORIGIN_PATTERNS = [
  // Primary production domain and subdomains
  /^https:\/\/dugdhsar\.in$/,
  /^https:\/\/www\.dugdhsar\.in$/,
  /^https:\/\/[a-z0-9-]+\.dugdhsar\.in$/,
  // Testing-only Cloudflare Workers addresses (never wildcard *.workers.dev)
  /^https:\/\/dugdhsar-og\.sumitpawar65005\.workers\.dev$/,
  /^https:\/\/dugdhsar-og\.workers\.dev$/,
  // Local development & AI Studio preview environments
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.run\.app$/,
];

// Routes that receive genuine server-to-server external webhooks or beacons
const CSRF_EXEMPT_PATHS = [
  '/api/instagram/webhook',
  '/api/razorpay/webhook',
  '/api/vitals',
  '/api/health',
  '/api/ready',
  '/api/v1/health',
  '/api/v1/ready',
];

function normalizeOrigin(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(originOrReferer: string, configuredAppUrl?: string): boolean {
  const originString = normalizeOrigin(originOrReferer);
  if (!originString) return false;

  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(originString))) {
    return true;
  }

  // Also honor explicitly configured APP_URL (must be https or localhost)
  const appUrlOrigin = normalizeOrigin(configuredAppUrl);
  if (appUrlOrigin && originString === appUrlOrigin) {
    return true;
  }

  return false;
}

/**
 * Express Middleware: CSRF Protection via strict Origin & Referer Verification
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  // Safe methods do not mutate state
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const currentPath = req.path || req.url;

  // Check exemption list for server-to-server webhooks
  if (CSRF_EXEMPT_PATHS.some((exempt) => currentPath.startsWith(exempt))) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const configuredAppUrl =
    (req as any).env?.APP_URL ||
    (typeof process !== 'undefined' ? process.env?.APP_URL : undefined);

  // If both Origin and Referer are missing on a state-changing API call:
  // In pure browser environments, browsers always attach Origin or Referer to POST/PUT/PATCH/DELETE.
  // We allow programmatic non-browser API clients only if authenticated via Authorization: Bearer.
  if (!origin && !referer) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }
    logger.warn('[CSRF] Blocked state-changing request without Origin or Referer header', {
      method: req.method,
      path: currentPath,
    });
    return next(new ForbiddenError('Cross-Site Request Forgery (CSRF) blocked: Missing Origin header.'));
  }

  // Validate Origin if present
  if (origin && !isAllowedOrigin(origin, configuredAppUrl)) {
    logger.warn('[CSRF] Blocked request with unauthorized Origin', {
      origin,
      method: req.method,
      path: currentPath,
    });
    return next(new ForbiddenError(`Cross-Site Request Forgery (CSRF) blocked: Unauthorized origin "${origin}".`));
  }

  // Validate Referer if present and Origin was absent
  if (!origin && referer && !isAllowedOrigin(referer, configuredAppUrl)) {
    logger.warn('[CSRF] Blocked request with unauthorized Referer', {
      referer,
      method: req.method,
      path: currentPath,
    });
    return next(new ForbiddenError(`Cross-Site Request Forgery (CSRF) blocked: Unauthorized referer "${referer}".`));
  }

  next();
}
