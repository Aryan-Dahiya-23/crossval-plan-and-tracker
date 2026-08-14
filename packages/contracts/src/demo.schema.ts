import { z } from 'zod';

import { reportRangeDtoSchema } from './report.schema.js';

export const loadDemoSampleDataDtoSchema = z.object({
  plansCreated: z.number().int().nonnegative(),
  actualsCreated: z.number().int().nonnegative(),
  range: reportRangeDtoSchema,
});

export type LoadDemoSampleDataDto = z.infer<typeof loadDemoSampleDataDtoSchema>;

export const loadDemoSampleResponseSchema = z.object({
  data: loadDemoSampleDataDtoSchema,
});

export type LoadDemoSampleResponse = z.infer<typeof loadDemoSampleResponseSchema>;
