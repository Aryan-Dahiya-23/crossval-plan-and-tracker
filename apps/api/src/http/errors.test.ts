import { describe, expect, it } from 'vitest';

import {
  AppError,
  AuthenticationRequiredError,
  CategoryAlreadyExistsError,
  CategoryArchivedError,
  ConflictError,
  EmailAlreadyExistsError,
  InternalError,
  InvalidCredentialsError,
  NotFoundError,
  PeriodAlreadyLockedError,
  PeriodLockedError,
  RateLimitedError,
  SampleDataNotAvailableError,
  ValidationError,
} from './errors.js';

describe('AppError hierarchy and serialization', () => {
  it('ValidationError serializes with status 422, fields details, and requestId', () => {
    const error = new ValidationError('Invalid amount', {
      amountMinor: ['Amount must be greater than zero.'],
    });

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');

    const response = error.toResponse('req_test_123');
    expect(response).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid amount',
        details: {
          fields: {
            amountMinor: ['Amount must be greater than zero.'],
          },
        },
        requestId: 'req_test_123',
      },
    });
  });

  it('AuthenticationRequiredError serializes with 401', () => {
    const error = new AuthenticationRequiredError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(error.toResponse('req_auth')).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource.',
        requestId: 'req_auth',
      },
    });
  });

  it('InvalidCredentialsError serializes with 401', () => {
    const error = new InvalidCredentialsError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });

  it('NotFoundError serializes with 404', () => {
    const error = new NotFoundError('Category not found.');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.toResponse('req_404')).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Category not found.',
        requestId: 'req_404',
      },
    });
  });

  it('ConflictError family serializes with 409', () => {
    const errors = [
      new ConflictError(),
      new EmailAlreadyExistsError(),
      new CategoryAlreadyExistsError(),
      new CategoryArchivedError(),
      new PeriodLockedError(),
      new PeriodAlreadyLockedError(),
      new SampleDataNotAvailableError(),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(409);
      expect(typeof err.code).toBe('string');
      expect(err.toResponse('req_409').error.requestId).toBe('req_409');
    }
  });

  it('RateLimitedError serializes with 429', () => {
    const error = new RateLimitedError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMITED');
  });

  it('InternalError serializes with 500', () => {
    const error = new InternalError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.toResponse('req_500')).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred.',
        requestId: 'req_500',
      },
    });
  });
});
