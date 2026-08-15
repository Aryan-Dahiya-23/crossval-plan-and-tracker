import {
  actualsResponseSchema,
  apiErrorResponseSchema,
  categoriesResponseSchema,
  plansResponseSchema,
  reportResponseSchema,
} from '@crossval/contracts';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { createSession } from '../modules/auth/session.service.js';
import { CategoryModel } from '../modules/categories/category.model.js';
import { FinancialPeriodModel } from '../modules/periods/financial-period.model.js';
import { PlanModel } from '../modules/plans/plan.model.js';
import { UserModel } from '../modules/users/user.model.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './database-helper.js';

describe('Phase 15 Security, Isolation, and Input Validation Audit', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let userACookie: string[];
  let userBCookie: string[];
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create User A
    const userA = await UserModel.create({
      email: 'usera@crossval.test',
      emailCanonical: 'usera@crossval.test',
      passwordHash: 'hash-a',
    });
    userAId = userA._id.toString();
    const sessionA = await createSession(userA._id);
    userACookie = [`crossval_session=${sessionA.token}; Path=/; HttpOnly`];

    // Create User B
    const userB = await UserModel.create({
      email: 'userb@crossval.test',
      emailCanonical: 'userb@crossval.test',
      passwordHash: 'hash-b',
    });
    userBId = userB._id.toString();
    const sessionB = await createSession(userB._id);
    userBCookie = [`crossval_session=${sessionB.token}; Path=/; HttpOnly`];
  });

  describe('1. Cross-User Data Isolation Matrix', () => {
    it('strictly isolates categories between users', async () => {
      // User B creates a category
      const createRes = await request(app)
        .post('/v1/categories')
        .set('Cookie', userBCookie)
        .send({ name: 'Secret Project B', colorKey: 'rose' });
      expect(createRes.status).toBe(201);
      const userBCatId = createRes.body.data.id;

      // User A lists categories -> should NOT see User B's category
      const listResA = await request(app).get('/v1/categories').set('Cookie', userACookie);
      expect(listResA.status).toBe(200);
      const listA = categoriesResponseSchema.parse(listResA.body);
      expect(listA.data.some((c) => c.id === userBCatId)).toBe(false);

      // User A attempts to rename User B's category -> 404 NOT_FOUND
      const patchResA = await request(app)
        .patch(`/v1/categories/${userBCatId}`)
        .set('Cookie', userACookie)
        .send({ name: 'Hacked Name' });
      expect(patchResA.status).toBe(404);
      const patchErr = apiErrorResponseSchema.parse(patchResA.body);
      expect(patchErr.error.code).toBe('NOT_FOUND');

      // User B's category name must remain unchanged
      const checkResB = await request(app)
        .get(`/v1/categories/${userBCatId}`)
        .set('Cookie', userBCookie);
      expect(checkResB.status).toBe(200);
      expect(checkResB.body.data.name).toBe('Secret Project B');
    });

    it('strictly isolates plans and reports between users', async () => {
      // Create category for User B
      const catB = await CategoryModel.create({
        userId: userBId,
        name: 'Engineering B',
        nameCanonical: 'engineering b',
        colorKey: 'rose',
      });

      // User B sets a plan of $10,000.00
      await PlanModel.create({
        userId: userBId,
        categoryId: catB._id,
        monthKey: 202601,
        amountMinor: 1_000_000n,
      });

      // User A queries plans -> returns empty array
      const listPlansA = await request(app)
        .get('/v1/plans?from=2026-01&to=2026-12')
        .set('Cookie', userACookie);
      expect(listPlansA.status).toBe(200);
      const plansA = plansResponseSchema.parse(listPlansA.body);
      expect(plansA.data).toHaveLength(0);

      // User A attempts to update User B's plan -> 404 NOT_FOUND
      const putPlanA = await request(app)
        .put(`/v1/plans/${catB._id.toString()}/2026-01`)
        .set('Cookie', userACookie)
        .send({ amountMinor: '500000' });
      expect(putPlanA.status).toBe(404);

      // User A queries report -> total plan is $0.00
      const reportResA = await request(app)
        .get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-12')
        .set('Cookie', userACookie);
      expect(reportResA.status).toBe(200);
      const reportA = reportResponseSchema.parse(reportResA.body);
      expect(reportA.data.summary.planMinor).toBe('0');
    });

    it('strictly isolates actual expenses and deletions between users', async () => {
      const catB = await CategoryModel.create({
        userId: userBId,
        name: 'Operations B',
        nameCanonical: 'operations b',
        colorKey: 'amber',
      });

      // User B creates an actual expense
      const createRes = await request(app).post('/v1/actuals').set('Cookie', userBCookie).send({
        categoryId: catB._id.toString(),
        month: '2026-01',
        amountMinor: '50000',
        note: 'User B private invoice',
      });
      expect(createRes.status).toBe(201);
      const userBActualId = createRes.body.data.id;

      // User A queries actuals -> returns empty array
      const listActualsA = await request(app)
        .get('/v1/actuals?from=2026-01&to=2026-12')
        .set('Cookie', userACookie);
      expect(listActualsA.status).toBe(200);
      const actualsA = actualsResponseSchema.parse(listActualsA.body);
      expect(actualsA.data).toHaveLength(0);

      // User A attempts to update User B's actual -> 404 NOT_FOUND
      const patchActualA = await request(app)
        .patch(`/v1/actuals/${userBActualId}`)
        .set('Cookie', userACookie)
        .send({ amountMinor: '99900' });
      expect(patchActualA.status).toBe(404);

      // User A attempts to delete User B's actual -> 404 NOT_FOUND
      const deleteActualA = await request(app)
        .delete(`/v1/actuals/${userBActualId}`)
        .set('Cookie', userACookie);
      expect(deleteActualA.status).toBe(404);

      // User B verifies their actual expense is intact
      const getActualB = await request(app)
        .get(`/v1/actuals/${userBActualId}`)
        .set('Cookie', userBCookie);
      expect(getActualB.status).toBe(200);
      expect(getActualB.body.data.amountMinor).toBe('50000');
    });

    it('strictly isolates financial period locking', async () => {
      // User B locks January 2026
      await FinancialPeriodModel.create({
        userId: userBId,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      // User A queries periods -> January 2026 is OPEN for User A
      const periodResA = await request(app).get('/v1/periods/2026-01').set('Cookie', userACookie);
      expect(periodResA.status).toBe(200);
      expect(periodResA.body.data.status).toBe('OPEN');

      // User A can still write to 2026-01
      const catA = await CategoryModel.create({
        userId: userAId,
        name: 'Marketing A',
        nameCanonical: 'marketing a',
        colorKey: 'purple',
      });

      const writeActualA = await request(app).post('/v1/actuals').set('Cookie', userACookie).send({
        categoryId: catA._id.toString(),
        month: '2026-01',
        amountMinor: '10000',
        note: 'Allowed write for User A',
      });
      expect(writeActualA.status).toBe(201);
    });
  });

  describe('2. Input Validation & Parameter Injection Defense', () => {
    it('rejects malformed ObjectIds with 422 VALIDATION_ERROR before database execution', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        'null',
        'undefined',
        '$$ne',
        '00000000000000000000000g',
      ];

      for (const badId of invalidIds) {
        // Category GET
        const res1 = await request(app).get(`/v1/categories/${badId}`).set('Cookie', userACookie);
        expect(res1.status).toBe(422);
        expect(apiErrorResponseSchema.parse(res1.body).error.code).toBe('VALIDATION_ERROR');

        // Actual PATCH
        const res2 = await request(app)
          .patch(`/v1/actuals/${badId}`)
          .set('Cookie', userACookie)
          .send({ amountMinor: '1000' });
        expect(res2.status).toBe(422);
        expect(apiErrorResponseSchema.parse(res2.body).error.code).toBe('VALIDATION_ERROR');

        // Plan PUT
        const res3 = await request(app)
          .put(`/v1/plans/${badId}/2026-01`)
          .set('Cookie', userACookie)
          .send({ amountMinor: '1000' });
        expect(res3.status).toBe(422);
        expect(apiErrorResponseSchema.parse(res3.body).error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('rejects malformed month formats with 422 VALIDATION_ERROR', async () => {
      const badMonths = ['2026-13', '2026-00', '202612', 'invalid-month', '2026-1'];

      for (const badMonth of badMonths) {
        const res = await request(app).get(`/v1/periods/${badMonth}`).set('Cookie', userACookie);
        expect(res.status).toBe(422);
        expect(apiErrorResponseSchema.parse(res.body).error.code).toBe('VALIDATION_ERROR');
      }

      // Range query parameter validation
      const rangeRes = await request(app)
        .get('/v1/reports/plan-vs-actual?from=2026-12&to=2026-01')
        .set('Cookie', userACookie);
      expect(rangeRes.status).toBe(422);
      expect(apiErrorResponseSchema.parse(rangeRes.body).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects negative, float, or out-of-bounds money inputs with 422 VALIDATION_ERROR', async () => {
      const catA = await CategoryModel.create({
        userId: userAId,
        name: 'Validation Cat',
        nameCanonical: 'validation cat',
      });

      const badAmounts = ['-500', '100.50', 'abc', '999999999999999999999999999'];

      for (const badAmount of badAmounts) {
        const res = await request(app).post('/v1/actuals').set('Cookie', userACookie).send({
          categoryId: catA._id.toString(),
          month: '2026-01',
          amountMinor: badAmount,
        });
        expect(res.status).toBe(422);
        expect(apiErrorResponseSchema.parse(res.body).error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('3. Authentication Boundaries', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const getEndpoints = [
        '/v1/categories',
        '/v1/plans?from=2026-01&to=2026-12',
        '/v1/actuals?from=2026-01&to=2026-12',
        '/v1/periods?from=2026-01&to=2026-12',
        '/v1/reports/plan-vs-actual?from=2026-01&to=2026-12',
      ];

      for (const path of getEndpoints) {
        const res = await request(app).get(path);
        expect(res.status).toBe(401);
        const parsed = apiErrorResponseSchema.parse(res.body);
        expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
      }

      const postRes = await request(app).post('/v1/demo/assignment-sample');
      expect(postRes.status).toBe(401);
      expect(apiErrorResponseSchema.parse(postRes.body).error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
