import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CategoryArchivedError, NotFoundError, PeriodLockedError } from '../../http/errors.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { PlanModel } from './plan.model.js';
import { batchUpdatePlans, deletePlan, getPlans, toPlanDto, upsertPlan } from './plan.service.js';

describe('plan.service', () => {
  const userId1 = new mongoose.Types.ObjectId();
  const userId2 = new mongoose.Types.ObjectId();

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

    const c1 = await CategoryModel.create({
      userId: userId1,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    catId1 = c1._id.toString();

    const c2 = await CategoryModel.create({
      userId: userId1,
      name: 'Payroll',
      nameCanonical: 'payroll',
      colorKey: 'emerald',
      archivedAt: null,
    });
    catId2 = c2._id.toString();

    const cArchived = await CategoryModel.create({
      userId: userId1,
      name: 'Old Software',
      nameCanonical: 'old software',
      colorKey: 'blue',
      archivedAt: new Date(),
    });
    archivedCatId = cArchived._id.toString();

    const cUser2 = await CategoryModel.create({
      userId: userId2,
      name: 'User 2 Marketing',
      nameCanonical: 'user 2 marketing',
      colorKey: 'purple',
      archivedAt: null,
    });
    user2CatId = cUser2._id.toString();
  });

  describe('toPlanDto', () => {
    it('serializes a Plan document to PlanDto', async () => {
      const planDoc = await PlanModel.create({
        userId: userId1,
        categoryId: new mongoose.Types.ObjectId(catId1),
        monthKey: 202601,
        amountMinor: 500000n,
      });

      const dto = toPlanDto(planDoc);
      expect(dto).toEqual({
        id: planDoc._id.toString(),
        categoryId: catId1,
        month: '2026-01',
        amountMinor: '500000',
        createdAt: planDoc.createdAt.toISOString(),
        updatedAt: planDoc.updatedAt.toISOString(),
      });
    });
  });

  describe('upsertPlan', () => {
    it('creates a new plan target with correct amountMinor', async () => {
      const plan = await upsertPlan(userId1, catId1, '2026-01', {
        amountMinor: '500000',
      });

      expect(plan.categoryId).toBe(catId1);
      expect(plan.month).toBe('2026-01');
      expect(plan.amountMinor).toBe('500000');

      const doc = await PlanModel.findById(plan.id);
      expect(doc?.amountMinor).toBe(500000n);
      expect(doc?.monthKey).toBe(202601);
    });

    it('updates existing plan target amount when called again', async () => {
      await upsertPlan(userId1, catId1, '2026-01', { amountMinor: '500000' });
      const updated = await upsertPlan(userId1, catId1, '2026-01', {
        amountMinor: '750000',
      });

      expect(updated.amountMinor).toBe('750000');

      const allPlans = await PlanModel.find({ userId: userId1, monthKey: 202601 });
      expect(allPlans).toHaveLength(1);
      expect(allPlans[0]?.amountMinor).toBe(750000n);
    });

    it('supports explicit zero amountMinor', async () => {
      const plan = await upsertPlan(userId1, catId1, '2026-01', {
        amountMinor: '0',
      });

      expect(plan.amountMinor).toBe('0');
      const doc = await PlanModel.findById(plan.id);
      expect(doc?.amountMinor).toBe(0n);
    });

    it('throws PeriodLockedError when target month is locked', async () => {
      await FinancialPeriodModel.create({
        userId: userId1,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      await expect(
        upsertPlan(userId1, catId1, '2026-01', { amountMinor: '500000' }),
      ).rejects.toThrow(PeriodLockedError);
    });

    it('throws CategoryArchivedError when target category is archived', async () => {
      await expect(
        upsertPlan(userId1, archivedCatId, '2026-01', { amountMinor: '500000' }),
      ).rejects.toThrow(CategoryArchivedError);
    });

    it('throws NotFoundError when target category belongs to another user', async () => {
      await expect(
        upsertPlan(userId1, user2CatId, '2026-01', { amountMinor: '500000' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePlan', () => {
    it('deletes plan target and is idempotent when plan already absent', async () => {
      await upsertPlan(userId1, catId1, '2026-01', { amountMinor: '500000' });
      expect(await PlanModel.countDocuments({ userId: userId1 })).toBe(1);

      await deletePlan(userId1, catId1, '2026-01');
      expect(await PlanModel.countDocuments({ userId: userId1 })).toBe(0);

      // Calling delete again is safe
      await deletePlan(userId1, catId1, '2026-01');
    });

    it('throws PeriodLockedError when attempting to delete plan in locked month', async () => {
      await FinancialPeriodModel.create({
        userId: userId1,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      await expect(deletePlan(userId1, catId1, '2026-01')).rejects.toThrow(PeriodLockedError);
    });
  });

  describe('batchUpdatePlans', () => {
    it('atomically creates, updates, and clears multiple plans in one month', async () => {
      // Existing plan to clear
      await upsertPlan(userId1, catId1, '2026-01', { amountMinor: '500000' });

      const result = await batchUpdatePlans(userId1, '2026-01', {
        changes: [
          { categoryId: catId1, amountMinor: null }, // Clear cat1
          { categoryId: catId2, amountMinor: '300000' }, // Create cat2
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.categoryId).toBe(catId2);
      expect(result[0]?.amountMinor).toBe('300000');

      // Verify DB state
      const docCat1 = await PlanModel.findOne({
        userId: userId1,
        categoryId: catId1,
        monthKey: 202601,
      });
      expect(docCat1).toBeNull();

      const docCat2 = await PlanModel.findOne({
        userId: userId1,
        categoryId: catId2,
        monthKey: 202601,
      });
      expect(docCat2?.amountMinor).toBe(300000n);
    });

    it('rolls back all changes if any single item in batch fails', async () => {
      await upsertPlan(userId1, catId1, '2026-01', { amountMinor: '500000' });

      await expect(
        batchUpdatePlans(userId1, '2026-01', {
          changes: [
            { categoryId: catId1, amountMinor: '999900' },
            { categoryId: archivedCatId, amountMinor: '100000' }, // Fails because archived
          ],
        }),
      ).rejects.toThrow(CategoryArchivedError);

      // Verify cat1 plan remained unchanged (rollback succeeded)
      const doc = await PlanModel.findOne({
        userId: userId1,
        categoryId: catId1,
        monthKey: 202601,
      });
      expect(doc?.amountMinor).toBe(500000n);
    });

    it('throws PeriodLockedError when batch updating locked month', async () => {
      await FinancialPeriodModel.create({
        userId: userId1,
        monthKey: 202601,
        status: 'LOCKED',
        version: 1,
        lockedAt: new Date(),
      });

      await expect(
        batchUpdatePlans(userId1, '2026-01', {
          changes: [{ categoryId: catId1, amountMinor: '500000' }],
        }),
      ).rejects.toThrow(PeriodLockedError);
    });
  });

  describe('getPlans', () => {
    it('retrieves plans within inclusive month range, filtered by category', async () => {
      await upsertPlan(userId1, catId1, '2026-01', { amountMinor: '100000' });
      await upsertPlan(userId1, catId1, '2026-02', { amountMinor: '200000' });
      await upsertPlan(userId1, catId1, '2026-03', { amountMinor: '300000' });
      await upsertPlan(userId1, catId2, '2026-01', { amountMinor: '400000' });
      // Out-of-range plan
      await upsertPlan(userId1, catId1, '2026-04', { amountMinor: '500000' });
      // Other user plan
      await upsertPlan(userId2, user2CatId, '2026-01', { amountMinor: '900000' });

      const allRange = await getPlans(userId1, {
        from: '2026-01',
        to: '2026-03',
      });
      expect(allRange).toHaveLength(4);

      const filtered = await getPlans(userId1, {
        from: '2026-01',
        to: '2026-03',
        categoryId: catId1,
      });
      expect(filtered).toHaveLength(3);
      expect(filtered.map((p) => p.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    });
  });
});
