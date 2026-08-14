import { apiErrorResponseSchema, authResponseSchema } from '@crossval/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { CategoryModel } from '../categories/category.model.js';
import { DEFAULT_CATEGORIES } from './auth.service.js';

describe('Auth Routes Integration', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /v1/auth/signup', () => {
    it('creates a user, sets session cookie, and seeds default categories', async () => {
      const response = await request(app).post('/v1/auth/signup').send({
        email: 'founder@crossval.test',
        password: 'securePassword123!',
      });

      expect(response.status).toBe(201);
      const parsed = authResponseSchema.parse(response.body);
      expect(parsed.data.email).toBe('founder@crossval.test');
      expect(parsed.data.id).toBeDefined();

      // Cookie assertions
      const cookies = response.headers['set-cookie'] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toContain('crossval_session=');
      expect(cookies?.[0]).toContain('HttpOnly');
      expect(cookies?.[0]).toContain('SameSite=Lax');
      expect(cookies?.[0]).toContain('Path=/');

      // Database default categories assertion
      const categories = await CategoryModel.find({ userId: parsed.data.id });
      expect(categories).toHaveLength(5);
      const names = categories.map((c) => c.name);
      for (const defaultCat of DEFAULT_CATEGORIES) {
        expect(names).toContain(defaultCat.name);
      }
    });

    it('rejects duplicate email with 409 EMAIL_ALREADY_EXISTS', async () => {
      await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'duplicate@test.com', password: 'password123' });

      const response = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'duplicate@test.com', password: 'differentPassword123' });

      expect(response.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects case-variant email as duplicate', async () => {
      await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'case@test.com', password: 'password123' });

      const response = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'CASE@TEST.COM', password: 'password123' });

      expect(response.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects invalid email format with 422 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(response.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
      expect(fields['email']).toBeDefined();
    });

    it('rejects password shorter than 8 characters with 422 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'short@test.com', password: 'short' });

      expect(response.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      const fields = (parsed.error.details as { fields: Record<string, string[]> }).fields;
      expect(fields['password']).toBeDefined();
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'user@test.com', password: 'correctPassword123' });
    });

    it('authenticates valid credentials and sets session cookie', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'user@test.com', password: 'correctPassword123' });

      expect(response.status).toBe(200);
      const parsed = authResponseSchema.parse(response.body);
      expect(parsed.data.email).toBe('user@test.com');

      const cookies = response.headers['set-cookie'] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toContain('crossval_session=');
    });

    it('returns generic 401 INVALID_CREDENTIALS for non-existent email', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'unknown@test.com', password: 'correctPassword123' });

      expect(response.status).toBe(401);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('INVALID_CREDENTIALS');
      expect(parsed.error.message).toBe('Invalid email or password.');
    });

    it('returns same generic 401 INVALID_CREDENTIALS for wrong password', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'user@test.com', password: 'wrongPassword' });

      expect(response.status).toBe(401);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('INVALID_CREDENTIALS');
      expect(parsed.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('returns current user profile when valid session cookie is provided', async () => {
      const signupRes = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'me@test.com', password: 'password123' });

      const cookie = signupRes.headers['set-cookie'] as string[] | undefined;
      expect(cookie).toBeDefined();

      const meRes = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', cookie ?? []);

      expect(meRes.status).toBe(200);
      const parsed = authResponseSchema.parse(meRes.body);
      expect(parsed.data.email).toBe('me@test.com');
      expect(parsed.data.id).toBe(signupRes.body.data.id);
    });

    it('returns current user profile when valid Bearer token is provided in Authorization header', async () => {
      const signupRes = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'bearer@test.com', password: 'password123' });

      const cookies = signupRes.headers['set-cookie'];
      const cookieHeader = Array.isArray(cookies) ? cookies[0] : cookies;
      const match =
        typeof cookieHeader === 'string' ? /crossval_session=([^;]+)/.exec(cookieHeader) : null;
      const rawToken = match?.[1];
      expect(rawToken).toBeDefined();

      const meRes = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${rawToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('bearer@test.com');
    });

    it('returns 401 AUTHENTICATION_REQUIRED when no cookie is sent', async () => {
      const response = await request(app).get('/v1/auth/me');

      expect(response.status).toBe(401);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('returns 401 AUTHENTICATION_REQUIRED with invalid or forged cookie', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', ['crossval_session=forged_token_value_12345']);

      expect(response.status).toBe(401);
      const parsed = apiErrorResponseSchema.parse(response.body);
      expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('revokes session, clears cookie, and invalidates subsequent requests', async () => {
      const signupRes = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'logout@test.com', password: 'password123' });

      const cookie = signupRes.headers['set-cookie'] as string[] | undefined;

      // Logout
      const logoutRes = await request(app)
        .post('/v1/auth/logout')
        .set('Cookie', cookie ?? []);

      expect(logoutRes.status).toBe(204);

      // Verify cookie cleared
      const logoutCookies = logoutRes.headers['set-cookie'] as string[] | undefined;
      expect(logoutCookies).toBeDefined();
      expect(logoutCookies?.[0]).toMatch(/crossval_session=;.*Expires=/i);

      // Verify subsequent GET /me with old cookie fails
      const meAfterLogout = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', cookie ?? []);

      expect(meAfterLogout.status).toBe(401);
    });

    it('is idempotent when called without active session', async () => {
      const response = await request(app).post('/v1/auth/logout');
      expect(response.status).toBe(204);
    });
  });

  describe('Security & Data Leakage Protections', () => {
    it('never exposes passwordHash in any response payload', async () => {
      const signupRes = await request(app)
        .post('/v1/auth/signup')
        .send({ email: 'leaktest@test.com', password: 'password123' });

      const cookie = signupRes.headers['set-cookie'] as string[] | undefined;

      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'leaktest@test.com', password: 'password123' });

      const meRes = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', cookie ?? []);

      const allResponses = [signupRes.text, loginRes.text, meRes.text];
      for (const resText of allResponses) {
        expect(resText).not.toContain('passwordHash');
        expect(resText).not.toContain('password_hash');
      }
    });
  });
});
