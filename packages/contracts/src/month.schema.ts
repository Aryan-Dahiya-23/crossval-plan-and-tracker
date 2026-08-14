import { z } from 'zod';

export const monthStringRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthStringSchema = z
  .string()
  .regex(monthStringRegex, 'Month must be in YYYY-MM format between 01 and 12.')
  .brand<'MonthString'>();

export type MonthString = z.infer<typeof monthStringSchema>;

export const monthRangeSchema = z
  .object({
    from: monthStringSchema,
    to: monthStringSchema,
  })
  .refine((range) => range.from <= range.to, {
    message: 'Start month (from) must be less than or equal to end month (to).',
    path: ['from'],
  });

export type MonthRange = z.infer<typeof monthRangeSchema>;
