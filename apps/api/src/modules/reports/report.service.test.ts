import type { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { ActualModel } from '../actuals/actual.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { PlanModel } from '../plans/plan.model.js';
import { UserModel } from '../users/user.model.js';
import { getPlanVsActualReport } from './report.service.js';

describe('report.service', () => {
  let userId: Types.ObjectId;
  let otherUserId: Types.ObjectId;
  let marketingId: Types.ObjectId;
  let payrollId: Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user = await UserModel.create({
      email: 'reporter@crossval.test',
      emailCanonical: 'reporter@crossval.test',
      passwordHash: 'hash-rep',
    });
    userId = user._id;

    const otherUser = await UserModel.create({
      email: 'other@crossval.test',
      emailCanonical: 'other@crossval.test',
      passwordHash: 'hash-other',
    });
    otherUserId = otherUser._id;

    const catMarketing = await CategoryModel.create({
      userId,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    marketingId = catMarketing._id;

    const catPayroll = await CategoryModel.create({
      userId,
      name: 'Payroll',
      nameCanonical: 'payroll',
      colorKey: 'emerald',
      archivedAt: null,
    });
    payrollId = catPayroll._id;
  });

  it('generates exact canonical report for the assignment sample dataset', async () => {
    // 4 Plans
    await PlanModel.create([
      { userId, categoryId: marketingId, monthKey: 202601, amountMinor: 500_000n },
      { userId, categoryId: payrollId, monthKey: 202601, amountMinor: 2_000_000n },
      { userId, categoryId: marketingId, monthKey: 202602, amountMinor: 500_000n },
      { userId, categoryId: payrollId, monthKey: 202602, amountMinor: 2_000_000n },
    ]);

    // 5 Actuals
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

    const report = await getPlanVsActualReport(userId, { from: '2026-01', to: '2026-02' });

    // Assert Date Range
    expect(report.range).toEqual({ from: '2026-01', to: '2026-02' });

    // Assert Top-Level KPI Summary
    expect(report.summary).toEqual({
      planMinor: '5000000',
      actualMinor: '4510000',
      varianceMinor: '-490000',
      variancePercent: '-9.80',
      overPlanCategoryCount: 1, // Only Payroll has positive aggregate variance
    });

    // Assert Monthly Series
    expect(report.monthlySeries).toEqual([
      {
        month: '2026-01',
        planMinor: '2500000',
        actualMinor: '2530000',
        varianceMinor: '30000',
        locked: false,
      },
      {
        month: '2026-02',
        planMinor: '2500000',
        actualMinor: '1980000',
        varianceMinor: '-520000',
        locked: false,
      },
    ]);

    // Assert Categories (Alphabetical: Marketing, Payroll)
    expect(report.categories).toHaveLength(2);

    // 1. Marketing
    const marketingReport = report.categories[0]!;
    expect(marketingReport.category.name).toBe('Marketing');
    expect(marketingReport.subtotal).toEqual({
      planMinor: '1000000',
      actualMinor: '480000',
      varianceMinor: '-520000',
      variancePercent: '-52.00',
    });
    expect(marketingReport.months).toEqual([
      {
        month: '2026-01',
        hasPlan: true,
        planMinor: '500000',
        actualMinor: '480000',
        varianceMinor: '-20000',
        variancePercent: '-4.00',
        actualEntryCount: 3,
        locked: false,
      },
      {
        month: '2026-02',
        hasPlan: true,
        planMinor: '500000',
        actualMinor: '0',
        varianceMinor: '-500000',
        variancePercent: '-100.00',
        actualEntryCount: 0,
        locked: false,
      },
    ]);

    // 2. Payroll
    const payrollReport = report.categories[1]!;
    expect(payrollReport.category.name).toBe('Payroll');
    expect(payrollReport.subtotal).toEqual({
      planMinor: '4000000',
      actualMinor: '4030000',
      varianceMinor: '30000',
      variancePercent: '0.75',
    });
    expect(payrollReport.months).toEqual([
      {
        month: '2026-01',
        hasPlan: true,
        planMinor: '2000000',
        actualMinor: '2050000',
        varianceMinor: '50000',
        variancePercent: '2.50',
        actualEntryCount: 1,
        locked: false,
      },
      {
        month: '2026-02',
        hasPlan: true,
        planMinor: '2000000',
        actualMinor: '1980000',
        varianceMinor: '-20000',
        variancePercent: '-1.00',
        actualEntryCount: 1,
        locked: false,
      },
    ]);
  });

  it('handles explicit zero plans and missing plans properly', async () => {
    // Explicit plan = 0
    await PlanModel.create({
      userId,
      categoryId: marketingId,
      monthKey: 202601,
      amountMinor: 0n,
    });

    // Actual = 125 ($1.25)
    await ActualModel.create({
      userId,
      categoryId: marketingId,
      monthKey: 202601,
      amountMinor: 125n,
    });

    const report = await getPlanVsActualReport(userId, { from: '2026-01', to: '2026-01' });
    const marketingRow = report.categories.find((c) => c.category.id === marketingId.toString())!;

    expect(marketingRow.months[0]).toEqual({
      month: '2026-01',
      hasPlan: true,
      planMinor: '0',
      actualMinor: '125',
      varianceMinor: '125',
      variancePercent: null, // Zero plan variance percent must be null
      actualEntryCount: 1,
      locked: false,
    });

    expect(marketingRow.subtotal).toEqual({
      planMinor: '0',
      actualMinor: '125',
      varianceMinor: '125',
      variancePercent: null,
    });
  });

  it('includes locked period status for locked months', async () => {
    await FinancialPeriodModel.create({
      userId,
      monthKey: 202601,
      status: 'LOCKED',
      version: 1,
      lockedAt: new Date(),
    });

    const report = await getPlanVsActualReport(userId, { from: '2026-01', to: '2026-02' });

    expect(report.monthlySeries[0]?.locked).toBe(true);
    expect(report.monthlySeries[1]?.locked).toBe(false);

    const cat = report.categories[0]!;
    expect(cat.months[0]?.locked).toBe(true);
    expect(cat.months[1]?.locked).toBe(false);
  });

  it('filters by categoryId when provided', async () => {
    const report = await getPlanVsActualReport(userId, {
      from: '2026-01',
      to: '2026-01',
      categoryId: marketingId.toString(),
    });

    expect(report.categories).toHaveLength(1);
    expect(report.categories[0]?.category.id).toBe(marketingId.toString());
  });

  it('isolates user data completely in reports', async () => {
    await PlanModel.create({
      userId: otherUserId,
      categoryId: marketingId,
      monthKey: 202601,
      amountMinor: 999_999n,
    });

    const report = await getPlanVsActualReport(userId, { from: '2026-01', to: '2026-01' });
    expect(report.summary.planMinor).toBe('0');
  });
});
