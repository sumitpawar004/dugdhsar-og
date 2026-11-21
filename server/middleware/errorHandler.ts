import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, InternalServerError, ValidationError } from '../errors/AppError';
import { logger, redactPii } from '../logger';
import { captureException } from '../errorTracker';

function formatSafeStack(stack: unknown): string | undefined {
  if (typeof stack !== 'string' || !stack.trim()) return undefined;
  return redactPii(stack).split('\n').slice(0, 8).join('\n');
}

function formatSafeCause(cause: unknown): string | undefined {
  if (cause === undefined || cause === null) return undefined;
  if (cause instanceof Error) {
    return redactPii(`${cause.name || 'Error'}: ${cause.message || ''}`);
  }
  if (typeof cause === 'string') {
    return redactPii(cause);
  }
  try {
    return redactPii(JSON.stringify(cause)).slice(0, 300);
  } catch {
    return redactPii(String(cause)).slice(0, 300);
  }
}

/**
 * Central Error Handler Middleware
 * Guarantees zero sensitive internal leaks to clients, formats standard error envelopes,
 * and ALWAYS emits a single JSON console.error line for unexpected errors so Cloudflare Observability shows the real cause.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id || (res.getHeader('X-Request-Id') as string) || crypto.randomUUID();
  const env: any = (req as any).env;
  const isProduction =
    env?.ENVIRONMENT === 'production' ||
    (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production');

  let appError: AppError;
  let isUnexpected = false;

  if (err instanceof AppError) {
    appError = err;
    isUnexpected = err.statusCode >= 500;
  } else if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    appError = new ValidationError('Invalid request payload or query parameters', formattedIssues);
  } else if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    appError = new AppError(400, 'BAD_REQUEST', 'Malformed JSON in request body');
  } else {
    isUnexpected = true;
    // Unhandled exception: always return generic message in production
    appError = new InternalServerError(
      isProduction
        ? 'An unexpected error occurred. Please contact support with your Request ID.'
        : err?.message || 'Internal server error'
    );
  }

  // Set rate-limit retry header if applicable
  if (appError.statusCode === 429 && appError.details?.retryAfterSeconds) {
    res.setHeader('Retry-After', String(appError.details.retryAfterSeconds));
  }

  // Ensure correlation header is present
  res.setHeader('X-Request-Id', requestId);

  const route = (req.originalUrl || req.url || '/').split('?')[0];

  // ALWAYS emit one structured JSON console.error line for unexpected errors (Cloudflare Workers Observability)
  // Never logs secrets, tokens, passwords, full emails, phone numbers, or request bodies
  if (isUnexpected || appError.statusCode >= 500) {
    console.error(
      JSON.stringify({
        requestId,
        route,
        method: req.method,
        errorName: err?.name || appError.name || 'Error',
        message: redactPii(String(err?.message || appError.message || 'Unknown error')),
        stack: formatSafeStack(err?.stack),
        cause: formatSafeCause(err?.cause),
      })
    );

    captureException(
      err,
      {
        requestId,
        route,
        method: req.method,
        userId: (req as any).user?.id,
        tags: { code: appError.code },
      },
      env
    );
  } else {
    logger.warn(appError.message, {
      requestId,
      route,
      method: req.method,
      status: appError.statusCode,
      userId: (req as any).user?.id,
      error: {
        code: appError.code,
        message: err?.message || appError.message,
      },
    });
  }

  res.status(appError.statusCode).json(appError.serialize(requestId));
}
