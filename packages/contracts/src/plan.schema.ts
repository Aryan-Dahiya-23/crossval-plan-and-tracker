import { z } from 'zod';

import { objectIdSchema } from './category.schema.js';
import { moneyMinorStringSchema } from './money.schema.js';
import { monthStringSchema } from './month.schema.js';

export const planDtoSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  month: monthStringSchema,
  amountMinor: moneyMinorStringSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlanDto = z.infer<typeof planDtoSchema>;

export const planResponseSchema = z.object({
  data: planDtoSchema,
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

export const plansResponseSchema = z.object({
  data: z.array(planDtoSchema),
});

export type PlansResponse = z.infer<typeof plansResponseSchema>;

export const putPlanParamsSchema = z.object({
  categoryId: objectIdSchema,
  month: monthStringSchema,
});

export type PutPlanParams = z.input<typeof putPlanParamsSchema>;

export const putPlanRequestSchema = z.object({
  amountMinor: moneyMinorStringSchema,
});

export type PutPlanRequest = z.input<typeof putPlanRequestSchema>;

export const deletePlanParamsSchema = putPlanParamsSchema;

export type DeletePlanParams = z.input<typeof deletePlanParamsSchema>;

export const listPlansQuerySchema = z
  .object({
    from: monthStringSchema,
    to: monthStringSchema,
    categoryId: objectIdSchema.optional(),
  })
  .refine((data) => data.from <= data.to, {
    message: 'Start month (from) must be less than or equal to end month (to).',
    path: ['from'],
  });

export type ListPlansQuery = z.input<typeof listPlansQuerySchema>;

export const batchPlanParamsSchema = z.object({
  month: monthStringSchema,
});

export type BatchPlanParams = z.input<typeof batchPlanParamsSchema>;

export const batchPlanChangeSchema = z.object({
  categoryId: objectIdSchema,
  amountMinor: moneyMinorStringSchema.nullable(),
});

export type BatchPlanChange = z.input<typeof batchPlanChangeSchema>;

export const batchPlanRequestSchema = z.object({
  changes: z
    .array(batchPlanChangeSchema)
    .min(1, 'At least one category change must be provided.')
    .refine(
      (changes) => {
        const categoryIds = new Set<string>();
        for (const item of changes) {
          if (categoryIds.has(item.categoryId)) {
            return false;
          }
          categoryIds.add(item.categoryId);
        }
        return true;
      },
      {
        message: 'Duplicate categoryId found in batch changes.',
        path: ['changes'],
      },
    ),
});

export type BatchPlanRequest = z.input<typeof batchPlanRequestSchema>;
