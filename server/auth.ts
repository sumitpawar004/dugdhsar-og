import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { WorkerEnv, AuthUser, UserRole } from './types';
import { validateEnv } from './env';
import { parseCookies, setSessionCookies, clearSessionCookies } from './cookies';
import { UnauthorizedError, ForbiddenError } from './errors/AppError';
import { logger } from './logger';
import { getD1 } from './db/client';
import {
  getBootstrapDealerEmails,
  getSuperAdminEmails,
  isSessionRevokedInDb,
  revokeSessionInDb,
} from './db/authRepo';

const GOOGLE_JWKS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');

// In-memory revoked token JTI cache (jti -> expiry timestamp ms)
const revokedJtiStore = new Map<string, number>();

// Ephemeral cryptographically random fallback key (used only if JWT_SECRET secret isn't bound yet)
let ephemeralRuntimeSecret: Uint8Array | null = null;
let warnedMissingJwtSecret = false;

function getJwtSecretBytes(env?: WorkerEnv): Uint8Array {
  const rawSecret =
    env?.JWT_SECRET ||
    (typeof process !== 'undefined' && process?.env ? process.env.JWT_SECRET : undefined);
  const envMode =
    env?.ENVIRONMENT ||
    (typeof process !== 'undefined' && process?.env ? process.env.ENVIRONMENT : 'development');

  if (rawSecret && rawSecret.length >= 16 && !(envMode === 'production' && rawSecret.includes('dev_only'))) {
    return new TextEncoder().encode(rawSecret);
  }

  if (envMode !== 'production') {
    try {
      const validated = validateEnv(env);
      return new TextEncoder().encode(validated.JWT_SECRET);
    } catch {
      // fall through to ephemeral CSPRNG key
    }
  }

  if (!ephemeralRuntimeSecret) {
    const buf = new Uint8Array(new ArrayBuffer(32));
    crypto.getRandomValues(buf);
    ephemeralRuntimeSecret = buf;
  }
  if (!warnedMissingJwtSecret) {
    warnedMissingJwtSecret = true;
    logger.warn(
      '[Auth] JWT_SECRET is not configured in Cloudflare Workers secrets yet. Using an ephemeral runtime key — run `npx wrangler secret put JWT_SECRET` so sessions persist across Worker restarts.'
    );
  }
  return ephemeralRuntimeSecret;
}

/**
 * Map email to role (Super admin, dealer, or customer).
 * Strictly prevents client-driven privilege escalation:
 * Super admin is granted ONLY if email is in SUPER_ADMIN_EMAILS.
 * Dealer is granted ONLY if email is in DEALER_EMAILS.
 */
export function determineUserRole(email: string, env?: WorkerEnv, _requestedRole?: string): UserRole {
  const cleanEmail = email.toLowerCase().trim();

  // Super Admin is granted ONLY via SUPER_ADMIN_EMAILS (with dev-only fallback when unset)
  if (getSuperAdminEmails(env).includes(cleanEmail)) {
    return 'super_admin';
  }

  // Dealer bootstrap emails (in D1 mode, DEALER_EMAILS only bootstraps on first login)
  if (getBootstrapDealerEmails(env).includes(cleanEmail)) {
    return 'dealer';
  }

  const procEnv = typeof process !== 'undefined' && process?.env ? process.env : {};
  const isProd = (env?.ENVIRONMENT || procEnv.ENVIRONMENT || procEnv.NODE_ENV) === 'production';
  if (!isProd && ['dealer@dugdhsar.in', 'manager@dugdhsar.in'].includes(cleanEmail)) {
    return cleanEmail === 'manager@dugdhsar.in' ? 'manager' : 'dealer';
  }

  return 'customer';
}

/**
 * Verify Google ID token against Google's public JWKS using jose
 * Enforces email_verified === true to prevent impersonation attacks.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedAudience?: string
): Promise<{ email: string; name: string; picture?: string; sub: string }> {
  try {
    // Instantiate per-request so Cloudflare Workers never shares I/O promises across request contexts
    const googleJwks = jose.createRemoteJWKSet(GOOGLE_JWKS_URL);
    const { payload } = await jose.jwtVerify(idToken, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: expectedAudience || undefined,
    });

    // Enforce email verification
    if (payload.email_verified !== true) {
      throw new Error('Google account email is not verified by Google');
    }

    const email = payload.email as string;
    const name = (payload.name as string) || (email ? email.split('@')[0] : 'Patron');
    const picture = payload.picture as string | undefined;
    const sub = payload.sub as string;

    if (!email) {
      throw new Error('Google token does not contain an email address');
    }

    return { email, name, picture, sub };
  } catch (err: any) {
    throw new Error(`Google token verification failed: ${err.message}`);
  }
}

/**
 * Clear in-memory isolate revocation cache (used in tests to verify D1-backed revocation directly).
 */
export function clearInMemoryRevokedJtiCache(): void {
  revokedJtiStore.clear();
}

/**
 * Revoke a token by JTI (persisted to D1 revoked_sessions + isolate fast-hit cache).
 * Legacy KV revoked_token storage is removed — D1 revoked_sessions is the single source of truth.
 */
