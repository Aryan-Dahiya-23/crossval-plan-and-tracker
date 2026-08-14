import { apiErrorResponseSchema } from '@crossval/contracts';
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from './error-handler.js';
import { requestIdMiddleware } from './request-id.js';
import { validate } from './validate.js';

function createValidationTestApp(): Express {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());

  app.post(
    '/test/categories',
    validate({
      body: z.object({
        name: z.string().min(1, 'Category name is required.'),
      }),
    }),
    (req, res) => {
      res.status(201).json({ data: req.body });
    },
  );

  app.get(
    '/test/items/:id',
    validate({
      params: z.object({
        id: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid ID format.'),
      }),
      query: z.object({
        limit: z.coerce.number().int().min(1).max(50).default(10),
      }),
    }),
    (req, res) => {
      res.status(200).json({ data: { params: req.params, query: req.query } });
    },
  );

  app.use(errorHandler);

  return app;
}

describe('validate middleware', () => {
  const app = createValidationTestApp();

  it('passes valid request body and returns parsed data', async () => {
    const response = await request(app).post('/test/categories').send({ name: 'Engineering' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { name: 'Engineering' },
    });
  });

  it('rejects invalid request body with 422 VALIDATION_ERROR and field details', async () => {
    const response = await request(app).post('/test/categories').send({ name: '' });

    expect(response.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');
    expect(parsed.error.details).toBeDefined();

    const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
    expect(fields['name']).toBeDefined();
    expect(fields['name']?.[0]).toContain('Category name is required.');
  });

  it('passes valid params and query with coercion', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/test/items/${validId}?limit=25`);

    expect(response.status).toBe(200);
    expect(response.body.data.params.id).toBe(validId);
    expect(response.body.data.query.limit).toBe(25);
  });

  it('rejects invalid params with 422 VALIDATION_ERROR', async () => {
    const response = await request(app).get('/test/items/not-a-valid-id?limit=25');

    expect(response.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');

    const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
    expect(fields['id']).toBeDefined();
  });

  it('rejects invalid query string parameter', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/test/items/${validId}?limit=999`);

    expect(response.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(response.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');

    const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
    expect(fields['limit']).toBeDefined();
  });
});
