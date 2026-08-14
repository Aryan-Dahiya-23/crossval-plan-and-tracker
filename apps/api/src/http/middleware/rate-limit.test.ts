import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { errorHandler } from './error-handler.js';
import { createRateLimiter } from './rate-limit.js';
import { requestIdMiddleware } from './request-id.js';

function createRateLimitTestApp(max = 3): Express {
  const app = express();
  app.use(requestIdMiddleware);

  const limiter = createRateLimiter({
    windowMs: 60 * 1000,
    max,
    message: 'Rate limit exceeded for testing.',
  });

  app.get('/test/limited', limiter, (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}

describe('createRateLimiter middleware', () => {
  it('allows requests within limit and rejects subsequent requests with 429 RATE_LIMITED', async () => {
    const app = createRateLimitTestApp(3);

    // Requests 1, 2, 3 should succeed
    const res1 = await request(app).get('/test/limited');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/test/limited');
    expect(res2.status).toBe(200);

    const res3 = await request(app).get('/test/limited');
    expect(res3.status).toBe(200);

    // Request 4 should be rate limited
    const res4 = await request(app).get('/test/limited');
    expect(res4.status).toBe(429);
    expect(res4.body.error.code).toBe('RATE_LIMITED');
    expect(res4.body.error.message).toBe('Rate limit exceeded for testing.');
  });
});
