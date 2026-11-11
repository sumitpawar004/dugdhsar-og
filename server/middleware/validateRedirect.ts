/**
 * Open Redirect Validation & Safe Redirect Helper
 * Blocks:
 *   - External domains (e.g. https://evil.com, http://phishing.site)
 *   - Protocol-relative URLs (e.g. //attacker.com)
 *   - JavaScript / Data schemes (e.g. javascript:alert(1))
 *   - Backslash path manipulation (e.g. /\attacker.com)
 *   - Control characters and null bytes
 */

export function getSafeRedirectUrl(target: string | null | undefined, defaultFallback = '/'): string {
  if (!target || typeof target !== 'string') {
    return defaultFallback;
  }

  const trimmed = target.trim();

  // Must begin with a single slash '/'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultFallback;
  }

  // Reject URLs with control characters, tabs, newlines, or backslashes
  if (/[\x00-\x1F\x7F\\;]/.test(trimmed)) {
    return defaultFallback;
  }

  // Reject encoded backslashes (%5C, %5c) or encoded slashes that might confuse parsers
  if (/%5c|%2f%2f/i.test(trimmed)) {
    return defaultFallback;
  }

  // Try parsing against a dummy local base
  try {
    const parsed = new URL(trimmed, 'https://dugdhsar.in');
    // Ensure origin matches exactly and protocol is https
    if (parsed.origin !== 'https://dugdhsar.in') {
      return defaultFallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultFallback;
  }
}
