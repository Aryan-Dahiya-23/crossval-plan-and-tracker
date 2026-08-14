import { z } from 'zod';

export * from './month.schema.js';
export * from './money.schema.js';
export * from './error.schema.js';
export * from './auth.schema.js';
export * from './category.schema.js';
export * from './plan.schema.js';
export * from './actual.schema.js';
export * from './period.schema.js';
export * from './report.schema.js';
export * from './demo.schema.js';

export const healthResponseSchema = z.object({
  service: z.literal('api'),
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readyResponseSchema = z.object({
  service: z.literal('api'),
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['connected', 'disconnected']),
});

export type ReadyResponse = z.infer<typeof readyResponseSchema>;
