import { Types } from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../test/database-helper.js';
import { CategoryModel, FinancialPeriodModel, UserModel } from './models.js';
import { runInTransaction } from './transactions.js';

describe('runInTransaction', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('commits multi-document writes atomically', async () => {
    const userId = new Types.ObjectId();

    await runInTransaction(async (session) => {
      await UserModel.create(
        [
          {
            _id: userId,
            email: 'founder@example.com',
            emailCanonical: 'founder@example.com',
            passwordHash: 'hash_123',
          },
        ],
        { session },
      );

      await CategoryModel.create(
        [
          {
            userId,
            name: 'Infrastructure',
            nameCanonical: 'infrastructure',
            colorKey: 'blue',
          },
        ],
        { session },
      );

      await FinancialPeriodModel.create(
        [
          {
            userId,
            monthKey: 202601,
            status: 'OPEN',
            version: 1,
          },
        ],
        { session },
      );
    });

    const user = await UserModel.findById(userId);
    const category = await CategoryModel.findOne({ userId });
    const period = await FinancialPeriodModel.findOne({ userId });

    expect(user).not.toBeNull();
    expect(category).not.toBeNull();
    expect(period).not.toBeNull();
  });

  it('rolls back all writes if an error occurs during transaction', async () => {
    const userId = new Types.ObjectId();

    await expect(
      runInTransaction(async (session) => {
        await UserModel.create(
          [
            {
              _id: userId,
              email: 'rollback@example.com',
              emailCanonical: 'rollback@example.com',
              passwordHash: 'hash_123',
            },
          ],
          { session },
        );

        await CategoryModel.create(
          [
            {
              userId,
              name: 'Tools',
              nameCanonical: 'tools',
              colorKey: 'purple',
            },
          ],
          { session },
        );

        throw new Error('Simulated failure inside transaction');
      }),
    ).rejects.toThrow('Simulated failure inside transaction');

    const user = await UserModel.findById(userId);
    const category = await CategoryModel.findOne({ userId });

    expect(user).toBeNull();
    expect(category).toBeNull();
  });
});
