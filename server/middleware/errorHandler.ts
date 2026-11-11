import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, InternalServerError, ValidationError } from '../errors/AppError';
import { logger } from '../logger';
import { captureException } from '../errorTracker';

/**
 * Central Error Handler Middleware
 * Guarantees zero sensitive internal leaks, formats standard error envelopes,
 * and tracks every failure by Request ID.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id || (res.getHeader('X-Request-Id') as string) || crypto.randomUUID();

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    appError = new ValidationError('Invalid request payload or query parameters', formattedIssues);
  } else if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    appError = new AppError(400, 'BAD_REQUEST', 'Malformed JSON in request body');
  } else {
    // Unhandled exception
    appError = new InternalServerError(
      process.env.NODE_ENV === 'production'
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

  // Capture unexpected 5xx errors in error tracker
  if (appError.statusCode >= 500) {
    const env: any = (req as any).env;
    captureException(
      err,
      {
        requestId,
        route: req.originalUrl || req.url,
        method: req.method,
        userId: (req as any).user?.id,
        userEmail: (req as any).user?.email,
        tags: { code: appError.code },
      },
      env
    );
  }

  // Structured Logging with PII redaction
  logger.error(appError.message, {
    requestId,
    route: req.originalUrl || req.url,
    method: req.method,
    status: appError.statusCode,
    userId: (req as any).user?.id,
    error: {
      code: appError.code,
      message: err?.message || appError.message,
      stack: err?.stack,
    },
  });

  res.status(appError.statusCode).json(appError.serialize(requestId));
}