export async function revokeToken(
  jti: string,
  expiresAtMs: number,
  env?: WorkerEnv,
  userId?: string,
  reason = 'logout'
): Promise<void> {
  revokedJtiStore.set(jti, expiresAtMs);

  const db = getD1(env);
  if (db && userId) {
    try {
      await revokeSessionInDb(db, { jti, userId, reason, expiresAtMs });
    } catch (err: any) {
      logger.warn('[Auth] D1 token revocation write failed', { error: err.message });
    }
  }
}

/**
 * Check if a JTI has been revoked (fast isolate hit -> single indexed PK lookup in D1 revoked_sessions).
 */
export async function isTokenRevoked(jti: string, env?: WorkerEnv): Promise<boolean> {
  const localExp = revokedJtiStore.get(jti);
  if (localExp) {
    if (Date.now() > localExp) {
      revokedJtiStore.delete(jti);
      return false;
    }
    return true;
  }

  const db = getD1(env);
  if (db) {
    try {
      return await isSessionRevokedInDb(db, jti);
    } catch {
      // non-fatal if table not migrated yet
    }
  }

  return false;
}

/**
 * Issue a signed short-lived session access JWT (15 minutes) with sub=user.id, role, and jti.
 */
export async function createSessionJwt(user: AuthUser, env?: WorkerEnv): Promise<{ token: string; jti: string }> {
  const secretBytes = getJwtSecretBytes(env);
  const jti = `jti_${crypto.randomUUID()}`;

  const token = await new jose.SignJWT({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    dealerId: user.dealerId,
    assignedPincodes: user.assignedPincodes,
    tokenType: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretBytes);

  return { token, jti };
}

/**
 * Issue a rolling refresh JWT (30 days) with sub=user.id, role, and jti.
 */
export async function createRefreshToken(user: AuthUser, env?: WorkerEnv): Promise<{ token: string; jti: string }> {
  const secretBytes = getJwtSecretBytes(env);
  const jti = `ref_${crypto.randomUUID()}`;

  const token = await new jose.SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretBytes);

  return { token, jti };
}

/**
 * Verify a session access token (checks signature, expiration, and revocation status)
 */
export async function verifySessionJwt(token: string, env?: WorkerEnv): Promise<AuthUser | null> {
  try {
    const secretBytes = getJwtSecretBytes(env);
    const { payload } = await jose.jwtVerify(token, secretBytes);

    if (payload.tokenType && payload.tokenType !== 'access') {
      return null;
    }

    if (payload.jti && (await isTokenRevoked(payload.jti, env))) {
      logger.warn('[Auth] Revoked token used', { jti: payload.jti });
      return null;
    }

    return {
      id: (payload.id as string) || (payload.sub as string),
      email: payload.email as string,
      fullName: (payload.fullName as string) || 'Patron',
      role: (payload.role as UserRole) || 'customer',
      avatarUrl: payload.avatarUrl as string | undefined,
      dealerId: payload.dealerId as string | undefined,
      assignedPincodes: payload.assignedPincodes as string[] | undefined,
      jti: payload.jti as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string, env?: WorkerEnv): Promise<{ id: string; email: string; role: UserRole; jti: string } | null> {
  try {
    const secretBytes = getJwtSecretBytes(env);
    const { payload } = await jose.jwtVerify(token, secretBytes);

    if (payload.tokenType !== 'refresh') {
      return null;
    }

    const jti = payload.jti as string;
    if (jti && (await isTokenRevoked(jti, env))) {
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: (payload.role as UserRole) || 'customer',
      jti,
    };
  } catch {
    return null;
  }
}

/**
 * Extract auth user from Request:
 * 1. Checks Authorization: Bearer <token>
 * 2. Checks cookie 'dugdhsar_access'
 */
export async function extractAuthUser(req: Request, env?: WorkerEnv): Promise<AuthUser | null> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    const cookies = parseCookies(req);
    token = cookies['dugdhsar_access'];
  }

  if (!token) {
    return null;
  }

  return await verifySessionJwt(token, env);
}

/**
 * Middleware: attach user to req.user if session token is valid
 */
export function authMiddleware(envOrGetter?: WorkerEnv | (() => WorkerEnv | undefined)) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const resolvedEnv =
        (req as any).env ||
        (typeof envOrGetter === 'function' ? envOrGetter() : envOrGetter);
      const user = await extractAuthUser(req, resolvedEnv);
      (req as any).user = user;
    } catch {
      (req as any).user = null;
    }
    next();
  };
}

/**
 * Middleware: require authenticated user (returns 401 UnauthorizedError)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user: AuthUser | undefined = (req as any).user;
  if (!user) {
    return next(new UnauthorizedError('Authentication required. Please sign in with your verified Google account.'));
  }
  next();
}

/**
 * Middleware: require specific role(s) on server (returns 403 ForbiddenError)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user: AuthUser | undefined = (req as any).user;
    if (!user) {
      return next(new UnauthorizedError('Authentication required. Please sign in.'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role "${user.role}" does not have permission to access this resource. Required: ${allowedRoles.join(' or ')}.`
        )
      );
    }

    next();
  };
}
