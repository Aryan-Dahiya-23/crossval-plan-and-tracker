import { z } from 'zod';

import { objectIdSchema } from './category.schema.js';
import { monthStringSchema } from './month.schema.js';

export const financialPeriodStatusSchema = z.enum(['OPEN', 'LOCKED']);
export type FinancialPeriodStatus = z.infer<typeof financialPeriodStatusSchema>;

/**
 * Public Financial Period DTO.
 * id, createdAt, and updatedAt are nullable because uncoordinated months return an implicit OPEN period.
 */
export const financialPeriodDtoSchema = z.object({
  id: objectIdSchema.nullable(),
  month: monthStringSchema,
  status: financialPeriodStatusSchema,
  lockedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
});

export type FinancialPeriodDto = z.infer<typeof financialPeriodDtoSchema>;

/**
 * Single financial period response envelope.
 */
export const financialPeriodResponseSchema = z.object({
  data: financialPeriodDtoSchema,
});

export type FinancialPeriodResponse = z.infer<typeof financialPeriodResponseSchema>;

/**
 * Multiple financial periods response envelope.
 */
export const financialPeriodsResponseSchema = z.object({
  data: z.array(financialPeriodDtoSchema),
});

export type FinancialPeriodsResponse = z.infer<typeof financialPeriodsResponseSchema>;

/**
 * URL parameter schema for locking a month: POST /v1/periods/:month/lock
 * and querying a single month: GET /v1/periods/:month
 */
export const lockPeriodParamsSchema = z.object({
  month: monthStringSchema,
});

export type LockPeriodParams = z.infer<typeof lockPeriodParamsSchema>;

/**
 * Query parameter schema for listing periods within a range: GET /v1/periods
 */
export const listPeriodsQuerySchema = z
  .object({
    from: monthStringSchema,
    to: monthStringSchema,
  })
  .refine(
    (query) => {
      if (query.from > query.to) {
        return false;
      }
      return true;
    },
    {
      message: 'Start month "from" cannot be greater than end month "to".',
    },
  );

export type ListPeriodsQuery = z.input<typeof listPeriodsQuerySchema>;
export type ParsedListPeriodsQuery = z.infer<typeof listPeriodsQuerySchema>;
