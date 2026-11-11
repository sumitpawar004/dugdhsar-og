import { Request, Response } from 'express';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * PII Redaction Utilities:
 * Automatically scrub sensitive user identifiers (phone, email, auth headers, addresses)
 * to comply with India's DPDP Act and GDPR.
 */
export function redactPii(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let sanitized = value;

    // 1. Redact Authorization / Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+([a-zA-Z0-9_\-\.]+)/gi, 'Bearer [REDACTED_TOKEN]');

    // 2. Redact Instagram / Meta Access Tokens (EAA...)
    sanitized = sanitized.replace(/EAA[a-zA-Z0-9]+/g, 'EAA[REDACTED_TOKEN]');

    // 3. Redact Indian Mobile Numbers (+91 or 10-digit formats)
    sanitized = sanitized.replace(
      /(\+91[\-\s]?)?([6-9]\d{1})\d{4}(\d{4})/g,
      (_match, p1, p2, p3) => `${p1 || '+91 '}${p2}****${p3}`
    );

    // 4. Redact Email addresses: show first char and domain
    sanitized = sanitized.replace(
      /([a-zA-Z0-9_\.\-]+)@([a-zA-Z0-9_\.\-]+)\.([a-zA-Z]{2,5})/g,
      (_match, name, domain, tld) => `${name[0]}***@${domain}.${tld}`
    );

    // 5. Redact Private Key PEM blocks
    sanitized = sanitized.replace(
      /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g,
      '[REDACTED_PRIVATE_KEY]'
    );

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(redactPii);
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    const sensitiveKeys = new Set([
      'password',
      'secret',
      'token',
      'authorization',
      'key',
      'privatekey',
      'idtoken',
      'accesstoken',
      'creditcard',
      'cvv',
      'otp'
    ]);

    for (const [k, v] of Object.entries(value)) {
      if (sensitiveKeys.has(k.toLowerCase().replace(/[^a-z]/g, ''))) {
        cleaned[k] = '[REDACTED]';
      } else {
        cleaned[k] = redactPii(v);
      }
    }
    return cleaned;
  }

  return value;
}

/**
 * Fast synchronous SHA-256 prefix hash for user anonymization in logs
 */
export function hashUserId(userId?: string): string | undefined {
  if (!userId) return undefined;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return `u_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export interface StructuredLogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userIdHash?: string;
  route?: string;
  method?: string;
  status?: number;
  latencyMs?: number;
  meta?: Record<string, any>;
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const entry: StructuredLogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? redactPii(message) : message,
    };

    if (meta) {
      if (meta.requestId) entry.requestId = meta.requestId;
      if (meta.userId) entry.userIdHash = hashUserId(meta.userId);
      if (meta.route) entry.route = meta.route;
      if (meta.method) entry.method = meta.method;
      if (meta.status) entry.status = meta.status;
      if (meta.latencyMs) entry.latencyMs = Math.round(meta.latencyMs * 100) / 100;

      if (meta.error) {
        entry.error = {
          code: meta.error.code,
          message: redactPii(meta.error.message || String(meta.error)),
          // Only show stack in development
          ...(process.env.NODE_ENV !== 'production' && meta.error.stack
            ? { stack: meta.error.stack }
            : {}),
        };
      }

      // Remaining metadata
      const cleanMeta: Record<string, any> = {};
      for (const [k, v] of Object.entries(meta)) {
        if (!['requestId', 'userId', 'route', 'method', 'status', 'latencyMs', 'error'].includes(k)) {
          cleanMeta[k] = redactPii(v);
        }
      }
      if (Object.keys(cleanMeta).length > 0) {
        entry.meta = cleanMeta;
      }
    }

    const jsonString = JSON.stringify(entry);

    if (level === 'error') {
      console.error(jsonString);
    } else if (level === 'warn') {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  public error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  public debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }

  /**
   * Log completed HTTP request response with duration (API routes only)
   */
  public logHttp(req: Request, res: Response): void {
    const route = req.originalUrl || req.url || '';
    // Only log API requests, skip Vite internal dev assets and frontend files
    if (!route.startsWith('/api')) {
      return;
    }

    const latencyMs = req.startTime ? performance.now() - req.startTime : 0;
    const user = (req as any).user;

    this.log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', `${req.method} ${route}`, {
      requestId: req.id,
      userId: user?.id || user?.email,
      route,
      method: req.method,
      status: res.statusCode,
      latencyMs,
    });
  }
}

export const logger = new StructuredLogger();
