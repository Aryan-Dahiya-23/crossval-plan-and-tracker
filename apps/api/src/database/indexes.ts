import type { Model } from 'mongoose';

import { allDomainModels } from './models.js';

export interface IndexVerificationResult {
  collectionName: string;
  expectedIndexes: string[];
  existingIndexes: string[];
  missingIndexes: string[];
  isValid: boolean;
}

export interface DatabaseIndexReport {
  isValid: boolean;
  results: IndexVerificationResult[];
}

export async function ensureIndexes(
  models: readonly Model<unknown>[] = allDomainModels,
): Promise<void> {
  for (const model of models) {
    await model.createIndexes();
  }
}

export async function verifyIndexes(
  models: readonly Model<unknown>[] = allDomainModels,
): Promise<DatabaseIndexReport> {
  const results: IndexVerificationResult[] = [];
  let allValid = true;

  for (const model of models) {
    const collectionName = model.collection.name;
    const schemaIndexes = model.schema.indexes();

    // Mongoose schema indexes format: [ [ { key: 1 }, { options } ] ]
    const expectedIndexNames = ['_id_'];
    for (const [fields, options] of schemaIndexes) {
      if (options?.name) {
        expectedIndexNames.push(options.name);
      } else {
        // Default index name construction in MongoDB: field1_1_field2_-1
        const autoName = Object.entries(fields)
          .map(([key, val]) => `${key}_${val}`)
          .join('_');
        expectedIndexNames.push(autoName);
      }
    }

    let existingIndexes: string[] = [];
    try {
      const liveIndexes = await model.collection.indexes();
      existingIndexes = liveIndexes
        .map((idx) => idx.name)
        .filter((name): name is string => typeof name === 'string');
    } catch {
      // Collection may not exist yet if no writes or index creation occurred
      existingIndexes = [];
    }

    const missingIndexes = expectedIndexNames.filter(
      (expected) => !existingIndexes.includes(expected),
    );

    const isValid = missingIndexes.length === 0;
    if (!isValid) {
      allValid = false;
    }

    results.push({
      collectionName,
      expectedIndexes: expectedIndexNames,
      existingIndexes,
      missingIndexes,
      isValid,
    });
  }

  return {
    isValid: allValid,
    results,
  };
}
