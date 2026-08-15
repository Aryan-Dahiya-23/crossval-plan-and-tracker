import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CategoryArchivedError, NotFoundError, PeriodLockedError } from '../../http/errors.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { CategoryModel } from '../categories/category.model.js';
import { FinancialPeriodModel } from '../periods/financial-period.model.js';
import { UserModel } from '../users/user.model.js';
import { ActualModel } from './actual.model.js';
import {
  createActual,
  deleteActual,
  getActualById,
  importActuals,
  listActuals,
  updateActual,
} from './actual.service.js';

describe('actual.service', () => {
  let userAId: Types.ObjectId;
  let userBId: Types.ObjectId;
  let categoryA1: Types.ObjectId;
  let categoryA2: Types.ObjectId;
  let archivedCategoryA: Types.ObjectId;
  let categoryB1: Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const userA = await UserModel.create({
      email: 'usera@example.com',
      emailCanonical: 'usera@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash1',
    });
    userAId = userA._id;

    const userB = await UserModel.create({
      email: 'userb@example.com',
      emailCanonical: 'userb@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash2',
    });
    userBId = userB._id;

    const catA1 = await CategoryModel.create({
      userId: userAId,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'blue',
      archivedAt: null,
    });
    categoryA1 = catA1._id;

    const catA2 = await CategoryModel.create({
      userId: userAId,
      name: 'Engineering',
      nameCanonical: 'engineering',
      colorKey: 'purple',
      archivedAt: null,
    });
    categoryA2 = catA2._id;

    const archCat = await CategoryModel.create({
      userId: userAId,
      name: 'Old Software',
      nameCanonical: 'old software',
      colorKey: 'gray',
      archivedAt: new Date(),
    });
    archivedCategoryA = archCat._id;

    const catB1 = await CategoryModel.create({
      userId: userBId,
      name: 'Marketing',
      nameCanonical: 'marketing',
      colorKey: 'green',
      archivedAt: null,
    });
    categoryB1 = catB1._id;
  });

  describe('createActual', () => {
    it('creates an actual entry with note and positive amount', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
        note: 'Google Ads campaign',
      });

      expect(created.id).toBeDefined();
      expect(created.categoryId).toBe(categoryA1.toString());
      expect(created.month).toBe('2026-01');
      expect(created.amountMinor).toBe('200000');
      expect(created.note).toBe('Google Ads campaign');

      const inDb = await ActualModel.findById(created.id);
      expect(inDb).not.toBeNull();
      expect(inDb?.amountMinor).toBe(200000n);
      expect(inDb?.monthKey).toBe(202601);
    });

    it('creates an actual entry without note (note: null)', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '50000',
        note: null,
      });

      expect(created.note).toBeNull();
    });

    it('allows and preserves multiple actual entries for same category and month', async () => {
      const actual1 = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
        note: 'Entry 1',
      });

      const actual2 = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '150000',
        note: 'Entry 2',
      });

      expect(actual1.id).not.toBe(actual2.id);

      const all = await ActualModel.find({
        userId: userAId,
        categoryId: categoryA1,
        monthKey: 202601,
      });
      expect(all).toHaveLength(2);
    });

    it('rejects creation targeting an archived category', async () => {
      await expect(
        createActual(userAId, {
          categoryId: archivedCategoryA.toString(),
          month: '2026-01',
          amountMinor: '100000',
        }),
      ).rejects.toThrow(CategoryArchivedError);
    });

    it('rejects creation targeting another user category', async () => {
      await expect(
        createActual(userAId, {
          categoryId: categoryB1.toString(),
          month: '2026-01',
          amountMinor: '100000',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects creation in a locked financial period', async () => {
      await FinancialPeriodModel.create({
        userId: userAId,
        monthKey: 202601,
        status: 'LOCKED',
        lockedAt: new Date(),
        version: 1,
      });

      await expect(
        createActual(userAId, {
          categoryId: categoryA1.toString(),
          month: '2026-01',
          amountMinor: '100000',
        }),
      ).rejects.toThrow(PeriodLockedError);
    });
  });

  describe('getActualById', () => {
    it('returns owned actual by ID', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '125000',
        note: 'SaaS subscription',
      });

      const fetched = await getActualById(userAId, created.id);
      expect(fetched).toEqual(created);
    });

    it('throws NotFoundError for non-existent or other user actual', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '125000',
      });

      // User B trying to fetch User A's actual
      await expect(getActualById(userBId, created.id)).rejects.toThrow(NotFoundError);

      // Non-existent ID
      await expect(
        getActualById(userAId, new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('listActuals & cursor pagination', () => {
    beforeEach(async () => {
      // Create 5 entries across different months and categories
      await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-03',
        amountMinor: '30000',
        note: 'March Ads',
      });
      await createActual(userAId, {
        categoryId: categoryA2.toString(),
        month: '2026-02',
        amountMinor: '20000',
        note: 'Feb Server',
      });
      await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-02',
        amountMinor: '25000',
        note: 'Feb Ads',
      });
      await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '10000',
        note: 'Jan Ads 1',
      });
      await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '15000',
        note: 'Jan Ads 2',
      });

      // User B entry
      await createActual(userBId, {
        categoryId: categoryB1.toString(),
        month: '2026-01',
        amountMinor: '99999',
        note: 'User B entry',
      });
    });

    it('lists actuals with deterministic cursor pagination', async () => {
      // Page 1: limit 2
      const page1 = await listActuals(userAId, { limit: 2 });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta.hasMore).toBe(true);
      expect(page1.meta.nextCursor).not.toBeNull();
      expect(page1.data[0]?.month).toBe('2026-03');

      // Page 2: limit 2
      const page2 = await listActuals(userAId, {
        limit: 2,
        cursor: page1.meta.nextCursor!,
      });
      expect(page2.data).toHaveLength(2);
      expect(page2.meta.hasMore).toBe(true);
      expect(page2.meta.nextCursor).not.toBeNull();

      // Page 3: limit 2 (last item)
      const page3 = await listActuals(userAId, {
        limit: 2,
        cursor: page2.meta.nextCursor!,
      });
      expect(page3.data).toHaveLength(1);
      expect(page3.meta.hasMore).toBe(false);
      expect(page3.meta.nextCursor).toBeNull();
      expect(page3.data[0]?.month).toBe('2026-01');

      // Ensure no duplicates across pages
      const allIds = [
        ...page1.data.map((d) => d.id),
        ...page2.data.map((d) => d.id),
        ...page3.data.map((d) => d.id),
      ];
      expect(new Set(allIds).size).toBe(5);
    });

    it('filters by single month', async () => {
      const result = await listActuals(userAId, { month: '2026-02' });
      expect(result.data).toHaveLength(2);
      expect(result.data.every((d) => d.month === '2026-02')).toBe(true);
    });

    it('filters by month range (from..to)', async () => {
      const result = await listActuals(userAId, { from: '2026-01', to: '2026-02' });
      expect(result.data).toHaveLength(4);
      expect(result.data.every((d) => d.month === '2026-01' || d.month === '2026-02')).toBe(true);
    });

    it('filters by categoryId', async () => {
      const result = await listActuals(userAId, { categoryId: categoryA2.toString() });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.categoryId).toBe(categoryA2.toString());
      expect(result.data[0]?.note).toBe('Feb Server');
    });

    it('isolates user data (never returns other users actuals)', async () => {
      const result = await listActuals(userAId, {});
      expect(result.data).toHaveLength(5);
      expect(result.data.some((d) => d.note === 'User B entry')).toBe(false);
    });
  });

  describe('updateActual', () => {
    it('updates amount and note in-place', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
        note: 'Initial note',
      });

      const updated = await updateActual(userAId, created.id, {
        amountMinor: '350000',
        note: 'Updated note',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.amountMinor).toBe('350000');
      expect(updated.note).toBe('Updated note');
      expect(updated.month).toBe('2026-01');

      const inDb = await ActualModel.findById(created.id);
      expect(inDb?.amountMinor).toBe(350000n);
      expect(inDb?.note).toBe('Updated note');
    });

    it('updates category to another active category', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      const updated = await updateActual(userAId, created.id, {
        categoryId: categoryA2.toString(),
      });

      expect(updated.categoryId).toBe(categoryA2.toString());
    });

    it('rejects category update to an archived category', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      await expect(
        updateActual(userAId, created.id, {
          categoryId: archivedCategoryA.toString(),
        }),
      ).rejects.toThrow(CategoryArchivedError);
    });

    it('moves actual to another month when both source and destination are OPEN', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      const updated = await updateActual(userAId, created.id, {
        month: '2026-02',
      });

      expect(updated.month).toBe('2026-02');

      const inDb = await ActualModel.findById(created.id);
      expect(inDb?.monthKey).toBe(202602);
    });

    it('rejects month move if source month is LOCKED', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      // Lock source month 202601
      await FinancialPeriodModel.updateOne(
        { userId: userAId, monthKey: 202601 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      await expect(
        updateActual(userAId, created.id, {
          month: '2026-02',
        }),
      ).rejects.toThrow(PeriodLockedError);
    });

    it('rejects month move if destination month is LOCKED', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      // Lock destination month 202602
      await FinancialPeriodModel.updateOne(
        { userId: userAId, monthKey: 202602 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      await expect(
        updateActual(userAId, created.id, {
          month: '2026-02',
        }),
      ).rejects.toThrow(PeriodLockedError);
    });

    it('throws NotFoundError on cross-user update attempt', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      await expect(
        updateActual(userBId, created.id, {
          amountMinor: '999999',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteActual', () => {
    it('deletes an actual from an open month', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      await deleteActual(userAId, created.id);

      const inDb = await ActualModel.findById(created.id);
      expect(inDb).toBeNull();
    });

    it('rejects deletion from a locked month', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      // Lock month 202601
      await FinancialPeriodModel.updateOne(
        { userId: userAId, monthKey: 202601 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      await expect(deleteActual(userAId, created.id)).rejects.toThrow(PeriodLockedError);

      const inDb = await ActualModel.findById(created.id);
      expect(inDb).not.toBeNull();
    });

    it('throws NotFoundError on non-existent or other user actual deletion', async () => {
      const created = await createActual(userAId, {
        categoryId: categoryA1.toString(),
        month: '2026-01',
        amountMinor: '200000',
      });

      await expect(deleteActual(userBId, created.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('importActuals', () => {
    it('successfully imports multiple actuals matching active categories by name', async () => {
      const result = await importActuals(userAId, {
        rows: [
          {
            month: '2026-01',
            categoryName: 'Marketing',
            amountMinor:
              '480000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
            note: 'Ad campaign',
          },
          {
            month: '2026-01',
            categoryName: 'engineering',
            amountMinor:
              '2050000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
          },
          {
            month: '2026-02',
            categoryName: 'Engineering',
            amountMinor:
              '1980000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
          },
        ],
      });

      expect(result.importedCount).toBe(3);
      expect(result.actuals).toHaveLength(3);

      const dbEntries = await ActualModel.find({ userId: userAId });
      expect(dbEntries).toHaveLength(3);
    });

    it('rejects import with ValidationError when category does not exist', async () => {
      await expect(
        importActuals(userAId, {
          rows: [
            {
              month: '2026-01',
              categoryName: 'NonExistentCategory',
              amountMinor:
                '10000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
            },
          ],
        }),
      ).rejects.toThrow('Category "NonExistentCategory" does not exist or is archived.');
    });

    it('rejects import when any period in the batch is locked', async () => {
      // Lock 2026-02
      await FinancialPeriodModel.updateOne(
        { userId: userAId, monthKey: 202602 },
        { $set: { status: 'LOCKED', lockedAt: new Date(), version: 1 } },
        { upsert: true },
      );

      await expect(
        importActuals(userAId, {
          rows: [
            {
              month: '2026-01',
              categoryName: 'Marketing',
              amountMinor:
                '480000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
            },
            {
              month: '2026-02',
              categoryName: 'Engineering',
              amountMinor:
                '1980000' as unknown as import('@crossval/contracts').PositiveMoneyMinorString,
            },
          ],
        }),
      ).rejects.toThrow(PeriodLockedError);

      // Verify transaction rollback - zero entries created
      const count = await ActualModel.countDocuments({ userId: userAId });
      expect(count).toBe(0);
    });
  });
});
