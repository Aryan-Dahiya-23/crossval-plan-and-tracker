import { connectDatabase, disconnectDatabase } from './connection.js';
import { ensureIndexes, verifyIndexes } from './indexes.js';
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
    console.log('Ensuring all declared indexes in MongoDB...');
    await ensureIndexes(allDomainModels);

    const report = await verifyIndexes(allDomainModels);
    await disconnectDatabase();

    if (report.isValid) {
      console.log('All indexes created and verified successfully.');
    } else {
      console.error('Some indexes could not be verified after creation.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Index creation encountered an error:', error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

void main();
