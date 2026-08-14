import { apiErrorResponseSchema, reportResponseSchema } from '@crossval/contracts';
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
import { PlanModel } from '../plans/plan.model.js';
import { ActualModel } from '../actuals/actual.model.js';

describe('Report Routes: GET /v1/reports/plan-vs-actual', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let userCookie: string[];
  let userId: string;
  let marketingId: string;
  let payrollId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user = await UserModel.create({
      email: 'reportuser@crossval.test',
      emailCanonical: 'reportuser@crossval.test',
      passwordHash: 'hash-rep-int',
    });
    userId = user._id.toString();
    const session = await createSession(user._id);
    userCookie = [`crossval_session=${session.token}; Path=/; HttpOnly`];

    const catMarketing = await CategoryModel.create({
      userId: user._id,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    marketingId = catMarketing._id.toString();

    const catPayroll = await CategoryModel.create({
      userId: user._id,
      name: 'Payroll',
      nameCanonical: 'payroll',
      colorKey: 'emerald',
      archivedAt: null,
    });
    payrollId = catPayroll._id.toString();
  });

  it('requires authentication returning 401 when session cookie is missing', async () => {
    const res = await request(app).get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-02');

    expect(res.status).toBe(401);
    const parsed = apiErrorResponseSchema.parse(res.body);
    expect(parsed.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('rejects inverted range with 422 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .get('/v1/reports/plan-vs-actual?from=2026-06&to=2026-01')
      .set('Cookie', userCookie);

    expect(res.status).toBe(422);
    const parsed = apiErrorResponseSchema.parse(res.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns clean zero-state report on empty account', async () => {
    const res = await request(app)
      .get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    const parsed = reportResponseSchema.parse(res.body);
    expect(parsed.data.range).toEqual({ from: '2026-01', to: '2026-02' });
    expect(parsed.data.summary.planMinor).toBe('0');
    expect(parsed.data.summary.actualMinor).toBe('0');
    expect(parsed.data.summary.varianceMinor).toBe('0');
    expect(parsed.data.summary.variancePercent).toBeNull();
    expect(parsed.data.summary.overPlanCategoryCount).toBe(0);
    expect(parsed.data.monthlySeries).toHaveLength(2);
  });

  it('produces authoritative report matching canonical assignment sample numbers', async () => {
    // Populate sample data
    await PlanModel.create([
      { userId, categoryId: marketingId, monthKey: 202601, amountMinor: 500_000n },
      { userId, categoryId: payrollId, monthKey: 202601, amountMinor: 2_000_000n },
      { userId, categoryId: marketingId, monthKey: 202602, amountMinor: 500_000n },
      { userId, categoryId: payrollId, monthKey: 202602, amountMinor: 2_000_000n },
    ]);

    await ActualModel.create([
      {
        userId,
        categoryId: marketingId,
        monthKey: 202601,
        amountMinor: 200_000n,
        note: 'Google Ads',
      },
      {
        userId,
        categoryId: marketingId,
        monthKey: 202601,
        amountMinor: 100_000n,
        note: 'LinkedIn',
      },
      {
        userId,
        categoryId: marketingId,
        monthKey: 202601,
        amountMinor: 180_000n,
        note: 'Agency',
      },
      {
        userId,
        categoryId: payrollId,
        monthKey: 202601,
        amountMinor: 2_050_000n,
        note: 'Salaries',
      },
      {
        userId,
        categoryId: payrollId,
        monthKey: 202602,
        amountMinor: 1_980_000n,
        note: 'Salaries',
      },
    ]);

    const res = await request(app)
      .get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    const parsed = reportResponseSchema.parse(res.body);

    // Summary validation
    expect(parsed.data.summary).toEqual({
      planMinor: '5000000',
      actualMinor: '4510000',
      varianceMinor: '-490000',
      variancePercent: '-9.80',
      overPlanCategoryCount: 1,
    });

    // Monthly series validation
    expect(parsed.data.monthlySeries[0]).toEqual({
      month: '2026-01',
      planMinor: '2500000',
      actualMinor: '2530000',
      varianceMinor: '30000',
      locked: false,
    });
    expect(parsed.data.monthlySeries[1]).toEqual({
      month: '2026-02',
      planMinor: '2500000',
      actualMinor: '1980000',
      varianceMinor: '-520000',
      locked: false,
    });
  });

  it('filters report by categoryId parameter', async () => {
    await PlanModel.create([
      { userId, categoryId: marketingId, monthKey: 202601, amountMinor: 500_000n },
      { userId, categoryId: payrollId, monthKey: 202601, amountMinor: 2_000_000n },
    ]);

    const res = await request(app)
      .get(`/v1/reports/plan-vs-actual?from=2026-01&to=2026-01&categoryId=${marketingId}`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    const parsed = reportResponseSchema.parse(res.body);
    expect(parsed.data.categories).toHaveLength(1);
    expect(parsed.data.categories[0]?.category.id).toBe(marketingId);
    expect(parsed.data.summary.planMinor).toBe('500000');
  });
});
