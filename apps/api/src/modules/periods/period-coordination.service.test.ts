import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { runInTransaction } from '../../database/transactions.js';
import { PeriodLockedError } from '../../http/errors.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { FinancialPeriodModel } from './financial-period.model.js';
import { assertPeriodOpenAndCoordinate, isPeriodLocked } from './period-coordination.service.js';

describe('period-coordination.service', () => {
  const userId = new mongoose.Types.ObjectId();
  const monthKey = 202601;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('creates an OPEN financial period with version 1 on first coordination', async () => {
    const period = await runInTransaction(async (session) => {
      return assertPeriodOpenAndCoordinate(userId, monthKey, session);
    });

    expect(period.status).toBe('OPEN');
    expect(period.version).toBe(1);
    expect(period.lockedAt).toBeNull();
    expect(period.monthKey).toBe(monthKey);

    const stored = await FinancialPeriodModel.findOne({ userId, monthKey });
    expect(stored?.status).toBe('OPEN');
    expect(stored?.version).toBe(1);
  });

  it('increments version on subsequent coordinations for open period', async () => {
    await runInTransaction(async (session) => {
      await assertPeriodOpenAndCoordinate(userId, monthKey, session);
    });

    const period2 = await runInTransaction(async (session) => {
      return assertPeriodOpenAndCoordinate(userId, monthKey, session);
    });

    expect(period2.version).toBe(2);
    expect(period2.status).toBe('OPEN');
  });

  it('throws PeriodLockedError when coordinating on a LOCKED period', async () => {
    await FinancialPeriodModel.create({
      userId,
      monthKey,
      status: 'LOCKED',
      version: 5,
      lockedAt: new Date(),
    });

    await expect(
      runInTransaction(async (session) => {
        return assertPeriodOpenAndCoordinate(userId, monthKey, session);
      }),
    ).rejects.toThrow(PeriodLockedError);
  });

  it('isPeriodLocked correctly identifies open vs locked periods', async () => {
    expect(await isPeriodLocked(userId, monthKey)).toBe(false);

    await FinancialPeriodModel.create({
      userId,
      monthKey,
      status: 'LOCKED',
      version: 1,
      lockedAt: new Date(),
    });

    expect(await isPeriodLocked(userId, monthKey)).toBe(true);
  });
});
