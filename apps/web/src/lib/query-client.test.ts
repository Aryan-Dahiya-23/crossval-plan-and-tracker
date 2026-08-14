import { describe, expect, it } from 'vitest';

import { ApiClientError } from './api-client';
import { shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it('never retries authentication failures', () => {
    const error = new ApiClientError('Authentication required.', {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    });

    expect(shouldRetryQuery(0, error)).toBe(false);
  });

  it('does not retry other client errors', () => {
    const error = new ApiClientError('Invalid request.', {
      status: 422,
      code: 'VALIDATION_ERROR',
    });

    expect(shouldRetryQuery(0, error)).toBe(false);
  });

  it('allows one retry for transient failures', () => {
    const error = new ApiClientError('Unavailable.', {
      status: 503,
      code: 'INTERNAL_ERROR',
    });

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(false);
  });
});
