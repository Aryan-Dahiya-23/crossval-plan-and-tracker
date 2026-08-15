import {
  actualsResponseSchema,
  apiErrorResponseSchema,
  categoriesResponseSchema,
  financialPeriodResponseSchema,
  loadDemoSampleResponseSchema,
  plansResponseSchema,
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
import { UserModel } from '../users/user.model.js';

describe('Reviewer End-to-End Workflow Verification', () => {
  const app = createApp({
    corsOrigins: ['http://localhost:3000'],
  });

  let userCookie: string[];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user = await UserModel.create({
      email: 'evaluator@crossval.test',
      emailCanonical: 'evaluator@crossval.test',
      passwordHash: 'evaluator-hash-int',
    });
    const session = await createSession(user._id);
    userCookie = [`crossval_session=${session.token}; Path=/; HttpOnly`];
  });

  it('completes the entire assignment reviewer journey across all domains', async () => {
    // 1. Initial State: Load assignment sample data via 1-click CTA
    const demoRes = await request(app).post('/v1/demo/assignment-sample').set('Cookie', userCookie);
    expect(demoRes.status).toBe(201);
    const demoData = loadDemoSampleResponseSchema.parse(demoRes.body);
    expect(demoData.data.plansCreated).toBe(4);
    expect(demoData.data.actualsCreated).toBe(5);

    // Retrieve categories created by demo dataset
    const catRes = await request(app).get('/v1/categories').set('Cookie', userCookie);
    expect(catRes.status).toBe(200);
    const catData = categoriesResponseSchema.parse(catRes.body);
    const mktCategory = catData.data.find((c) => c.name === 'Marketing');
    const payrollCategory = catData.data.find((c) => c.name === 'Payroll');
    expect(mktCategory).toBeDefined();
    expect(payrollCategory).toBeDefined();

    // 2. Planning Domain: Verify all 4 planned targets
    const plansRes = await request(app)
      .get('/v1/plans?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);
    expect(plansRes.status).toBe(200);
    const plansData = plansResponseSchema.parse(plansRes.body);
    expect(plansData.data).toHaveLength(4);

    const mktJanPlan = plansData.data.find(
      (p) => p.month === '2026-01' && p.categoryId === mktCategory!.id,
    );
    expect(mktJanPlan?.amountMinor).toBe('500000'); // $5,000.00

    const payrollJanPlan = plansData.data.find(
      (p) => p.month === '2026-01' && p.categoryId === payrollCategory!.id,
    );
    expect(payrollJanPlan?.amountMinor).toBe('2000000'); // $20,000.00

    // 3. Actuals Domain: Verify 5 actual expense transactions recorded
    const actualsRes = await request(app)
      .get('/v1/actuals?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);
    expect(actualsRes.status).toBe(200);
    const actualsData = actualsResponseSchema.parse(actualsRes.body);
    expect(actualsData.data).toHaveLength(5);

    const mktJanActuals = actualsData.data.filter(
      (a) => a.month === '2026-01' && a.categoryId === mktCategory!.id,
    );
    expect(mktJanActuals).toHaveLength(3); // Google Ads ($2k), LinkedIn ($1k), Agency ($1.8k) -> $4,800.00

    // 4. Report Domain: Authoritative calculations & Zero-Plan N/A variance rate rule
    const reportRes = await request(app)
      .get('/v1/reports/plan-vs-actual?from=2026-01&to=2026-02')
      .set('Cookie', userCookie);
    expect(reportRes.status).toBe(200);
    const reportData = reportResponseSchema.parse(reportRes.body);

    // Summary checks
    expect(reportData.data.summary.planMinor).toBe('5000000'); // $50,000.00
    expect(reportData.data.summary.actualMinor).toBe('4510000'); // $45,100.00
    expect(reportData.data.summary.varianceMinor).toBe('-490000'); // -$4,900.00
    expect(reportData.data.summary.variancePercent).toBe('-9.80');
    expect(reportData.data.summary.overPlanCategoryCount).toBe(1); // Payroll Jan is $20.5k vs $20k (+500)

    // Category breakdown checks
    const mktReport = reportData.data.categories.find((c) => c.category.name === 'Marketing');
    expect(mktReport).toBeDefined();

    const mktJanMonth = mktReport!.months.find((m) => m.month === '2026-01');
    expect(mktJanMonth?.planMinor).toBe('500000');
    expect(mktJanMonth?.actualMinor).toBe('480000'); // $4,800.00 sum
    expect(mktJanMonth?.varianceMinor).toBe('-20000'); // -$200.00 (under budget)
    expect(mktJanMonth?.variancePercent).toBe('-4.00');

    // 5. Period Domain: Irrevocable period lock on 2026-01
    const lockRes = await request(app).post('/v1/periods/2026-01/lock').set('Cookie', userCookie);
    expect(lockRes.status).toBe(200);
    const lockData = financialPeriodResponseSchema.parse(lockRes.body);
    expect(lockData.data.status).toBe('LOCKED');

    // 6. Security & Invariant: Attempt mutations on locked month 2026-01
    // A. Plan mutation on locked month
    const planMutateRes = await request(app)
      .put(`/v1/plans/${mktCategory!.id}/2026-01`)
      .set('Cookie', userCookie)
      .send({
        amountMinor: '600000',
      });
    expect(planMutateRes.status).toBe(409);
    const planMutateErr = apiErrorResponseSchema.parse(planMutateRes.body);
    expect(planMutateErr.error.code).toBe('PERIOD_LOCKED');

    // B. Actual creation on locked month
    const actualCreateRes = await request(app).post('/v1/actuals').set('Cookie', userCookie).send({
      categoryId: mktCategory!.id,
      month: '2026-01',
      amountMinor: '50000',
      note: 'Late invoice',
    });
    expect(actualCreateRes.status).toBe(409);
    const actualCreateErr = apiErrorResponseSchema.parse(actualCreateRes.body);
    expect(actualCreateErr.error.code).toBe('PERIOD_LOCKED');

    // C. Actual update on locked month
    const existingJanActualId = mktJanActuals[0]!.id;
    const actualUpdateRes = await request(app)
      .patch(`/v1/actuals/${existingJanActualId}`)
      .set('Cookie', userCookie)
      .send({
        amountMinor: '250000',
      });
    expect(actualUpdateRes.status).toBe(409);
    const actualUpdateErr = apiErrorResponseSchema.parse(actualUpdateRes.body);
    expect(actualUpdateErr.error.code).toBe('PERIOD_LOCKED');

    // D. Actual deletion on locked month
    const actualDeleteRes = await request(app)
      .delete(`/v1/actuals/${existingJanActualId}`)
      .set('Cookie', userCookie);
    expect(actualDeleteRes.status).toBe(409);
    const actualDeleteErr = apiErrorResponseSchema.parse(actualDeleteRes.body);
    expect(actualDeleteErr.error.code).toBe('PERIOD_LOCKED');

    // 7. Verification that open period (2026-02) remains editable
    const openFebActualRes = await request(app).post('/v1/actuals').set('Cookie', userCookie).send({
      categoryId: payrollCategory!.id,
      month: '2026-02',
      amountMinor: '10000',
      note: 'Overtime pay',
    });
    expect(openFebActualRes.status).toBe(201);
  });
});
