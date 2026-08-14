import {
  apiErrorResponseSchema,
  categoriesResponseSchema,
  categoryResponseSchema,
} from '@crossval/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { DEFAULT_CATEGORIES } from '../auth/auth.service.js';
import { createSession } from '../auth/session.service.js';
import { UserModel } from '../users/user.model.js';
import { CategoryModel } from './category.model.js';

describe('Categories Routes Integration', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let user1Cookie: string[];
  let user2Cookie: string[];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Setup User 1 with seeded categories & session
    const user1 = await UserModel.create({
      email: 'user1@categories.test',
      emailCanonical: 'user1@categories.test',
      passwordHash: 'test-hash-1',
    });
    for (const cat of DEFAULT_CATEGORIES) {
      await CategoryModel.create({
        userId: user1._id,
        name: cat.name,
        nameCanonical: cat.name.toLowerCase(),
        colorKey: cat.colorKey,
        archivedAt: null,
      });
    }
    const session1 = await createSession(user1._id);
    user1Cookie = [`crossval_session=${session1.token}; Path=/; HttpOnly`];

    // Setup User 2 with seeded categories & session
    const user2 = await UserModel.create({
      email: 'user2@categories.test',
      emailCanonical: 'user2@categories.test',
      passwordHash: 'test-hash-2',
    });
    for (const cat of DEFAULT_CATEGORIES) {
      await CategoryModel.create({
        userId: user2._id,
        name: cat.name,
        nameCanonical: cat.name.toLowerCase(),
        colorKey: cat.colorKey,
        archivedAt: null,
      });
    }
    const session2 = await createSession(user2._id);
    user2Cookie = [`crossval_session=${session2.token}; Path=/; HttpOnly`];
  });

  describe('GET /v1/categories', () => {
    it('returns default seeded categories for the authenticated user sorted alphabetically', async () => {
      const res = await request(app).get('/v1/categories').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = categoriesResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(5);

      const names = parsed.data.map((c) => c.name);
      expect(names).toEqual(['Marketing', 'Office', 'Payroll', 'Software', 'Travel']);
    });

    it('filters out archived categories by default', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Old Cloud Hosting' });

      const categoryId = createRes.body.data.id;

      await request(app).post(`/v1/categories/${categoryId}/archive`).set('Cookie', user1Cookie);

      const defaultRes = await request(app).get('/v1/categories').set('Cookie', user1Cookie);

      expect(defaultRes.status).toBe(200);
      const activeCategories = defaultRes.body.data;
      expect(activeCategories.find((c: { id: string }) => c.id === categoryId)).toBeUndefined();
    });

    it('returns all categories including archived when ?includeArchived=true', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Archived Equipment' });

      const categoryId = createRes.body.data.id;

      await request(app).post(`/v1/categories/${categoryId}/archive`).set('Cookie', user1Cookie);

      const allRes = await request(app)
        .get('/v1/categories?includeArchived=true')
        .set('Cookie', user1Cookie);

      expect(allRes.status).toBe(200);
      const allCategories = allRes.body.data;
      const found = allCategories.find((c: { id: string }) => c.id === categoryId);
      expect(found).toBeDefined();
      expect(found.archivedAt).not.toBeNull();
    });
  });

  describe('POST /v1/categories', () => {
    it('creates a new category and returns 201 Created', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Legal & Accounting', colorKey: 'indigo' });

      expect(res.status).toBe(201);
      const parsed = categoryResponseSchema.parse(res.body);
      expect(parsed.data.name).toBe('Legal & Accounting');
      expect(parsed.data.colorKey).toBe('indigo');
      expect(parsed.data.archivedAt).toBeNull();
      expect(parsed.data.id).toBeDefined();
    });

    it('rejects duplicate category name with 409 CATEGORY_ALREADY_EXISTS', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Marketing' }); // Already seeded

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('rejects case-insensitive duplicate with 409 CATEGORY_ALREADY_EXISTS', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'marketing' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('allows different users to have categories with the exact same name', async () => {
      const user1Res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Consulting' });

      const user2Res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user2Cookie)
        .send({ name: 'Consulting' });

      expect(user1Res.status).toBe(201);
      expect(user2Res.status).toBe(201);
      expect(user1Res.body.data.id).not.toBe(user2Res.body.data.id);
    });

    it('rejects invalid payload with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: '' });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/categories/:id', () => {
    it('retrieves an owned category by ID', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Hosting', colorKey: 'teal' });

      const categoryId = createRes.body.data.id;

      const res = await request(app).get(`/v1/categories/${categoryId}`).set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = categoryResponseSchema.parse(res.body);
      expect(parsed.data.id).toBe(categoryId);
      expect(parsed.data.name).toBe('Hosting');
    });

    it('returns 404 NOT_FOUND for category owned by another user', async () => {
      const user2Create = await request(app)
        .post('/v1/categories')
        .set('Cookie', user2Cookie)
        .send({ name: 'User 2 Secret Category' });

      const user2CategoryId = user2Create.body.data.id;

      // User 1 tries to access User 2's category
      const res = await request(app)
        .get(`/v1/categories/${user2CategoryId}`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 VALIDATION_ERROR for malformed ObjectId format', async () => {
      const res = await request(app)
        .get('/v1/categories/invalid-id-format')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /v1/categories/:id', () => {
    it('updates category name and colorKey', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Dev Ops', colorKey: 'blue' });

      const categoryId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', user1Cookie)
        .send({ name: 'Infrastructure & DevOps', colorKey: 'cyan' });

      expect(res.status).toBe(200);
      const parsed = categoryResponseSchema.parse(res.body);
      expect(parsed.data.name).toBe('Infrastructure & DevOps');
      expect(parsed.data.colorKey).toBe('cyan');
    });

    it('rejects rename colliding with another category with 409 CATEGORY_ALREADY_EXISTS', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Unique Category' });

      const categoryId = createRes.body.data.id;

      // Attempt to rename to 'Marketing' which already exists
      const res = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', user1Cookie)
        .send({ name: 'marketing' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('returns 404 NOT_FOUND when updating another user category', async () => {
      const user2Create = await request(app)
        .post('/v1/categories')
        .set('Cookie', user2Cookie)
        .send({ name: 'User 2 Category' });

      const user2CategoryId = user2Create.body.data.id;

      const res = await request(app)
        .patch(`/v1/categories/${user2CategoryId}`)
        .set('Cookie', user1Cookie)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
    });

    it('returns 422 VALIDATION_ERROR when sending empty update body', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Some Category' });

      const categoryId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', user1Cookie)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('POST /v1/categories/:id/archive', () => {
    it('archives an active category and sets archivedAt', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'Deprecated Tools' });

      const categoryId = createRes.body.data.id;

      const res = await request(app)
        .post(`/v1/categories/${categoryId}/archive`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = categoryResponseSchema.parse(res.body);
      expect(parsed.data.archivedAt).not.toBeNull();
    });

    it('is idempotent when archiving an already-archived category', async () => {
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', user1Cookie)
        .send({ name: 'To Archive' });

      const categoryId = createRes.body.data.id;

      const res1 = await request(app)
        .post(`/v1/categories/${categoryId}/archive`)
        .set('Cookie', user1Cookie);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(`/v1/categories/${categoryId}/archive`)
        .set('Cookie', user1Cookie);
      expect(res2.status).toBe(200);
      expect(res2.body.data.archivedAt).toBe(res1.body.data.archivedAt);
    });

    it('returns 404 NOT_FOUND when archiving another user category', async () => {
      const user2Create = await request(app)
        .post('/v1/categories')
        .set('Cookie', user2Cookie)
        .send({ name: 'User 2 Target' });

      const user2CategoryId = user2Create.body.data.id;

      const res = await request(app)
        .post(`/v1/categories/${user2CategoryId}/archive`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('Authentication Guards', () => {
    it('returns 401 AUTHENTICATION_REQUIRED for unauthenticated category requests', async () => {
      const res1 = await request(app).get('/v1/categories');
      expect(res1.status).toBe(401);

      const res2 = await request(app).post('/v1/categories').send({ name: 'No Auth Cat' });
      expect(res2.status).toBe(401);

      const res3 = await request(app).get('/v1/categories/507f1f77bcf86cd799439011');
      expect(res3.status).toBe(401);

      const res4 = await request(app)
        .patch('/v1/categories/507f1f77bcf86cd799439011')
        .send({ name: 'Renamed' });
      expect(res4.status).toBe(401);

      const res5 = await request(app).post('/v1/categories/507f1f77bcf86cd799439011/archive');
      expect(res5.status).toBe(401);
    });
  });
});
