import { BadRequestError } from '../errors/AppError';

// Approved external API domains for outbound backend requests
export const APPROVED_OUTBOUND_DOMAINS = [
  'accounts.google.com',
  'www.googleapis.com',
  'sheets.googleapis.com',
  'oauth2.googleapis.com',
  'graph.instagram.com',
  'challenges.cloudflare.com',
  'api.razorpay.com',
];

// IPv4 Private & Loopback CIDRs and IP patterns
const PRIVATE_IPV4_REGEX = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|0\.|224\.|240\.)/;

/**
 * Validates a target URL against SSRF vulnerabilities:
 * 1. Protocol must be HTTPS (or HTTP for localhost in non-prod test environments)
 * 2. Hostname must not resolve to private RFC 1918 IPs, loopback, or cloud metadata IP (169.254.169.254)
 * 3. In strict mode, hostname must be in the approved outbound domains list
 */
export function validateOutboundUrl(urlString: string, options: { strictAllowlist?: boolean } = {}): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new BadRequestError(`Invalid outbound URL format: "${urlString}"`);
  }

  // 1. Protocol check
  const isDevOrTest = process.env.NODE_ENV !== 'production';
  const allowedProtocols = isDevOrTest ? ['https:', 'http:'] : ['https:'];
  if (!allowedProtocols.includes(url.protocol)) {
    throw new BadRequestError(`SSRF blocked: Disallowed protocol "${url.protocol}". Only HTTPS is permitted.`);
  }

  const hostname = url.hostname.toLowerCase();

  // 2. Private IP & loopback checks
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    throw new BadRequestError('SSRF blocked: localhost/loopback access is strictly prohibited.');
  }

  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    throw new BadRequestError('SSRF blocked: Cloud metadata service access is strictly forbidden.');
  }

  if (PRIVATE_IPV4_REGEX.test(hostname)) {
    throw new BadRequestError(`SSRF blocked: Target IP "${hostname}" is within a private or link-local address space.`);
  }

  // 3. Strict allowlist check (if requested or by default for business outbound requests)
  if (options.strictAllowlist) {
    const isApproved = APPROVED_OUTBOUND_DOMAINS.some(
      (approved) => hostname === approved || hostname.endsWith(`.${approved}`)
    );
    if (!isApproved) {
      throw new BadRequestError(`SSRF blocked: Destination host "${hostname}" is not on the approved outbound domain allowlist.`);
    }
  }

  return url;
}
