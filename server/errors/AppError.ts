/**
 * Standardized HTTP Error System for DUGDHSAR API
 * Provides stable machine-readable codes, semantic HTTP status codes,
 * and leak-proof error responses.
 */

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE';

export interface SerializedError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  requestId: string;
  timestamp: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  public serialize(requestId: string): SerializedError {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters', details?: any) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required. Please sign in.', details?: any) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied. You do not have permission for this resource.', details?: any) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.', details?: any) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A resource conflict occurred. This item may already exist.', details?: any) {
    super(409, 'CONFLICT', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed on the submitted data.', details?: any) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(message = 'Too many requests. Please wait before retrying.', retryAfterSeconds = 60) {
    super(429, 'RATE_LIMITED', message, { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred. Please try again later.', details?: any) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details, false);
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Upstream dependency failed or returned an invalid response.', details?: any) {
    super(502, 'BAD_GATEWAY', message, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable. Please try again shortly.', details?: any) {
    super(503, 'SERVICE_UNAVAILABLE', message, details);
  }
}
