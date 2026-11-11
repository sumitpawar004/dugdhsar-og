import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';
import { logger } from '../logger';

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/dugdhsar\.in$/,
  /^https:\/\/www\.dugdhsar\.in$/,
  /^https:\/\/.*\.dugdhsar\.in$/,
  /^https:\/\/.*\.run\.app$/, // Cloud Run preview/dev environment
  /^https:\/\/.*\.workers\.dev$/, // Cloudflare Workers preview
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

export function isAllowedOrigin(originOrReferer: string): boolean {
  try {
    const url = new URL(originOrReferer);
    const originString = `${url.protocol}//${url.host}`;
    return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(originString));
  } catch {
    return false;
  }
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
  if (origin && !isAllowedOrigin(origin)) {
    logger.warn('[CSRF] Blocked request with unauthorized Origin', {
      origin,
      method: req.method,
      path: currentPath,
    });
    return next(new ForbiddenError(`Cross-Site Request Forgery (CSRF) blocked: Unauthorized origin "${origin}".`));
  }

  // Validate Referer if present and Origin was absent
  if (!origin && referer && !isAllowedOrigin(referer)) {
    logger.warn('[CSRF] Blocked request with unauthorized Referer', {
      referer,
      method: req.method,
      path: currentPath,
    });
    return next(new ForbiddenError(`Cross-Site Request Forgery (CSRF) blocked: Unauthorized referer "${referer}".`));
  }

  next();
}
