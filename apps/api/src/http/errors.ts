import type { ApiErrorDetails, ApiErrorResponse, ErrorCode } from '@crossval/contracts';

/**
 * Base abstract application error class.
 * All domain, validation, and HTTP errors extend this class.
 */
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: ErrorCode;
  public readonly details: ApiErrorDetails | undefined;

  constructor(message: string, details?: ApiErrorDetails | undefined) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toResponse(requestId: string): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
        requestId,
      },
    };
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 422;
  public readonly code: ErrorCode = 'VALIDATION_ERROR';

  constructor(
    message = 'The request payload is invalid.',
    fields?: Record<string, string[]> | undefined,
  ) {
    super(message, fields ? { fields } : undefined);
  }
}

export class AuthenticationRequiredError extends AppError {
  public readonly statusCode = 401;
  public readonly code: ErrorCode = 'AUTHENTICATION_REQUIRED';

  constructor(message = 'Authentication is required to access this resource.') {
    super(message);
  }
}

export class InvalidCredentialsError extends AppError {
  public readonly statusCode = 401;
  public readonly code: ErrorCode = 'INVALID_CREDENTIALS';

  constructor(message = 'Invalid email or password.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code: ErrorCode = 'NOT_FOUND';

  constructor(message = 'The requested resource was not found.') {
    super(message);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'CONFLICT';

  constructor(message = 'A conflict occurred with the current resource state.') {
    super(message);
  }
}

export class EmailAlreadyExistsError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'EMAIL_ALREADY_EXISTS';

  constructor(message = 'An account with this email address already exists.') {
    super(message);
  }
}

export class CategoryAlreadyExistsError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'CATEGORY_ALREADY_EXISTS';

  constructor(message = 'A category with this name already exists.') {
    super(message);
  }
}

export class CategoryArchivedError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'CATEGORY_ARCHIVED';

  constructor(message = 'Cannot modify or create records for an archived category.') {
    super(message);
  }
}

export class PeriodLockedError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'PERIOD_LOCKED';

  constructor(message = 'The financial period for this month is locked and cannot be modified.') {
    super(message);
  }
}

export class PeriodAlreadyLockedError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'PERIOD_ALREADY_LOCKED';

  constructor(message = 'This financial period has already been locked.') {
    super(message);
  }
}

export class SampleDataNotAvailableError extends AppError {
  public readonly statusCode = 409;
  public readonly code: ErrorCode = 'SAMPLE_DATA_NOT_AVAILABLE';

  constructor(
    message = 'Sample data cannot be loaded because one or more target periods are locked.',
  ) {
    super(message);
  }
}

export class RateLimitedError extends AppError {
  public readonly statusCode = 429;
  public readonly code: ErrorCode = 'RATE_LIMITED';

  constructor(message = 'Too many requests. Please try again later.') {
    super(message);
  }
}

export class InternalError extends AppError {
  public readonly statusCode = 500;
  public readonly code: ErrorCode = 'INTERNAL_ERROR';

  constructor(message = 'An unexpected internal error occurred.') {
    super(message);
  }
}
