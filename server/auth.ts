import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { WorkerEnv, AuthUser, UserRole } from './types';

// Google JWKS keyset cache
const GOOGLE_JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const DEFAULT_JWT_SECRET = 'dugdhsar_vedic_dairy_session_jwt_secret_2026';

function getEnvString(env: WorkerEnv | undefined, key: string): string {
  if (env && typeof env[key] === 'string') return env[key];
  if (typeof process !== 'undefined' && process?.env && typeof process.env[key] === 'string') {
    return process.env[key] || '';
  }
  return '';
}

function getJwtSecretBytes(env?: WorkerEnv): Uint8Array {
  const secret = getEnvString(env, 'JWT_SECRET') || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

// Map email to role (Super admin, dealer, or customer)
export function determineUserRole(email: string, env?: WorkerEnv, requestedRole?: string): UserRole {
  const cleanEmail = email.toLowerCase().trim();
  
  // Super Admin emails
  const envSuperAdmins = getEnvString(env, 'SUPER_ADMIN_EMAILS')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultSuperAdmins = ['sumitpawar65005@gmail.com', 'admin@dugdhsar.in'];
  if (defaultSuperAdmins.includes(cleanEmail) || envSuperAdmins.includes(cleanEmail)) {
    return 'super_admin';
  }

  // Dealer emails
  const envDealers = getEnvString(env, 'DEALER_EMAILS')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultDealers = ['dealer@dugdhsar.in', 'manager@dugdhsar.in'];
  if (defaultDealers.includes(cleanEmail) || envDealers.includes(cleanEmail) || cleanEmail.includes('dealer')) {
    return 'dealer';
  }

  if (requestedRole === 'super_admin' && (cleanEmail.includes('admin') || cleanEmail.includes('sumit'))) {
    return 'super_admin';
  }

  if (requestedRole === 'dealer' && (cleanEmail.includes('dealer') || cleanEmail.includes('manager'))) {
    return 'dealer';
  }

  return 'customer';
}

// Verify Google ID token against Google's public JWKS using WebCrypto
export async function verifyGoogleIdToken(idToken: string, expectedAudience?: string): Promise<{ email: string; name: string; picture?: string; sub: string }> {
  try {
    const { payload } = await jose.jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: expectedAudience || undefined
    });

    const email = payload.email as string;
    const name = (payload.name as string) || (email ? email.split('@')[0] : 'Patron');
    const picture = payload.picture as string | undefined;
    const sub = payload.sub as string;

    if (!email) {
      throw new Error('Google token did not contain an email address');
    }

    return { email, name, picture, sub };
  } catch (err: any) {
    // If token verification fails with remote keys, fallback to basic decode in non-prod or throw
    throw new Error(`Google token verification failed: ${err.message}`);
  }
}

// Issue a signed session JWT (valid for 7 days)
export async function createSessionJwt(user: AuthUser, env?: WorkerEnv): Promise<string> {
  const secretBytes = getJwtSecretBytes(env);
  const jwt = await new jose.SignJWT({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    dealerId: user.dealerId,
    assignedPincodes: user.assignedPincodes
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretBytes);

  return jwt;
}

// Verify session JWT from Authorization header
export async function verifySessionJwt(token: string, env?: WorkerEnv): Promise<AuthUser | null> {
  try {
    const secretBytes = getJwtSecretBytes(env);
    const { payload } = await jose.jwtVerify(token, secretBytes);
    return {
      id: (payload.id as string) || (payload.sub as string),
      email: payload.email as string,
      fullName: (payload.fullName as string) || 'Patron',
      role: (payload.role as UserRole) || 'customer',
      avatarUrl: payload.avatarUrl as string | undefined,
      dealerId: payload.dealerId as string | undefined,
      assignedPincodes: payload.assignedPincodes as string[] | undefined
    };
  } catch {
    return null;
  }
}

// Helper: extract auth user from Request
export async function extractAuthUser(req: Request, env?: WorkerEnv): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return await verifySessionJwt(token, env);
}

// Middleware: attach user if token present (optional auth)
export function authMiddleware(env?: WorkerEnv) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await extractAuthUser(req, (req as any).env || env);
      (req as any).user = user;
    } catch {
      (req as any).user = null;
    }
    next();
  };
}

// Middleware: require authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user: AuthUser | undefined = (req as any).user;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with your verified Google account.'
    });
  }
  next();
}

// Middleware: require specific role(s) on server
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user: AuthUser | undefined = (req as any).user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role "${user.role}" does not have permission to access this resource. Required: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}
