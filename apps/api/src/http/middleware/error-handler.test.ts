import { apiErrorResponseSchema } from '@crossval/contracts';
import express, { type Express } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { NotFoundError, PeriodLockedError } from '../errors.js';
import { errorHandler } from './error-handler.js';
import { requestIdMiddleware } from './request-id.js';

function createErrorTestApp(): Express {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());

  app.get('/test/app-error', () => {
    throw new PeriodLockedError('Target month is locked.');
  });

  app.get('/test/not-found', () => {
    throw new NotFoundError('Category not found.');
  });

  app.get('/test/zod-error', () => {
    const schema = z.object({
      amountMinor: z.string().regex(/^\d+$/),
      email: z.string().email(),
    });
    schema.parse({ amountMinor: 'invalid', email: 'not-an-email' });
  });

  app.get('/test/mongoose-cast-error', () => {
    throw new mongoose.Error.CastError('ObjectId', 'invalid-id', 'categoryId');
  });

  app.get('/test/mongo-duplicate-error', () => {
    const error = new Error('E11000 duplicate key error');
    Object.assign(error, { code: 11000 });
    throw error;
  });

  app.get('/test/unknown-error', () => {
    throw new Error('Database connection secret password leaked in internal error');
  });

  app.use(errorHandler);

  return app;
}

describe('errorHandler middleware', () => {
  const app = createErrorTestApp();

  it('handles domain AppError with correct status, code, and requestId', async () => {
    const response = await request(app).get('/test/app-error');

    expect(response.status).toBe(409);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-request-id']).toBeDefined();

    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('PERIOD_LOCKED');
    expect(parsed.error.message).toBe('Target month is locked.');
    expect(parsed.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('handles NotFoundError with 404', async () => {
    const response = await request(app).get('/test/not-found');

    expect(response.status).toBe(404);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('NOT_FOUND');
    expect(parsed.error.message).toBe('Category not found.');
  });

  it('handles ZodError by formatting field-level validation errors into 422 VALIDATION_ERROR', async () => {
    const response = await request(app).get('/test/zod-error');

    expect(response.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');
    expect(parsed.error.details).toBeDefined();

    const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
    expect(fields['amountMinor']).toBeDefined();
    expect(fields['email']).toBeDefined();
  });

  it('sanitizes Mongoose CastError and returns 422 VALIDATION_ERROR', async () => {
    const response = await request(app).get('/test/mongoose-cast-error');

    expect(response.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');
    expect(parsed.error.message).toContain('categoryId');
  });

  it('maps MongoDB duplicate key (11000) errors to 409 CONFLICT', async () => {
    const response = await request(app).get('/test/mongo-duplicate-error');

    expect(response.status).toBe(409);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('CONFLICT');
  });

  it('sanitizes unknown errors and returns 500 INTERNAL_ERROR without leaking internals', async () => {
    const response = await request(app).get('/test/unknown-error');

    expect(response.status).toBe(500);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('INTERNAL_ERROR');
    expect(parsed.error.message).toBe('An unexpected internal server error occurred.');
    expect(JSON.stringify(response.body)).not.toContain('secret password');
  });
});
