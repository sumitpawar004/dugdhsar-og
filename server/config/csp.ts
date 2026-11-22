/**
 * Single Source of Truth for DUGDHSAR Content-Security-Policy (CSP)
 * & Cloudflare Edge Security Headers.
 *
 * Consumed by:
 * - server/middleware/securityHeaders.ts (Express & Cloudflare Worker runtime responses)
 * - scripts/prerender.ts (generates dist/_headers and syncs public/_headers at build time)
 */

export const CSP_DIRECTIVES: Record<string, readonly string[]> = {
  'default-src': ["'self'", 'https://dugdhsar.in', 'https://www.dugdhsar.in'],
  'script-src': [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    'https://dugdhsar.in',
    'https://www.dugdhsar.in',
    'https://accounts.google.com',
    'https://challenges.cloudflare.com',
    'https://checkout.razorpay.com',
    'https://apis.google.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://dugdhsar.in',
    'https://www.dugdhsar.in',
    'https://fonts.googleapis.com',
    'https://accounts.google.com',
  ],
  'font-src': ["'self'", 'data:', 'https://dugdhsar.in', 'https://fonts.gstatic.com'],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://dugdhsar.in',
    'https://www.dugdhsar.in',
    'https://images.unsplash.com',
    'https://lh3.googleusercontent.com',
    'https://*.googleusercontent.com',
    'https://*.cdninstagram.com',
    'https://*.fbcdn.net',
    'https://*.instagram.com',
  ],
  'media-src': [
    "'self'",
    'https://dugdhsar.in',
    'https://*.cdninstagram.com',
    'https://*.fbcdn.net',
  ],
  'connect-src': [
    "'self'",
    'https://dugdhsar.in',
    'https://www.dugdhsar.in',
    'https://dugdhsar-og.sumitpawar65005.workers.dev',
    'https://accounts.google.com',
    'https://challenges.cloudflare.com',
    'https://api.razorpay.com',
    'https://lumberjack.razorpay.com',
    'https://sheets.googleapis.com',
    'https://graph.instagram.com',
    'https://graph.facebook.com',
    'https://www.googleapis.com',
  ],
  'frame-src': [
    "'self'",
    'https://dugdhsar.in',
    'https://accounts.google.com',
    'https://challenges.cloudflare.com',
    'https://api.razorpay.com',
    'https://maps.google.com',
    'https://www.google.com',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'", 'https://dugdhsar.in'],
  'form-action': ["'self'", 'https://dugdhsar.in', 'https://www.dugdhsar.in'],
};

export function getCspHeader(options?: { allowPreviewIframe?: boolean }): string {
  const directives: Record<string, readonly string[]> = options?.allowPreviewIframe
    ? {
        ...CSP_DIRECTIVES,
        'frame-ancestors': [
          "'self'",
          'https://aistudio.google.com',
          'https://*.google.com',
          'https://*.googleusercontent.com',
          'https://*.usercontent.goog',
        ],
      }
    : CSP_DIRECTIVES;

  return (
    Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ') + ';'
  );
}

export const CONTENT_SECURITY_POLICY = getCspHeader({ allowPreviewIframe: false });

export function buildCloudflareHeadersFile(): string {
  return `# Cloudflare Edge Security & Caching Headers
# Generated from single source of truth: server/config/csp.ts

# Global security headers for all HTML and text responses
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Cross-Origin-Resource-Policy: same-origin
  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}

# Immutable long-term caching for hashed static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff
  Cross-Origin-Resource-Policy: cross-origin

# Short-term cache with mandatory revalidation for static HTML pages
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

# Block indexing on private portal paths
/admin/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/dealer/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/manager/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/account/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/checkout/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/cart/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store, must-revalidate

/api/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: private, no-store
`;
}
