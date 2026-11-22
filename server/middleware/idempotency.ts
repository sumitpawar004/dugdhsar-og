import { Request, Response, NextFunction } from 'express';
import { ConflictError, BadRequestError } from '../errors/AppError';
import { logger } from '../logger';
import { getD1, utcNowIso } from '../db/client';

export interface IdempotencyRecord {
  requestHash: string;
  statusCode: number;
  responseBody: string;
  createdAt: string;
  expiresAtMs: number;
}

// In-memory 24-hour cache (fallback for local dev and fast isolate hits)
const memoryStore = new Map<string, IdempotencyRecord>();

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/**
 * Computes deterministic SHA-256 hash of method + URL + recursively canonicalized request body
 */
export async function computeRequestHash(method: string, url: string, body: any): Promise<string> {
  const normalizedBody =
    typeof body === 'object' && body !== null ? stableStringify(body) : String(body || '');
  const input = `${method.toUpperCase()}:${url}:${normalizedBody}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Express Middleware: Race-Safe 24-Hour Idempotency Replay Protection
 * Uses Cloudflare D1 `idempotency_keys` (atomic INSERT OR IGNORE lock) when env.DB is bound,
 * with Workers KV + in-memory fallback for local dev.
 */
export function idempotencyMiddleware(options: { ttlSeconds?: number; required?: boolean } = {}) {
  const { ttlSeconds = 86400, required = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

    if (!idempotencyKey) {
      if (required) {
        return next(new BadRequestError('Idempotency-Key header is required for this operation.'));
      }
      return next();
    }

    const cleanKey = idempotencyKey.trim();
    if (cleanKey.length < 8 || cleanKey.length > 128) {
      return next(new BadRequestError('Idempotency-Key must be between 8 and 128 characters long.'));
    }

    const env: any = (req as any).env;
    const db = getD1(env);
    const userId: string | null = (req as any).user?.id ?? null;
    const route = req.originalUrl || req.url;
    const requestHash = await computeRequestHash(req.method, route, req.body);
    const now = Date.now();
    const nowIso = utcNowIso(new Date(now));
    const expiresAtMs = now + ttlSeconds * 1000;
    const expiresAtIso = utcNowIso(new Date(expiresAtMs));

    const replayRecord = (record: IdempotencyRecord) => {
      if (record.requestHash !== requestHash) {
        logger.warn(`[Idempotency] Conflict detected for key ${cleanKey}: request body differs`, {
          key: cleanKey,
          method: req.method,
          path: route,
        });
        return next(
          new ConflictError(
            'Idempotency conflict: A request with this key was previously submitted with different payload parameters.'
          )
        );
      }

      if (record.statusCode === 0) {
        return next(
          new ConflictError('A request with this Idempotency-Key is currently being processed. Please retry shortly.')
        );
      }

      logger.info(`[Idempotency] Cache hit for key ${cleanKey} -> replaying ${record.statusCode}`);
      res.setHeader('X-Idempotency-Hit', 'true');
      res.setHeader('X-Idempotency-Key', cleanKey);
      res.status(record.statusCode);
      res.setHeader('Content-Type', 'application/json');
      return res.send(record.responseBody);
    };

    // 1. Check D1 atomically first when bound (prevents concurrent double-submit across isolates)
    if (db) {
      try {
        const lockRes = await db
          .prepare(
            `INSERT OR IGNORE INTO idempotency_keys (
              key, user_id, route, request_hash, status_code, response_json, created_at, expires_at
            ) VALUES (?, ?, ?, ?, 0, '{}', ?, ?)`
          )
          .bind(cleanKey, userId, route, requestHash, nowIso, expiresAtIso)
          .run();

        if (!lockRes.meta?.changes || lockRes.meta.changes === 0) {
          const existing = await db
            .prepare(
              `SELECT request_hash, status_code, response_json, created_at, expires_at
               FROM idempotency_keys
               WHERE key = ?
               LIMIT 1`
            )
            .bind(cleanKey)
            .first<{
              request_hash: string;
              status_code: number;
              response_json: string;
              created_at: string;
              expires_at: string;
            }>();

          if (existing) {
            const existingExpMs = Date.parse(existing.expires_at);
            if (!Number.isNaN(existingExpMs) && now >= existingExpMs) {
              // Expired record: replace atomically
              await db
                .prepare(
                  `UPDATE idempotency_keys
                   SET user_id = ?, route = ?, request_hash = ?, status_code = 0, response_json = '{}', created_at = ?, expires_at = ?
                   WHERE key = ?`
                )
                .bind(userId, route, requestHash, nowIso, expiresAtIso, cleanKey)
                .run();
            } else {
              return replayRecord({
                requestHash: existing.request_hash,
                statusCode: existing.status_code,
                responseBody: existing.response_json,
                createdAt: existing.created_at,
                expiresAtMs: existingExpMs || expiresAtMs,
              });
            }
          }
        }
      } catch (err: any) {
        logger.warn('[Idempotency] D1 lock check failed, falling back', { error: err?.message });
      }
    } else {
      // Fallback when D1 is unbound (local dev / legacy tests)
      let record = memoryStore.get(cleanKey);
      if (!record && env?.CACHE) {
        try {
          const rawKv = await env.CACHE.get(`idempotency:${cleanKey}`);
          if (rawKv) record = JSON.parse(rawKv);
        } catch (err: any) {
          logger.warn('[Idempotency] KV lookup failed', { error: err.message });
        }
      }

      if (record) {
        if (now >= record.expiresAtMs) {
          memoryStore.delete(cleanKey);
        } else {
          return replayRecord(record);
        }
      }

      // Set local in-flight lock
      memoryStore.set(cleanKey, {
        requestHash,
        statusCode: 0,
        responseBody: '{}',
        createdAt: nowIso,
        expiresAtMs,
      });
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let saved = false;

    const captureAndSave = async (body: any, statusCode: number) => {
      if (saved) return;
      saved = true;

      if (statusCode >= 500) {
        memoryStore.delete(cleanKey);
        if (db) {
          await db.prepare(`DELETE FROM idempotency_keys WHERE key = ? AND status_code = 0`).bind(cleanKey).run().catch(() => {});
        }
        return;
      }

      const responseString = typeof body === 'object' ? JSON.stringify(body) : String(body);
      const newRecord: IdempotencyRecord = {
        requestHash,
        statusCode,
        responseBody: responseString,
        createdAt: nowIso,
        expiresAtMs,
      };

      memoryStore.set(cleanKey, newRecord);

      if (db) {
        await db
          .prepare(`UPDATE idempotency_keys SET status_code = ?, response_json = ? WHERE key = ?`)
          .bind(statusCode, responseString, cleanKey)
          .run()
          .catch((err: any) => logger.warn('[Idempotency] D1 save failed', { error: err?.message }));
      } else if (env?.CACHE) {
        await env.CACHE.put(`idempotency:${cleanKey}`, JSON.stringify(newRecord), {
          expirationTtl: ttlSeconds,
        }).catch((err: any) => logger.warn('[Idempotency] KV save failed', { error: err?.message }));
      }
    };

    res.json = (body: any): Response => {
      void captureAndSave(body, res.statusCode);
      res.setHeader('X-Idempotency-Key', cleanKey);
      return originalJson(body);
    };

    res.send = (body: any): Response => {
      void captureAndSave(body, res.statusCode);
      res.setHeader('X-Idempotency-Key', cleanKey);
      return originalSend(body);
    };

    next();
  };
}
