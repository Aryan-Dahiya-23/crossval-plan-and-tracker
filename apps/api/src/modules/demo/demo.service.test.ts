import type { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { SampleDataNotAvailableError } from '../../http/errors.js';
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
import { loadAssignmentSample } from './demo.service.js';

describe('demo.service', () => {
  let userId: Types.ObjectId;
  let marketingId: Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const user = await UserModel.create({
      email: 'demo@crossval.test',
      emailCanonical: 'demo@crossval.test',
      passwordHash: 'hash-demo',
    });
    userId = user._id;

    const cat = await CategoryModel.create({
      userId,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    marketingId = cat._id;
  });

  it('loads sample data on clean account successfully', async () => {
    const res = await loadAssignmentSample(userId);

    expect(res).toEqual({
      plansCreated: 4,
      actualsCreated: 10,
      range: {
        from: '2026-01',
        to: '2026-02',
      },
    });

    const plans = await PlanModel.find({ userId });
    expect(plans).toHaveLength(4);

    const actuals = await ActualModel.find({ userId });
    expect(actuals).toHaveLength(10);
  });

  it('rejects sample data loading if account already has plans', async () => {
    await PlanModel.create({
      userId,
      categoryId: marketingId,
      monthKey: 202601,
      amountMinor: 100_000n,
    });

    await expect(loadAssignmentSample(userId)).rejects.toThrow(SampleDataNotAvailableError);
  });

  it('rejects sample data loading if account already has actuals', async () => {
    await ActualModel.create({
      userId,
      categoryId: marketingId,
      monthKey: 202601,
      amountMinor: 50_000n,
      note: 'Existing expense',
    });

    await expect(loadAssignmentSample(userId)).rejects.toThrow(SampleDataNotAvailableError);
  });

  it('rejects sample data loading if account has a locked period', async () => {
    await FinancialPeriodModel.create({
      userId,
      monthKey: 202601,
      status: 'LOCKED',
      version: 1,
      lockedAt: new Date(),
    });

    await expect(loadAssignmentSample(userId)).rejects.toThrow(SampleDataNotAvailableError);
  });
});
