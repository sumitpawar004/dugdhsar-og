import { Request, Response, NextFunction } from 'express';

/**
 * Production Security Headers Middleware
 * Implements Defense-in-Depth for Express & Cloudflare Workers.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // HSTS (HTTP Strict Transport Security): 2 years + subdomains + preload
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking Protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

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

  // Disable client caching for all sensitive API routes
  if (req.url.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}
