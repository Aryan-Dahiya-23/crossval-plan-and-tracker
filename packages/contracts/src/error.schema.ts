import { z } from 'zod';

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'AUTHENTICATION_REQUIRED',
  'INVALID_CREDENTIALS',
  'EMAIL_ALREADY_EXISTS',
  'NOT_FOUND',
  'CATEGORY_ALREADY_EXISTS',
  'CATEGORY_ARCHIVED',
  'PERIOD_ALREADY_LOCKED',
  'PERIOD_LOCKED',
  'SAMPLE_DATA_NOT_AVAILABLE',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const apiErrorDetailsSchema = z.record(z.string(), z.unknown());

export type ApiErrorDetails = z.infer<typeof apiErrorDetailsSchema>;

export const apiErrorBodySchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: apiErrorDetailsSchema.optional(),
  requestId: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export const apiErrorResponseSchema = z.object({
  error: apiErrorBodySchema,
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
