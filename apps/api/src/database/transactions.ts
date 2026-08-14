import mongoose, { type ClientSession, type Connection, type mongo } from 'mongoose';

export type TransactionWorkFn<T> = (session: ClientSession) => Promise<T>;

export interface RunInTransactionOptions {
  connection?: Connection | undefined;
  transactionOptions?: mongo.TransactionOptions | undefined;
}

export async function runInTransaction<T>(
  workFn: TransactionWorkFn<T>,
  options?: RunInTransactionOptions,
): Promise<T> {
  const conn = options?.connection ?? mongoose.connection;

  if (conn.readyState !== 1) {
    throw new Error('Cannot start transaction: database is not connected.');
  }

  const session = await conn.startSession();

  try {
    let result!: T;

    await session.withTransaction(async () => {
      result = await workFn(session);
    }, options?.transactionOptions);

    return result;
  } finally {
    await session.endSession();
  }
}
