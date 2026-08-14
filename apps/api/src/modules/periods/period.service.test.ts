import type { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PeriodAlreadyLockedError } from '../../http/errors.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { UserModel } from '../users/user.model.js';
import { FinancialPeriodModel } from './financial-period.model.js';
import { assertPeriodOpenAndCoordinate } from './period-coordination.service.js';
import { getPeriod, listPeriods, lockPeriod } from './period.service.js';
import { runInTransaction } from '../../database/transactions.js';

describe('period.service', () => {
  let userAId: Types.ObjectId;
  let userBId: Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const userA = await UserModel.create({
      email: 'usera@periods.test',
      emailCanonical: 'usera@periods.test',
      passwordHash: 'hash-a',
    });
    userAId = userA._id;

    const userB = await UserModel.create({
      email: 'userb@periods.test',
      emailCanonical: 'userb@periods.test',
      passwordHash: 'hash-b',
    });
    userBId = userB._id;
  });

  describe('lockPeriod', () => {
    it('locks an uncoordinated month, creating record with LOCKED status and version 1', async () => {
      const locked = await lockPeriod(userAId, '2026-01');

      expect(locked.month).toBe('2026-01');
      expect(locked.status).toBe('LOCKED');
      expect(locked.lockedAt).not.toBeNull();
      expect(locked.id).not.toBeNull();

      const stored = await FinancialPeriodModel.findOne({ userId: userAId, monthKey: 202601 });
      expect(stored?.status).toBe('LOCKED');
      expect(stored?.version).toBe(1);
      expect(stored?.lockedAt).not.toBeNull();
    });

    it('locks an existing OPEN coordinated month, transitioning status and incrementing version', async () => {
      // First coordinate open period
      await runInTransaction(async (session) => {
        await assertPeriodOpenAndCoordinate(userAId, 202601, session);
      });

      const before = await FinancialPeriodModel.findOne({ userId: userAId, monthKey: 202601 });
      expect(before?.status).toBe('OPEN');
      expect(before?.version).toBe(1);

      const locked = await lockPeriod(userAId, '2026-01');
      expect(locked.status).toBe('LOCKED');

      const after = await FinancialPeriodModel.findOne({ userId: userAId, monthKey: 202601 });
      expect(after?.status).toBe('LOCKED');
      expect(after?.version).toBe(2);
      expect(after?.lockedAt).not.toBeNull();
    });

    it('rejects duplicate lock attempt with PeriodAlreadyLockedError (409)', async () => {
      await lockPeriod(userAId, '2026-01');

      await expect(lockPeriod(userAId, '2026-01')).rejects.toThrow(PeriodAlreadyLockedError);
    });

    it('isolates user period locks', async () => {
      await lockPeriod(userAId, '2026-01');

      // User B can lock their own period independently
      const userBLocked = await lockPeriod(userBId, '2026-01');
      expect(userBLocked.status).toBe('LOCKED');
    });
  });

  describe('getPeriod', () => {
    it('returns implicit OPEN period for uncoordinated month', async () => {
      const period = await getPeriod(userAId, '2026-03');

      expect(period.month).toBe('2026-03');
      expect(period.status).toBe('OPEN');
      expect(period.id).toBeNull();
      expect(period.lockedAt).toBeNull();
      expect(period.createdAt).toBeNull();
      expect(period.updatedAt).toBeNull();
    });

    it('returns stored LOCKED period', async () => {
      await lockPeriod(userAId, '2026-01');

      const period = await getPeriod(userAId, '2026-01');
      expect(period.month).toBe('2026-01');
      expect(period.status).toBe('LOCKED');
      expect(period.id).not.toBeNull();
      expect(period.lockedAt).not.toBeNull();
    });
  });

  describe('listPeriods', () => {
    it('lists periods across range merging stored and implicit open states in chronological order', async () => {
      // Lock Jan and Mar; Feb is uncoordinated
      await lockPeriod(userAId, '2026-01');
      await lockPeriod(userAId, '2026-03');

      const periods = await listPeriods(userAId, { from: '2026-01', to: '2026-04' });

      expect(periods).toHaveLength(4);
      expect(periods[0]?.month).toBe('2026-01');
      expect(periods[0]?.status).toBe('LOCKED');

      expect(periods[1]?.month).toBe('2026-02');
      expect(periods[1]?.status).toBe('OPEN');
      expect(periods[1]?.id).toBeNull();

      expect(periods[2]?.month).toBe('2026-03');
      expect(periods[2]?.status).toBe('LOCKED');

      expect(periods[3]?.month).toBe('2026-04');
      expect(periods[3]?.status).toBe('OPEN');
    });

    it('isolates user periods in range query', async () => {
      await lockPeriod(userAId, '2026-01');

      const userBPeriods = await listPeriods(userBId, { from: '2026-01', to: '2026-01' });
      expect(userBPeriods[0]?.status).toBe('OPEN');
      expect(userBPeriods[0]?.id).toBeNull();
    });
  });
});
