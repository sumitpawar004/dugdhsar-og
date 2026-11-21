import { Request, Response, NextFunction } from 'express';
import { CONTENT_SECURITY_POLICY, getCspHeader } from '../config/csp';

/**
 * Production Security Headers Middleware
 * Implements Defense-in-Depth for Express & Cloudflare Workers.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  const isApi = req.url.startsWith('/api') || req.originalUrl?.startsWith('/api');
  const host = String(req.headers?.host || '');
  const isCloudRunPreview = host.includes('.run.app');
  const isDevServer =
    typeof process !== 'undefined' &&
    process?.env?.NODE_ENV !== 'production' &&
    (req as any).env?.ENVIRONMENT !== 'production';
  const allowPreviewIframe = !isApi && (isCloudRunPreview || isDevServer);

  // HSTS (HTTP Strict Transport Security): 2 years + subdomains + preload
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking Protection (kept strict on APIs & Cloudflare production; relaxed on AI Studio iframe preview)
  if (!allowPreviewIframe) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy: restrict browser hardware/sensor APIs
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()'
  );

  // Cross-Origin Opener Policy: allows Google OAuth popup to communicate
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Cross-Origin Resource Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Single-source-of-truth Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    allowPreviewIframe ? getCspHeader({ allowPreviewIframe: true }) : CONTENT_SECURITY_POLICY
  );

  // Disable client caching for all sensitive API routes
  if (isApi) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}
