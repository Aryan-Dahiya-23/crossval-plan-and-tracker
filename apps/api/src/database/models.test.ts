import { Types } from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../test/database-helper.js';
import {
  ActualModel,
  CategoryModel,
  FinancialPeriodModel,
  PlanModel,
  SchemaMigrationModel,
  SessionModel,
  UserModel,
} from './models.js';

describe('Mongoose Domain Models', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('UserModel', () => {
    it('creates a user and enforces emailCanonical uniqueness', async () => {
      const user = await UserModel.create({
        email: 'Reviewer@Example.com',
        emailCanonical: 'reviewer@example.com',
        passwordHash: 'argon2_hashed_password',
      });

      expect(user._id).toBeInstanceOf(Types.ObjectId);
      expect(user.email).toBe('Reviewer@Example.com');
      expect(user.emailCanonical).toBe('reviewer@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);

      await expect(
        UserModel.create({
          email: 'reviewer@example.com',
          emailCanonical: 'reviewer@example.com',
          passwordHash: 'another_hash',
        }),
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('SessionModel', () => {
    it('creates a session and enforces tokenHash uniqueness', async () => {
      const userId = new Types.ObjectId();
      const session = await SessionModel.create({
        userId,
        tokenHash: 'sha256_hashed_token_1',
        expiresAt: new Date(Date.now() + 86400000),
      });

      expect(session.userId.toString()).toBe(userId.toString());
      expect(session.tokenHash).toBe('sha256_hashed_token_1');
      expect(session.createdAt).toBeInstanceOf(Date);

      await expect(
        SessionModel.create({
          userId: new Types.ObjectId(),
          tokenHash: 'sha256_hashed_token_1',
          expiresAt: new Date(Date.now() + 86400000),
        }),
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('CategoryModel', () => {
    it('enforces canonical name uniqueness per user, but allows across users', async () => {
      const user1 = new Types.ObjectId();
      const user2 = new Types.ObjectId();

      await CategoryModel.create({
        userId: user1,
        name: 'Marketing',
        nameCanonical: 'marketing',
        colorKey: 'purple',
      });

      // Same user cannot duplicate category
      await expect(
        CategoryModel.create({
          userId: user1,
          name: 'marketing',
          nameCanonical: 'marketing',
          colorKey: 'blue',
        }),
      ).rejects.toThrow(/duplicate key/i);

      // Different user can have the same category name
      const user2Category = await CategoryModel.create({
        userId: user2,
        name: 'Marketing',
        nameCanonical: 'marketing',
        colorKey: 'green',
      });

      expect(user2Category.userId.toString()).toBe(user2.toString());
      expect(user2Category.nameCanonical).toBe('marketing');
    });
  });

  describe('PlanModel', () => {
    it('stores amountMinor as BigInt integer cents and enforces compound uniqueness', async () => {
      const userId = new Types.ObjectId();
      const categoryId = new Types.ObjectId();
      const monthKey = 202601;
      const amountMinor = 500000n; // $5,000.00 in cents

      const plan = await PlanModel.create({
        userId,
        categoryId,
        monthKey,
        amountMinor,
      });

      expect(plan.amountMinor).toBe(500000n);
      expect(typeof plan.amountMinor).toBe('bigint');

      // Verify Mongoose document casting to BigInt
      const fetchedDoc = await PlanModel.findById(plan._id);
      expect(fetchedDoc?.amountMinor).toBe(500000n);
      expect(typeof fetchedDoc?.amountMinor).toBe('bigint');

      // Duplicate plan for same user + category + month is rejected
      await expect(
        PlanModel.create({
          userId,
          categoryId,
          monthKey,
          amountMinor: 600000n,
        }),
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('ActualModel', () => {
    it('allows multiple actual entries per user, category, and month', async () => {
      const userId = new Types.ObjectId();
      const categoryId = new Types.ObjectId();
      const monthKey = 202601;

      const actual1 = await ActualModel.create({
        userId,
        categoryId,
        monthKey,
        amountMinor: 200000n,
        note: 'Google Ads',
      });

      const actual2 = await ActualModel.create({
        userId,
        categoryId,
        monthKey,
        amountMinor: 100000n,
        note: 'LinkedIn Ads',
      });

      const actual3 = await ActualModel.create({
        userId,
        categoryId,
        monthKey,
        amountMinor: 180000n,
        note: 'Agency',
      });

      expect(actual1.amountMinor).toBe(200000n);
      expect(actual2.amountMinor).toBe(100000n);
      expect(actual3.amountMinor).toBe(180000n);

      const entries = await ActualModel.find({ userId, categoryId, monthKey });
      expect(entries).toHaveLength(3);

      const total = entries.reduce((acc, curr) => acc + curr.amountMinor, 0n);
      expect(total).toBe(480000n); // $4,800.00
    });
  });

  describe('FinancialPeriodModel', () => {
    it('manages period state with versioning and enforces uniqueness per user/month', async () => {
      const userId = new Types.ObjectId();
      const monthKey = 202601;

      const period = await FinancialPeriodModel.create({
        userId,
        monthKey,
        status: 'OPEN',
        version: 1,
      });

      expect(period.status).toBe('OPEN');
      expect(period.version).toBe(1);
      expect(period.lockedAt).toBeNull();

      // Duplicate month for same user rejected
      await expect(
        FinancialPeriodModel.create({
          userId,
          monthKey,
          status: 'LOCKED',
          version: 1,
        }),
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('SchemaMigrationModel', () => {
    it('records migration execution', async () => {
      const migration = await SchemaMigrationModel.create({
        _id: '001_initial_indexes',
        appliedAt: new Date(),
        checksum: 'sha256_checksum_value',
      });

      expect(migration._id).toBe('001_initial_indexes');
      expect(migration.checksum).toBe('sha256_checksum_value');
    });
  });
});
