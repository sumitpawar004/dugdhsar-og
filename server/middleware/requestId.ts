import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

/**
 * Middleware: Attaches a unique correlation ID and high-resolution timer to each request.
 * Sets X-Request-Id response header for end-to-end tracing without heavy APM dependencies.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(incomingId)
    ? incomingId
    : crypto.randomUUID();

  req.id = requestId;
  req.startTime = performance.now();

  res.setHeader('X-Request-Id', requestId);
  next();
}
