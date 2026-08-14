import {
  apiErrorResponseSchema,
  healthResponseSchema,
  readyResponseSchema,
} from '@crossval/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { disconnectDatabase } from './database/connection.js';
import { setupTestDatabase, teardownTestDatabase } from './test/database-helper.js';

describe('Express API Shell Integration', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000', 'https://crossval-tracker.example.com'],
  });

  describe('GET /health/live (Liveness Probe)', () => {
    it('returns 200 OK without requiring database connectivity', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      const parsed = healthResponseSchema.parse(response.body);
      expect(parsed).toEqual({
        service: 'api',
        status: 'ok',
      });
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('GET /health/ready (Readiness Probe)', () => {
    it('returns 503 degraded when database is disconnected', async () => {
      await disconnectDatabase();

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      const parsed = readyResponseSchema.parse(response.body);
      expect(parsed).toEqual({
        service: 'api',
        status: 'degraded',
        database: 'disconnected',
      });
    });

    describe('when connected to database', () => {
      beforeAll(async () => {
        await setupTestDatabase();
      });

      afterAll(async () => {
        await teardownTestDatabase();
      });

      it('returns 200 OK when database is connected', async () => {
        const response = await request(app).get('/health/ready');

        expect(response.status).toBe(200);
        const parsed = readyResponseSchema.parse(response.body);
        expect(parsed).toEqual({
          service: 'api',
          status: 'ok',
          database: 'connected',
        });
      });
    });
  });

  describe('Security Headers and Fingerprinting', () => {
    it('sets standard security headers on all responses', async () => {
      const response = await request(app).get('/health/live');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Request ID Tracing', () => {
    it('generates a new request ID if none provided', async () => {
      const response = await request(app).get('/health/live');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^req_[a-zA-Z0-9]+$/);
    });

    it('propagates upstream X-Request-Id header when valid', async () => {
      const upstreamId = 'custom-trace-uuid-12345';
      const response = await request(app).get('/health/live').set('X-Request-Id', upstreamId);

      expect(response.headers['x-request-id']).toBe(upstreamId);
    });
  });

  describe('CORS Handling', () => {
    it('allows preflight OPTIONS from configured origin with credentials', async () => {
      const response = await request(app)
        .options('/health/live')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('does not reflect disallowed origins', async () => {
      const response = await request(app)
        .options('/health/live')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('404 Not Found Handling', () => {
    it('returns structured 404 error for unknown routes', async () => {
      const response = await request(app).get('/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.headers['cache-control']).toBe('no-store');

      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
      expect(parsed.error.message).toContain('not found');
      expect(parsed.error.requestId).toBe(response.headers['x-request-id']);
    });
  });

  describe('JSON Body Limit and Malformed Input Handling', () => {
    it('handles malformed JSON body with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/v1/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(response.status).toBe(400);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.message).toContain('Malformed JSON');
    });

    it('rejects payloads exceeding the 100kb limit', async () => {
      const largePayload = { data: 'x'.repeat(120 * 1024) }; // ~120kb

      const response = await request(app).post('/v1/test').send(largePayload);

      expect(response.status).toBe(413);
    });
  });
});
