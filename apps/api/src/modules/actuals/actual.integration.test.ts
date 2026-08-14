import {
  actualResponseSchema,
  actualsResponseSchema,
  apiErrorResponseSchema,
} from '@crossval/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { createSession } from '../auth/session.service.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { UserModel } from '../users/user.model.js';
import { ActualModel } from './actual.model.js';

describe('Actuals Routes Integration', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let user1Cookie: string[];
  let user2Cookie: string[];
  let user1Id: string;

  let catId1: string;
  let catId2: string;
  let archivedCatId: string;
  let user2CatId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // User 1 Setup
    const user1 = await UserModel.create({
      email: 'user1@actuals.test',
      emailCanonical: 'user1@actuals.test',
      passwordHash: 'hash-1',
    });
    user1Id = user1._id.toString();
    const session1 = await createSession(user1._id);
    user1Cookie = [`crossval_session=${session1.token}; Path=/; HttpOnly`];

    const c1 = await CategoryModel.create({
      userId: user1._id,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    catId1 = c1._id.toString();

    const c2 = await CategoryModel.create({
      userId: user1._id,
      name: 'Engineering',
      nameCanonical: 'engineering',
      colorKey: 'blue',
      archivedAt: null,
    });
    catId2 = c2._id.toString();

    const cArchived = await CategoryModel.create({
      userId: user1._id,
      name: 'Archived Equipment',
      nameCanonical: 'archived equipment',
      colorKey: 'gray',
      archivedAt: new Date(),
    });
    archivedCatId = cArchived._id.toString();

    // User 2 Setup
    const user2 = await UserModel.create({
      email: 'user2@actuals.test',
      emailCanonical: 'user2@actuals.test',
      passwordHash: 'hash-2',
    });
    const session2 = await createSession(user2._id);
    user2Cookie = [`crossval_session=${session2.token}; Path=/; HttpOnly`];

    const user2Cat = await CategoryModel.create({
      userId: user2._id,
      name: 'Secret Category',
      nameCanonical: 'secret category',
      colorKey: 'green',
      archivedAt: null,
    });
    user2CatId = user2Cat._id.toString();
  });

  describe('POST /v1/actuals', () => {
    it('creates an actual expense entry with 201 Created and valid schema', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '200000',
        note: 'Q1 Google Ads',
      });

      expect(res.status).toBe(201);
      const parsed = actualResponseSchema.parse(res.body);
      expect(parsed.data.categoryId).toBe(catId1);
      expect(parsed.data.month).toBe('2026-01');
      expect(parsed.data.amountMinor).toBe('200000');
      expect(parsed.data.note).toBe('Q1 Google Ads');

      const inDb = await ActualModel.findById(parsed.data.id);
      expect(inDb).not.toBeNull();
      expect(inDb?.amountMinor).toBe(200000n);
    });

    it('allows multiple actual entries for same category and month', async () => {
      const res1 = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '200000',
        note: 'Google Ads',
      });
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '100000',
        note: 'LinkedIn Ads',
      });
      expect(res2.status).toBe(201);

      expect(res1.body.data.id).not.toBe(res2.body.data.id);

      const all = await ActualModel.find({ userId: user1Id, categoryId: catId1, monthKey: 202601 });
      expect(all).toHaveLength(2);
    });

    it('rejects explicit zero amount "0" with 422 VALIDATION_ERROR', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '0',
      });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects negative amount with 422 VALIDATION_ERROR', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '-500',
      });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects note longer than 500 characters with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({
          categoryId: catId1,
          month: '2026-01',
          amountMinor: '10000',
          note: 'x'.repeat(501),
        });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects creation for archived category with 409 CATEGORY_ARCHIVED', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: archivedCatId,
        month: '2026-01',
        amountMinor: '100000',
      });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ARCHIVED');
    });

    it('rejects creation for unowned category with 404 NOT_FOUND', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: user2CatId,
        month: '2026-01',
        amountMinor: '100000',
      });

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });

    it('rejects creation in a locked financial period with 409 PERIOD_LOCKED', async () => {
      await FinancialPeriodModel.updateOne(
        { userId: user1Id, monthKey: 202601 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '100000',
      });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_LOCKED');
    });
  });

  describe('GET /v1/actuals', () => {
    beforeEach(async () => {
      // Create 4 entries for User 1
      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-03', amountMinor: '30000', note: 'Mar 1' });
      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId2, month: '2026-02', amountMinor: '20000', note: 'Feb 1' });
      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-02', amountMinor: '25000', note: 'Feb 2' });
      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '10000', note: 'Jan 1' });

      // Create entry for User 2
      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user2Cookie)
        .send({ categoryId: user2CatId, month: '2026-01', amountMinor: '99999', note: 'User 2' });
    });

    it('paginates deterministically with limit and cursor', async () => {
      const page1 = await request(app).get('/v1/actuals?limit=2').set('Cookie', user1Cookie);

      expect(page1.status).toBe(200);
      const p1 = actualsResponseSchema.parse(page1.body);
      expect(p1.data).toHaveLength(2);
      expect(p1.meta.hasMore).toBe(true);
      expect(p1.meta.nextCursor).not.toBeNull();

      const page2 = await request(app)
        .get(`/v1/actuals?limit=2&cursor=${p1.meta.nextCursor}`)
        .set('Cookie', user1Cookie);

      expect(page2.status).toBe(200);
      const p2 = actualsResponseSchema.parse(page2.body);
      expect(p2.data).toHaveLength(2);
      expect(p2.meta.hasMore).toBe(false);
      expect(p2.meta.nextCursor).toBeNull();

      const allIds = [...p1.data.map((d) => d.id), ...p2.data.map((d) => d.id)];
      expect(new Set(allIds).size).toBe(4);
    });

    it('filters by month, categoryId, and range', async () => {
      const monthRes = await request(app)
        .get('/v1/actuals?month=2026-02')
        .set('Cookie', user1Cookie);
      expect(monthRes.status).toBe(200);
      expect(monthRes.body.data).toHaveLength(2);

      const catRes = await request(app)
        .get(`/v1/actuals?categoryId=${catId2}`)
        .set('Cookie', user1Cookie);
      expect(catRes.status).toBe(200);
      expect(catRes.body.data).toHaveLength(1);
      expect(catRes.body.data[0].note).toBe('Feb 1');

      const rangeRes = await request(app)
        .get('/v1/actuals?from=2026-01&to=2026-02')
        .set('Cookie', user1Cookie);
      expect(rangeRes.status).toBe(200);
      expect(rangeRes.body.data).toHaveLength(3);
    });

    it('isolates user data (does not return user2 actuals)', async () => {
      const res = await request(app).get('/v1/actuals').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data.some((d: { note: string }) => d.note === 'User 2')).toBe(false);
    });
  });

  describe('GET /v1/actuals/:id', () => {
    it('returns 200 OK with owned actual DTO', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000', note: 'Dinner' });
      const actualId = createRes.body.data.id;

      const res = await request(app).get(`/v1/actuals/${actualId}`).set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = actualResponseSchema.parse(res.body);
      expect(parsed.data.id).toBe(actualId);
      expect(parsed.data.note).toBe('Dinner');
    });

    it('returns 404 NOT_FOUND for actual owned by another user', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app).get(`/v1/actuals/${actualId}`).set('Cookie', user2Cookie);

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 VALIDATION_ERROR for malformed ID', async () => {
      const res = await request(app)
        .get('/v1/actuals/invalid-id-format')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /v1/actuals/:id', () => {
    it('updates amount and note in-place', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000', note: 'Initial' });
      const actualId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '80000', note: 'Updated note' });

      expect(res.status).toBe(200);
      const parsed = actualResponseSchema.parse(res.body);
      expect(parsed.data.amountMinor).toBe('80000');
      expect(parsed.data.note).toBe('Updated note');
    });

    it('moves actual to another open month', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user1Cookie)
        .send({ month: '2026-02' });

      expect(res.status).toBe(200);
      const parsed = actualResponseSchema.parse(res.body);
      expect(parsed.data.month).toBe('2026-02');
    });

    it('rejects month move if source month is LOCKED with 409 PERIOD_LOCKED', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      // Lock source month 202601
      await FinancialPeriodModel.updateOne(
        { userId: user1Id, monthKey: 202601 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user1Cookie)
        .send({ month: '2026-02' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_LOCKED');
    });

    it('rejects month move if destination month is LOCKED with 409 PERIOD_LOCKED', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      // Lock destination month 202602
      await FinancialPeriodModel.updateOne(
        { userId: user1Id, monthKey: 202602 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user1Cookie)
        .send({ month: '2026-02' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_LOCKED');
    });

    it('rejects category update to archived category with 409 CATEGORY_ARCHIVED', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user1Cookie)
        .send({ categoryId: archivedCatId });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ARCHIVED');
    });

    it('returns 404 NOT_FOUND on cross-user update', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/v1/actuals/${actualId}`)
        .set('Cookie', user2Cookie)
        .send({ amountMinor: '999999' });

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /v1/actuals/:id', () => {
    it('deletes an actual from an open month with 204 No Content', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app).delete(`/v1/actuals/${actualId}`).set('Cookie', user1Cookie);

      expect(res.status).toBe(204);

      const inDb = await ActualModel.findById(actualId);
      expect(inDb).toBeNull();
    });

    it('rejects deletion from a locked month with 409 PERIOD_LOCKED', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      // Lock month 202601
      await FinancialPeriodModel.updateOne(
        { userId: user1Id, monthKey: 202601 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      const res = await request(app).delete(`/v1/actuals/${actualId}`).set('Cookie', user1Cookie);

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_LOCKED');

      const inDb = await ActualModel.findById(actualId);
      expect(inDb).not.toBeNull();
    });

    it('returns 404 NOT_FOUND for cross-user deletion', async () => {
      const createRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '50000' });
      const actualId = createRes.body.data.id;

      const res = await request(app).delete(`/v1/actuals/${actualId}`).set('Cookie', user2Cookie);

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Unauthenticated requests', () => {
    it('returns 401 AUTHENTICATION_REQUIRED for unauthenticated access', async () => {
      const res = await request(app).get('/v1/actuals');
      expect(res.status).toBe(401);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
