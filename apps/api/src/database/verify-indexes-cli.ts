import { connectDatabase, disconnectDatabase } from './connection.js';
import { verifyIndexes } from './indexes.js';
import { allDomainModels } from './models.js';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    console.error('MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  try {
    await connectDatabase({
      uri,
      ...(dbName ? { dbName } : {}),
      autoIndex: false,
    });
    const report = await verifyIndexes(allDomainModels);

    console.log('\n--- MongoDB Index Verification Report ---');
    for (const result of report.results) {
      const status = result.isValid ? '✓ VALID' : '✗ INVALID';
      console.log(`[${status}] Collection "${result.collectionName}"`);
      if (!result.isValid) {
        console.log(`  Missing indexes: ${result.missingIndexes.join(', ')}`);
      }
    }
    console.log('-----------------------------------------\n');

    await disconnectDatabase();

    if (!report.isValid) {
      console.error('Index verification failed: missing indexes detected.');
      process.exit(1);
    } else {
      console.log('All declared indexes verified successfully.');
    }
  } catch (error) {
    console.error('Index verification encountered an error:', error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

void main();
