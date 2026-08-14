import {
  apiErrorResponseSchema,
  planResponseSchema,
  plansResponseSchema,
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
import { PlanModel } from './plan.model.js';

describe('Plans Routes Integration', () => {
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
      email: 'user1@plans.test',
      emailCanonical: 'user1@plans.test',
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
      name: 'Payroll',
      nameCanonical: 'payroll',
      colorKey: 'emerald',
      archivedAt: null,
    });
    catId2 = c2._id.toString();

    const cArchived = await CategoryModel.create({
      userId: user1._id,
      name: 'Legacy Tools',
      nameCanonical: 'legacy tools',
      colorKey: 'blue',
      archivedAt: new Date(),
    });
    archivedCatId = cArchived._id.toString();

    // User 2 Setup
    const user2 = await UserModel.create({
      email: 'user2@plans.test',
      emailCanonical: 'user2@plans.test',
      passwordHash: 'hash-2',
    });
    const session2 = await createSession(user2._id);
    user2Cookie = [`crossval_session=${session2.token}; Path=/; HttpOnly`];

    const cUser2 = await CategoryModel.create({
      userId: user2._id,
      name: 'User 2 Secret Category',
      nameCanonical: 'user 2 secret category',
      colorKey: 'purple',
      archivedAt: null,
    });
    user2CatId = cUser2._id.toString();
  });

  describe('PUT /v1/plans/:categoryId/:month', () => {
    it('creates a new plan target and returns 200 OK with PlanDto', async () => {
      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      expect(res.status).toBe(200);
      const parsed = planResponseSchema.parse(res.body);
      expect(parsed.data.categoryId).toBe(catId1);
      expect(parsed.data.month).toBe('2026-01');
      expect(parsed.data.amountMinor).toBe('500000');

      const doc = await PlanModel.findById(parsed.data.id);
      expect(doc?.amountMinor).toBe(500000n);
      expect(doc?.userId.toString()).toBe(user1Id);
    });

    it('replaces an existing plan amount', async () => {
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '750000' });

      expect(res.status).toBe(200);
      expect(res.body.data.amountMinor).toBe('750000');

      const plans = await PlanModel.find({ userId: user1Id, monthKey: 202601 });
      expect(plans).toHaveLength(1);
      expect(plans[0]?.amountMinor).toBe(750000n);
    });

    it('accepts explicit zero amountMinor', async () => {
      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '0' });

      expect(res.status).toBe(200);
      expect(res.body.data.amountMinor).toBe('0');
    });

    it('rejects invalid amounts with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '-500' });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid month string with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-13`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 CATEGORY_ARCHIVED when targeting archived category', async () => {
      const res = await request(app)
        .put(`/v1/plans/${archivedCatId}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('CATEGORY_ARCHIVED');
    });

    it('returns 404 NOT_FOUND when targeting another user category', async () => {
      const res = await request(app)
        .put(`/v1/plans/${user2CatId}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      expect(res.status).toBe(404);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('NOT_FOUND');
    });

    it('returns 409 PERIOD_LOCKED when target month is locked', async () => {
      await FinancialPeriodModel.create({
        userId: user1Id,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_LOCKED');
    });
  });

  describe('DELETE /v1/plans/:categoryId/:month', () => {
    it('deletes plan target and returns 204 No Content', async () => {
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      const res = await request(app)
        .delete(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});

      const doc = await PlanModel.findOne({ userId: user1Id, categoryId: catId1 });
      expect(doc).toBeNull();
    });

    it('is idempotent when deleting an already absent plan', async () => {
      const res = await request(app)
        .delete(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(204);
    });

    it('returns 404 NOT_FOUND when category belongs to another user', async () => {
      const res = await request(app)
        .delete(`/v1/plans/${user2CatId}/2026-01`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(404);
    });

    it('returns 409 PERIOD_LOCKED when month is locked', async () => {
      await FinancialPeriodModel.create({
        userId: user1Id,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });
  });

  describe('PATCH /v1/plans/months/:month', () => {
    it('atomically creates, updates, and clears plans for a month', async () => {
      // Existing plan on cat1
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      const res = await request(app)
        .patch('/v1/plans/months/2026-01')
        .set('Cookie', user1Cookie)
        .send({
          changes: [
            { categoryId: catId1, amountMinor: null }, // Clear cat1
            { categoryId: catId2, amountMinor: '250000' }, // Set cat2
          ],
        });

      expect(res.status).toBe(200);
      const parsed = plansResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data[0]?.categoryId).toBe(catId2);
      expect(parsed.data[0]?.amountMinor).toBe('250000');
    });

    it('rejects duplicate categoryId in changes with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch('/v1/plans/months/2026-01')
        .set('Cookie', user1Cookie)
        .send({
          changes: [
            { categoryId: catId1, amountMinor: '500000' },
            { categoryId: catId1, amountMinor: '300000' },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rolls back completely if any change targets an archived category', async () => {
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      const res = await request(app)
        .patch('/v1/plans/months/2026-01')
        .set('Cookie', user1Cookie)
        .send({
          changes: [
            { categoryId: catId1, amountMinor: '999900' },
            { categoryId: archivedCatId, amountMinor: '100000' }, // Invalid
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CATEGORY_ARCHIVED');

      // Verify rollback: cat1 amount remained 500000
      const doc = await PlanModel.findOne({
        userId: user1Id,
        categoryId: catId1,
        monthKey: 202601,
      });
      expect(doc?.amountMinor).toBe(500000n);
    });

    it('returns 409 PERIOD_LOCKED when batch editing a locked month', async () => {
      await FinancialPeriodModel.create({
        userId: user1Id,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      const res = await request(app)
        .patch('/v1/plans/months/2026-01')
        .set('Cookie', user1Cookie)
        .send({
          changes: [{ categoryId: catId1, amountMinor: '500000' }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });
  });

  describe('GET /v1/plans', () => {
    beforeEach(async () => {
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '100000' });

      await request(app)
        .put(`/v1/plans/${catId1}/2026-02`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '200000' });

      await request(app)
        .put(`/v1/plans/${catId2}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '300000' });

      // User 2 Plan (must be isolated)
      await request(app)
        .put(`/v1/plans/${user2CatId}/2026-01`)
        .set('Cookie', user2Cookie)
        .send({ amountMinor: '900000' });
    });

    it('returns all plans within range for the authenticated user', async () => {
      const res = await request(app)
        .get('/v1/plans?from=2026-01&to=2026-03')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = plansResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(3);
      // Ensure User 2 plans are not included
      expect(parsed.data.find((p) => p.categoryId === user2CatId)).toBeUndefined();
    });

    it('filters plans by categoryId', async () => {
      const res = await request(app)
        .get(`/v1/plans?from=2026-01&to=2026-03&categoryId=${catId1}`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = plansResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(2);
      expect(parsed.data.every((p) => p.categoryId === catId1)).toBe(true);
    });

    it('rejects invalid range from > to with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/v1/plans?from=2026-05&to=2026-01')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication Guards', () => {
    it('returns 401 AUTHENTICATION_REQUIRED for unauthenticated requests', async () => {
      const res1 = await request(app).get('/v1/plans?from=2026-01&to=2026-03');
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .send({ amountMinor: '500000' });
      expect(res2.status).toBe(401);

      const res3 = await request(app).delete(`/v1/plans/${catId1}/2026-01`);
      expect(res3.status).toBe(401);

      const res4 = await request(app)
        .patch('/v1/plans/months/2026-01')
        .send({ changes: [{ categoryId: catId1, amountMinor: '500000' }] });
      expect(res4.status).toBe(401);
    });
  });
});
