import { logger } from './logger';
import { redactPii, hashUserId } from './logger';
import { WorkerEnv } from './types';

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  route?: string;
  method?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface CapturedErrorEvent {
  eventId: string;
  timestamp: string;
  message: string;
  name: string;
  stack?: string;
  requestId?: string;
  userIdHash?: string;
  route?: string;
  tags: Record<string, string>;
  extra: Record<string, any>;
}

// Bounded in-memory buffer of recent errors for edge inspection (max 50)
const errorBuffer: CapturedErrorEvent[] = [];

/**
 * Lightweight, zero-dependency Error Tracker for Cloudflare Worker Edge Monolith
 * - Automatic PII sanitization (redacts tokens, phones, emails, passwords)
 * - Safe for Cloudflare Free Plan (no heavy runtime or blocking network calls)
 */
export function captureException(
  error: unknown,
  context: ErrorContext = {},
  env?: WorkerEnv
): CapturedErrorEvent {
  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const sanitizedExtra: Record<string, any> = {};
  if (context.extra) {
    for (const [k, v] of Object.entries(context.extra)) {
      sanitizedExtra[k] = typeof v === 'string' ? redactPii(v) : v;
    }
  }

  const event: CapturedErrorEvent = {
    eventId,
    timestamp: new Date().toISOString(),
    message: redactPii(err.message),
    name: err.name || 'Error',
    stack: err.stack ? redactPii(err.stack) : undefined,
    requestId: context.requestId,
    userIdHash: context.userId ? hashUserId(context.userId) : context.userEmail ? hashUserId(context.userEmail) : undefined,
    route: context.route,
    tags: {
      environment: env?.ENVIRONMENT || process.env.NODE_ENV || 'production',
      ...context.tags,
    },
    extra: sanitizedExtra,
  };

  // Add to bounded in-memory buffer
  errorBuffer.unshift(event);
  if (errorBuffer.length > 50) {
    errorBuffer.pop();
  }

  // Structured logging
  logger.error(`[ErrorTracker] Captured ${event.name}: ${event.message}`, {
    eventId,
    name: event.name,
    requestId: event.requestId,
    userIdHash: event.userIdHash,
    route: event.route,
    stack: event.stack,
  });

  return event;
}

/**
 * Retrieve recent errors for admin debugging (super_admin restricted)
 */
export function getRecentErrors(): CapturedErrorEvent[] {
  return [...errorBuffer];
}

/**
 * Clear buffered error events (for test cleanup)
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}
