import type { Connection } from 'mongoose';

export function assertTestDatabase(connection: Connection): void {
  const dbName = connection.db?.databaseName ?? connection.name;

  if (!dbName) {
    throw new Error('Database name cannot be determined from the active connection.');
  }

  const normalized = dbName.toLowerCase();
  const isExplicitTestDb =
    normalized.includes('test') || normalized.startsWith('cv_test_') || normalized === 'test';

  if (!isExplicitTestDb) {
    throw new Error(
      `Dangerous database operation blocked: "${dbName}" is not explicitly marked as a test database.`,
    );
  }
}

export function assertSafeEnvironmentForIndexSync(environment: string | undefined): void {
  if (environment === 'production') {
    throw new Error(
      'Blind autoIndex/syncIndexes execution is forbidden in production environments.',
    );
  }
}
