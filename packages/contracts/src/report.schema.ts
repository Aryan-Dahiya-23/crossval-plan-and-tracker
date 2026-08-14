import { z } from 'zod';

import { objectIdSchema } from './category.schema.js';
import { moneyMinorStringSchema, signedMoneyMinorStringSchema } from './money.schema.js';
import { monthStringSchema } from './month.schema.js';

export const reportRangeDtoSchema = z.object({
  from: monthStringSchema,
  to: monthStringSchema,
});

export type ReportRangeDto = z.infer<typeof reportRangeDtoSchema>;

export const reportSummaryDtoSchema = z.object({
  planMinor: moneyMinorStringSchema,
  actualMinor: moneyMinorStringSchema,
  varianceMinor: signedMoneyMinorStringSchema,
  variancePercent: z.string().nullable(),
  overPlanCategoryCount: z.number().int().nonnegative(),
});

export type ReportSummaryDto = z.infer<typeof reportSummaryDtoSchema>;

export const reportMonthlySeriesItemDtoSchema = z.object({
  month: monthStringSchema,
  planMinor: moneyMinorStringSchema,
  actualMinor: moneyMinorStringSchema,
  varianceMinor: signedMoneyMinorStringSchema,
  locked: z.boolean(),
});

export type ReportMonthlySeriesItemDto = z.infer<typeof reportMonthlySeriesItemDtoSchema>;

export const reportCategoryMonthItemDtoSchema = z.object({
  month: monthStringSchema,
  hasPlan: z.boolean(),
  planMinor: moneyMinorStringSchema,
  actualMinor: moneyMinorStringSchema,
  varianceMinor: signedMoneyMinorStringSchema,
  variancePercent: z.string().nullable(),
  actualEntryCount: z.number().int().nonnegative(),
  locked: z.boolean(),
});

export type ReportCategoryMonthItemDto = z.infer<typeof reportCategoryMonthItemDtoSchema>;

export const reportCategorySubtotalDtoSchema = z.object({
  planMinor: moneyMinorStringSchema,
  actualMinor: moneyMinorStringSchema,
  varianceMinor: signedMoneyMinorStringSchema,
  variancePercent: z.string().nullable(),
});

export type ReportCategorySubtotalDto = z.infer<typeof reportCategorySubtotalDtoSchema>;

export const reportCategoryInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorKey: z.string(),
});

export type ReportCategoryInfo = z.infer<typeof reportCategoryInfoSchema>;

export const reportCategoryItemDtoSchema = z.object({
  category: reportCategoryInfoSchema,
  subtotal: reportCategorySubtotalDtoSchema,
  months: z.array(reportCategoryMonthItemDtoSchema),
});

export type ReportCategoryItemDto = z.infer<typeof reportCategoryItemDtoSchema>;

export const reportDtoSchema = z.object({
  range: reportRangeDtoSchema,
  summary: reportSummaryDtoSchema,
  monthlySeries: z.array(reportMonthlySeriesItemDtoSchema),
  categories: z.array(reportCategoryItemDtoSchema),
});

export type ReportDto = z.infer<typeof reportDtoSchema>;

export const reportResponseSchema = z.object({
  data: reportDtoSchema,
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const getReportQuerySchema = z
  .object({
    from: monthStringSchema,
    to: monthStringSchema,
    categoryId: z
      .union([
        objectIdSchema,
        z.array(objectIdSchema),
        z.string().transform((val) => val.split(',').map((id) => id.trim())),
      ])
      .optional(),
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

export type GetReportQuery = z.input<typeof getReportQuerySchema>;
export type ParsedGetReportQuery = z.infer<typeof getReportQuerySchema>;
