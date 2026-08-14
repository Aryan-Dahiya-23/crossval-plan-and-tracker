import type { ApiErrorDetails, ErrorCode } from '@crossval/contracts';

type ApiClientErrorOptions = {
  status: number;
  code: ErrorCode;
  requestId?: string;
  details?: ApiErrorDetails;
  cause?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly requestId: string | undefined;
  readonly details: ApiErrorDetails | undefined;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
