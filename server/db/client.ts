import { D1Database, WorkerEnv } from '../types';
import { ServiceUnavailableError } from '../errors/AppError';

/**
 * Retrieve the Cloudflare D1 binding from the request-scoped Worker env.
 * NEVER read or cache env.DB at module scope.
 */
export function getD1(env?: WorkerEnv): D1Database | null {
  const db = env?.DB;
  if (db && typeof db.prepare === 'function' && typeof db.batch === 'function') {
    return db;
  }
  return null;
}

/**
 * Strictly require the Cloudflare D1 binding inside a request handler.
 */
export function requireD1(env?: WorkerEnv): D1Database {
  const db = getD1(env);
  if (!db) {
    throw new ServiceUnavailableError('Database binding (DB) is unavailable in this environment.');
  }
  return db;
}

/**
 * RFC 9562 UUIDv7 generator using WebCrypto (zero dependencies, Cloudflare Workers compatible).
 * Time-sortable (48-bit Unix epoch ms prefix) + 74 bits of CSPRNG entropy.
 */
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const nowMs = Date.now();
  bytes[0] = Math.floor(nowMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(nowMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(nowMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(nowMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(nowMs / 2 ** 8) & 0xff;
  bytes[5] = nowMs & 0xff;

  // Version 7 (0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Variant RFC 4122 (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generate a >= 128-bit cryptographically random single-use QR token (32 lowercase hex chars).
 */
export function generateQrToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Human-friendly unique order / invoice number (separate from UUIDv7 primary key).
 * Format: DUG-YYYYMMDD-XXXXXX (IST date + 6 uppercase base32-safe random chars)
 */
export function generateOrderNumber(prefix = 'DUG', istDateYmd?: string): string {
  const datePart = (istDateYmd || getIstDateString()).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = new Uint8Array(6);
  crypto.getRandomValues(rand);
  let suffix = '';
  for (let i = 0; i < rand.length; i++) {
    suffix += alphabet[rand[i] % alphabet.length];
  }
  return `${prefix}-${datePart}-${suffix}`;
}

/**
 * Compute lowercase SHA-256 hex digest using WebCrypto (for users.email_hash).
 */
export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Current UTC timestamp formatted as YYYY-MM-DDTHH:MM:SSZ (matches SQLite strftime default).
 */
export function utcNowIso(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Current calendar date in IST (Asia/Kolkata) as YYYY-MM-DD.
 */
export function getIstDateString(date: Date = new Date()): string {
  const istMs = date.getTime() + 330 * 60 * 1000; // UTC+05:30
  const istDate = new Date(istMs);
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Strictly clamp pagination bounds to prevent accidental full-table scans on Cloudflare D1 Free Plan.
 */
export function clampPagination(
  limitInput?: number,
  offsetInput?: number,
  maxLimit = 100,
  defaultLimit = 25
): { limit: number; offset: number } {
  const rawLimit = typeof limitInput === 'number' && Number.isFinite(limitInput) ? Math.floor(limitInput) : defaultLimit;
  const rawOffset = typeof offsetInput === 'number' && Number.isFinite(offsetInput) ? Math.floor(offsetInput) : 0;
  return {
    limit: Math.max(1, Math.min(maxLimit, rawLimit)),
    offset: Math.max(0, rawOffset),
  };
}
