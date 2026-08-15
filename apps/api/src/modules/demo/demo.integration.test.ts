import {
  apiErrorResponseSchema,
  loadDemoSampleResponseSchema,
  reportResponseSchema,
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
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { UserModel } from '../users/user.model.js';

describe('Demo Routes: POST /v1/demo/assignment-sample', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let userCookie: string[];
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user = await UserModel.create({
      email: 'demouser@crossval.test',
      emailCanonical: 'demouser@crossval.test',
      passwordHash: 'hash-demo-int',
    });
    userId = user._id.toString();
    const session = await createSession(user._id);
    userCookie = [`crossval_session=${session.token}; Path=/; HttpOnly`];
  });

  it('requires authentication returning 401 when unauthenticated', async () => {
    const res = await request(app).post('/v1/demo/assignment-sample');

    expect(res.status).toBe(401);
    const parsed = apiErrorResponseSchema.parse(res.body);
    expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('successfully loads assignment sample on a clean account', async () => {
    const res = await request(app).post('/v1/demo/assignment-sample').set('Cookie', userCookie);

    expect(res.status).toBe(201);
    const parsed = loadDemoSampleResponseSchema.parse(res.body);
    expect(parsed.data.plansCreated).toBe(4);
    expect(parsed.data.actualsCreated).toBe(10);
    expect(parsed.data.range).toEqual({ from: '2026-01', to: '2026-02' });

    // Verify report endpoint immediately reflects sample data
    const reportRes = await request(app)
      .get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);

    expect(reportRes.status).toBe(200);
    const reportParsed = reportResponseSchema.parse(reportRes.body);
    expect(reportParsed.data.summary.planMinor).toBe('5000000');
    expect(reportParsed.data.summary.actualMinor).toBe('4510000');
    expect(reportParsed.data.summary.varianceMinor).toBe('-490000');
    expect(reportParsed.data.summary.variancePercent).toBe('-9.80');
    expect(reportParsed.data.summary.overPlanCategoryCount).toBe(1);
  });

  it('rejects subsequent load with 409 SAMPLE_DATA_NOT_AVAILABLE', async () => {
    // First load succeeds
    await request(app).post('/v1/demo/assignment-sample').set('Cookie', userCookie);

    // Second load fails with 409
    const res = await request(app).post('/v1/demo/assignment-sample').set('Cookie', userCookie);

    expect(res.status).toBe(409);
    const parsed = apiErrorResponseSchema.parse(res.body);
    expect(parsed.error.code).toBe('SAMPLE_DATA_NOT_AVAILABLE');
  });

  it('rejects load when a financial period is locked with 409 SAMPLE_DATA_NOT_AVAILABLE', async () => {
    await FinancialPeriodModel.create({
      userId,
      monthKey: 202601,
      status: 'LOCKED',
      version: 1,
      lockedAt: new Date(),
    });

    const res = await request(app).post('/v1/demo/assignment-sample').set('Cookie', userCookie);

    expect(res.status).toBe(409);
    const parsed = apiErrorResponseSchema.parse(res.body);
    expect(parsed.error.code).toBe('SAMPLE_DATA_NOT_AVAILABLE');
  });
});
