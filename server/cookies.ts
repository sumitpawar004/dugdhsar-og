import { Request, Response } from 'express';

export interface CookieOptions {
  maxAgeSeconds?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  const cookies: Record<string, string> = {};
  const pairs = header.split(';');

  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }

  return cookies;
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const {
    maxAgeSeconds = 3600,
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
    path = '/',
  } = options;

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;

  if (maxAgeSeconds >= 0) {
    cookie += `; Max-Age=${maxAgeSeconds}`;
    const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
    cookie += `; Expires=${expires}`;
  }

  if (httpOnly) {
    cookie += '; HttpOnly';
  }

  if (secure) {
    cookie += '; Secure';
  }

  return cookie;
}

export function setSessionCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  isSecure?: boolean
): void {
  const secureFlag = typeof isSecure === 'boolean' ? isSecure : process.env.NODE_ENV === 'production';

  // Access Token: 15 minutes (900 seconds)
  const accessCookie = serializeCookie('dugdhsar_access', accessToken, {
    maxAgeSeconds: 15 * 60,
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'Lax',
    path: '/',
  });

  // Refresh Token: 30 days (2592000 seconds)
  const refreshCookie = serializeCookie('dugdhsar_refresh', refreshToken, {
    maxAgeSeconds: 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'Lax',
    path: '/',
  });

  res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
}

export function clearSessionCookies(res: Response, isSecure?: boolean): void {
  const secureFlag = typeof isSecure === 'boolean' ? isSecure : process.env.NODE_ENV === 'production';

  const clearAccess = serializeCookie('dugdhsar_access', '', {
    maxAgeSeconds: 0,
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'Lax',
    path: '/',
  });

  const clearRefresh = serializeCookie('dugdhsar_refresh', '', {
    maxAgeSeconds: 0,
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'Lax',
    path: '/',
  });

  res.setHeader('Set-Cookie', [clearAccess, clearRefresh]);
}
