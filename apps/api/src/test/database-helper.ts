import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { assertTestDatabase } from '../database/guards.js';
import { ensureIndexes } from '../database/indexes.js';

let replSet: MongoMemoryReplSet | null = null;

export async function setupTestDatabase(): Promise<string> {
  if (!replSet) {
    replSet = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger',
      },
    });
  }

  const uri = replSet.getUri();
  const dbName = `cv_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  await connectDatabase({
    uri,
    dbName,
    autoIndex: true,
  });

  assertTestDatabase(mongoose.connection);
  await ensureIndexes();

  return uri;
}

export async function clearTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    assertTestDatabase(mongoose.connection);

    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
}

export async function teardownTestDatabase(): Promise<void> {
  await disconnectDatabase();

  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}
