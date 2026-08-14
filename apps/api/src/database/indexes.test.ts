import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { setupTestDatabase, teardownTestDatabase } from '../test/database-helper.js';
import { ensureIndexes, verifyIndexes } from './indexes.js';
import { allDomainModels } from './models.js';

describe('Database Indexes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('verifies that all declared domain model indexes exist in the database', async () => {
    await ensureIndexes(allDomainModels);
    const report = await verifyIndexes(allDomainModels);

    expect(report.isValid).toBe(true);
    expect(report.results.length).toBe(allDomainModels.length);

    for (const result of report.results) {
      expect(result.isValid).toBe(true);
      expect(result.missingIndexes).toHaveLength(0);
      expect(result.existingIndexes).toContain('_id_');
    }
  });

  it('includes specific critical unique indexes', async () => {
    const report = await verifyIndexes(allDomainModels);

    const userResult = report.results.find((r) => r.collectionName === 'users');
    expect(userResult?.existingIndexes).toContain('emailCanonical_1');

    const categoryResult = report.results.find((r) => r.collectionName === 'categories');
    expect(categoryResult?.existingIndexes).toContain('userId_1_nameCanonical_1');
    expect(categoryResult?.existingIndexes).toContain('userId_1_archivedAt_1_name_1');

    const planResult = report.results.find((r) => r.collectionName === 'plans');
    expect(planResult?.existingIndexes).toContain('userId_1_categoryId_1_monthKey_1');

    const periodResult = report.results.find((r) => r.collectionName === 'financialPeriods');
    expect(periodResult?.existingIndexes).toContain('userId_1_monthKey_1');
  });
});
