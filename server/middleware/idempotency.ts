import { Request, Response, NextFunction } from 'express';
import { ConflictError, BadRequestError } from '../errors/AppError';
import { logger } from '../logger';

export interface IdempotencyRecord {
  requestHash: string;
  statusCode: number;
  responseBody: string;
  createdAt: string;
  expiresAtMs: number;
}

// In-memory 24-hour cache (fallback for local dev and fast isolate hits)
const memoryStore = new Map<string, IdempotencyRecord>();

/**
 * Computes deterministic SHA-256 hash of method + URL + request body
 */
export async function computeRequestHash(method: string, url: string, body: any): Promise<string> {
  const normalizedBody = typeof body === 'object' && body !== null ? JSON.stringify(body, Object.keys(body).sort()) : String(body || '');
  const input = `${method.toUpperCase()}:${url}:${normalizedBody}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Express Middleware: 24-Hour Idempotency Replay Protection
 */
export function idempotencyMiddleware(options: { ttlSeconds?: number } = {}) {
  const { ttlSeconds = 86400 } = options; // 24 hours

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only state-mutating requests benefit from idempotency
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

    // Optional for general requests, but if provided, must be strictly enforced
    if (!idempotencyKey) {
      return next();
    }

    const cleanKey = idempotencyKey.trim();
    if (cleanKey.length < 8 || cleanKey.length > 128) {
      return next(new BadRequestError('Idempotency-Key must be between 8 and 128 characters long.'));
    }

    const env: any = (req as any).env;
    const requestHash = await computeRequestHash(req.method, req.originalUrl || req.url, req.body);
    const now = Date.now();

    // 1. Check in-memory store
    let record = memoryStore.get(cleanKey);

    // 2. If not in memory, check Workers KV if available
    if (!record && env?.CACHE) {
      try {
        const rawKv = await env.CACHE.get(`idempotency:${cleanKey}`);
        if (rawKv) {
          record = JSON.parse(rawKv);
        }
      } catch (err: any) {
        logger.warn('[Idempotency] KV lookup failed', { error: err.message });
      }
    }

    if (record) {
      // Check expiration
      if (now >= record.expiresAtMs) {
        memoryStore.delete(cleanKey);
      } else {
        // Payload tampering check
        if (record.requestHash !== requestHash) {
          logger.warn(`[Idempotency] Conflict detected for key ${cleanKey}: request body differs`, {
            key: cleanKey,
            method: req.method,
            path: req.url,
          });
          return next(
            new ConflictError('Idempotency conflict: A request with this key was previously submitted with different payload parameters.')
          );
        }

        // Cache hit: replay previous response
        logger.info(`[Idempotency] Cache hit for key ${cleanKey} -> replaying ${record.statusCode}`);
        res.setHeader('X-Idempotency-Hit', 'true');
        res.setHeader('X-Idempotency-Key', cleanKey);
        res.status(record.statusCode);
        res.setHeader('Content-Type', 'application/json');
        return res.send(record.responseBody);
      }
    }

    // Capture outgoing response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const captureAndSave = async (body: any, statusCode: number) => {
      // Only cache successful or client error responses (do not cache transient 500s)
      if (statusCode >= 500) return;

      const responseString = typeof body === 'object' ? JSON.stringify(body) : String(body);
      const newRecord: IdempotencyRecord = {
        requestHash,
        statusCode,
        responseBody: responseString,
        createdAt: new Date().toISOString(),
        expiresAtMs: now + ttlSeconds * 1000,
      };

      memoryStore.set(cleanKey, newRecord);

      if (env?.CACHE) {
        try {
          await env.CACHE.put(`idempotency:${cleanKey}`, JSON.stringify(newRecord), {
            expirationTtl: ttlSeconds,
          });
        } catch (err: any) {
          logger.warn('[Idempotency] KV save failed', { error: err.message });
        }
      }
    };

    res.json = (body: any): Response => {
      captureAndSave(body, res.statusCode);
      res.setHeader('X-Idempotency-Key', cleanKey);
      return originalJson(body);
    };

    res.send = (body: any): Response => {
      captureAndSave(body, res.statusCode);
      res.setHeader('X-Idempotency-Key', cleanKey);
      return originalSend(body);
    };

    next();
  };
}
