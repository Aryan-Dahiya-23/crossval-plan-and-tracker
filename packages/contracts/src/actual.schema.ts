import { z } from 'zod';

import { objectIdSchema } from './category.schema.js';
import { MAX_MONEY_MINOR_STRING, moneyMinorStringRegex } from './money.schema.js';
import { monthStringSchema } from './month.schema.js';

/**
 * Validates that an amount string is a non-empty, strictly positive integer
 * in minor currency units (integer cents), not exceeding MAX_MONEY_MINOR_STRING.
 * E.g., "1", "200000". Explicit "0" or negative values are rejected.
 */
export const positiveMoneyMinorRegex = /^[1-9]\d*$/;

export const positiveMoneyMinorStringSchema = z
  .string()
  .regex(
    positiveMoneyMinorRegex,
    'Amount must be a strictly positive integer string in minor units.',
  )
  .refine(
    (val) => {
      if (val.length > MAX_MONEY_MINOR_STRING.length) return false;
      if (val.length < MAX_MONEY_MINOR_STRING.length) return true;
      return val <= MAX_MONEY_MINOR_STRING;
    },
    {
      message: `Amount exceeds the maximum allowed value (${MAX_MONEY_MINOR_STRING} minor units).`,
    },
  )
  .brand<'PositiveMoneyMinorString'>();

export type PositiveMoneyMinorString = z.infer<typeof positiveMoneyMinorStringSchema>;

/**
 * Public Actual expense entry DTO.
 */
export const actualDtoSchema = z.object({
  id: objectIdSchema,
  categoryId: objectIdSchema,
  month: monthStringSchema,
  amountMinor: z.string().regex(moneyMinorStringRegex),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActualDto = z.infer<typeof actualDtoSchema>;

/**
 * Single actual response envelope.
 */
export const actualResponseSchema = z.object({
  data: actualDtoSchema,
});

export type ActualResponse = z.infer<typeof actualResponseSchema>;

/**
 * Pagination metadata envelope for cursor-paginated actuals ledger.
 */
export const actualPaginationMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type ActualPaginationMeta = z.infer<typeof actualPaginationMetaSchema>;

/**
 * Paginated actuals collection response envelope.
 */
export const actualsResponseSchema = z.object({
  data: z.array(actualDtoSchema),
  meta: actualPaginationMetaSchema,
});

export type ActualsResponse = z.infer<typeof actualsResponseSchema>;

/**
 * URL parameter schema for actual endpoints: /v1/actuals/:id
 */
export const actualParamsSchema = z.object({
  id: objectIdSchema,
});

export type ActualParams = z.infer<typeof actualParamsSchema>;

/**
 * Request payload schema for creating an actual expense entry: POST /v1/actuals
 */
export const createActualRequestSchema = z.object({
  categoryId: objectIdSchema,
  month: monthStringSchema,
  amountMinor: positiveMoneyMinorStringSchema,
  note: z.string().trim().max(500, 'Note must not exceed 500 characters.').optional().nullable(),
});

export type CreateActualRequest = z.input<typeof createActualRequestSchema>;

/**
 * Request payload schema for updating an existing actual entry: PATCH /v1/actuals/:id
 */
export const updateActualRequestSchema = z
  .object({
    categoryId: objectIdSchema.optional(),
    month: monthStringSchema.optional(),
    amountMinor: positiveMoneyMinorStringSchema.optional(),
    note: z.string().trim().max(500, 'Note must not exceed 500 characters.').optional().nullable(),
  })
  .refine(
    (data) =>
      data.categoryId !== undefined ||
      data.month !== undefined ||
      data.amountMinor !== undefined ||
      data.note !== undefined,
    {
      message:
        'At least one field (categoryId, month, amountMinor, or note) must be provided for update.',
    },
  );

export type UpdateActualRequest = z.input<typeof updateActualRequestSchema>;

/**
 * Query parameter schema for listing actuals: GET /v1/actuals
 */
export const listActualsQuerySchema = z
  .object({
    month: monthStringSchema.optional(),
    from: monthStringSchema.optional(),
    to: monthStringSchema.optional(),
    categoryId: objectIdSchema.optional(),
    cursor: z.string().optional(),
    limit: z
      .preprocess(
        (val) => {
          if (typeof val === 'string' && val.trim() !== '') {
            const num = Number(val);
            return Number.isInteger(num) ? num : val;
          }
          return val ?? 20;
        },
        z.number().int().min(1, 'Limit must be at least 1.').max(100, 'Limit cannot exceed 100.'),
      )
      .optional()
      .default(20),
  })
  .refine(
    (query) => {
      if (
        (query.from !== undefined && query.to === undefined) ||
        (query.from === undefined && query.to !== undefined)
      ) {
        return false;
      }
      if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
        return false;
      }
      return true;
    },
    {
      message: 'When filtering by range, both "from" and "to" must be provided with from <= to.',
    },
  );

export type ListActualsQuery = z.input<typeof listActualsQuerySchema>;
export type ParsedListActualsQuery = z.infer<typeof listActualsQuerySchema>;
