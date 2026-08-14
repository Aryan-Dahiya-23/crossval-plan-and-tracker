import {
  actualsResponseSchema,
  apiErrorResponseSchema,
  financialPeriodResponseSchema,
  financialPeriodsResponseSchema,
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
import { UserModel } from '../users/user.model.js';

describe('Period Locking Routes & Invariant Matrix', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let user1Cookie: string[];
  let user2Cookie: string[];
  let catId1: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user1 = await UserModel.create({
      email: 'user1@periods.test',
      emailCanonical: 'user1@periods.test',
      passwordHash: 'hash-1',
    });
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

    const user2 = await UserModel.create({
      email: 'user2@periods.test',
      emailCanonical: 'user2@periods.test',
      passwordHash: 'hash-2',
    });
    const session2 = await createSession(user2._id);
    user2Cookie = [`crossval_session=${session2.token}; Path=/; HttpOnly`];
  });

  describe('POST /v1/periods/:month/lock', () => {
    it('locks an open month with 200 OK and valid FinancialPeriodDto', async () => {
      const res = await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = financialPeriodResponseSchema.parse(res.body);
      expect(parsed.data.month).toBe('2026-01');
      expect(parsed.data.status).toBe('LOCKED');
      expect(parsed.data.lockedAt).not.toBeNull();
      expect(parsed.data.id).not.toBeNull();
    });

    it('rejects duplicate lock attempt with 409 PERIOD_ALREADY_LOCKED', async () => {
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      const res = await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      expect(res.status).toBe(409);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('PERIOD_ALREADY_LOCKED');
    });

    it('rejects invalid month format with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/v1/periods/invalid-month/lock')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(422);
      const parsed = apiErrorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/periods/:month', () => {
    it('returns implicit OPEN period for uncoordinated month', async () => {
      const res = await request(app).get('/v1/periods/2026-06').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = financialPeriodResponseSchema.parse(res.body);
      expect(parsed.data.month).toBe('2026-06');
      expect(parsed.data.status).toBe('OPEN');
      expect(parsed.data.id).toBeNull();
      expect(parsed.data.lockedAt).toBeNull();
    });

    it('returns stored LOCKED period', async () => {
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      const res = await request(app).get('/v1/periods/2026-01').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = financialPeriodResponseSchema.parse(res.body);
      expect(parsed.data.month).toBe('2026-01');
      expect(parsed.data.status).toBe('LOCKED');
      expect(parsed.data.id).not.toBeNull();
    });
  });

  describe('GET /v1/periods', () => {
    it('lists periods across range merging stored and implicit open states', async () => {
      // Lock Jan and Mar
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);
      await request(app).post('/v1/periods/2026-03/lock').set('Cookie', user1Cookie);

      const res = await request(app)
        .get('/v1/periods?from=2026-01&to=2026-04')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = financialPeriodsResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(4);
      expect(parsed.data[0]?.month).toBe('2026-01');
      expect(parsed.data[0]?.status).toBe('LOCKED');

      expect(parsed.data[1]?.month).toBe('2026-02');
      expect(parsed.data[1]?.status).toBe('OPEN');

      expect(parsed.data[2]?.month).toBe('2026-03');
      expect(parsed.data[2]?.status).toBe('LOCKED');

      expect(parsed.data[3]?.month).toBe('2026-04');
      expect(parsed.data[3]?.status).toBe('OPEN');
    });

    it('isolates user periods', async () => {
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      const res = await request(app)
        .get('/v1/periods?from=2026-01&to=2026-01')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe('OPEN');
    });
  });

  describe('Full Locking Invariant Matrix: Protected Mutations', () => {
    let actualIdInJan: string;
    let actualIdInFeb: string;

    beforeEach(async () => {
      // Create initial plan in Jan
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      // Create initial actual in Jan
      const actJanRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '200000', note: 'Jan spend' });
      actualIdInJan = actJanRes.body.data.id;

      // Create initial actual in open Feb
      const actFebRes = await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-02', amountMinor: '150000', note: 'Feb spend' });
      actualIdInFeb = actFebRes.body.data.id;

      // LOCK January 2026
      const lockRes = await request(app)
        .post('/v1/periods/2026-01/lock')
        .set('Cookie', user1Cookie);
      expect(lockRes.status).toBe(200);
    });

    // 1. Plan Upsert in locked month
    it('1. PUT /v1/plans/:cat/2026-01 rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '600000' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 2. Plan Delete/Clear in locked month
    it('2. DELETE /v1/plans/:cat/2026-01 rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .delete(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 3. Batch Plan Edit in locked month
    it('3. PATCH /v1/plans/months/2026-01 rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .patch('/v1/plans/months/2026-01')
        .set('Cookie', user1Cookie)
        .send({
          changes: [{ categoryId: catId1, amountMinor: '700000' }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 4. Actual Create in locked month
    it('4. POST /v1/actuals (month: 2026-01) rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '100000',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 5. Actual Update in place in locked month
    it('5. PATCH /v1/actuals/:id (in 2026-01) rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .patch(`/v1/actuals/${actualIdInJan}`)
        .set('Cookie', user1Cookie)
        .send({
          amountMinor: '300000',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 6. Actual Move out of locked month (source locked)
    it('6. PATCH /v1/actuals/:id (move out of locked Jan into open Feb) rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .patch(`/v1/actuals/${actualIdInJan}`)
        .set('Cookie', user1Cookie)
        .send({
          month: '2026-02',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 7. Actual Move into locked month (destination locked)
    it('7. PATCH /v1/actuals/:id (move from open Feb into locked Jan) rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .patch(`/v1/actuals/${actualIdInFeb}`)
        .set('Cookie', user1Cookie)
        .send({
          month: '2026-01',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });

    // 8. Actual Delete in locked month
    it('8. DELETE /v1/actuals/:id (in 2026-01) rejects with 409 PERIOD_LOCKED', async () => {
      const res = await request(app)
        .delete(`/v1/actuals/${actualIdInJan}`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PERIOD_LOCKED');
    });
  });

  describe('Unprotected Category Operations', () => {
    it('allows category rename and color update even when month is locked', async () => {
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      const res = await request(app)
        .patch(`/v1/categories/${catId1}`)
        .set('Cookie', user1Cookie)
        .send({ name: 'Marketing Renamed', colorKey: 'emerald' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Marketing Renamed');
    });

    it('allows category archiving even when month is locked', async () => {
      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);

      const res = await request(app)
        .post(`/v1/categories/${catId1}/archive`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.archivedAt).not.toBeNull();
    });
  });

  describe('Read Availability for Locked Periods', () => {
    beforeEach(async () => {
      await request(app)
        .put(`/v1/plans/${catId1}/2026-01`)
        .set('Cookie', user1Cookie)
        .send({ amountMinor: '500000' });

      await request(app)
        .post('/v1/actuals')
        .set('Cookie', user1Cookie)
        .send({ categoryId: catId1, month: '2026-01', amountMinor: '200000', note: 'Jan spend' });

      await request(app).post('/v1/periods/2026-01/lock').set('Cookie', user1Cookie);
    });

    it('plans in locked month remain readable via GET /v1/plans', async () => {
      const res = await request(app)
        .get('/v1/plans?from=2026-01&to=2026-01')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = plansResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data[0]?.amountMinor).toBe('500000');
    });

    it('actuals in locked month remain readable via GET /v1/actuals', async () => {
      const res = await request(app).get('/v1/actuals?month=2026-01').set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      const parsed = actualsResponseSchema.parse(res.body);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data[0]?.amountMinor).toBe('200000');
    });
  });

  describe('Concurrency Integration: Concurrent Lock & Mutation', () => {
    it('strictly serializes concurrent lock and actual create requests', async () => {
      // Run concurrent requests for month 2026-05
      const lockPromise = request(app).post('/v1/periods/2026-05/lock').set('Cookie', user1Cookie);

      const createActualPromise = request(app).post('/v1/actuals').set('Cookie', user1Cookie).send({
        categoryId: catId1,
        month: '2026-05',
        amountMinor: '100000',
        note: 'Concurrent spend',
      });

      const [lockRes, createRes] = await Promise.all([lockPromise, createActualPromise]);

      expect(lockRes.status).toBe(200);

      // CreateActual must either have succeeded before the lock (201) or failed with 409 PERIOD_LOCKED
      if (createRes.status === 201) {
        expect(createRes.body.data.month).toBe('2026-05');
      } else {
        expect(createRes.status).toBe(409);
        expect(createRes.body.error.code).toBe('PERIOD_LOCKED');
      }
    });
  });
});
