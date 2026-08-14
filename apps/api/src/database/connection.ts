import mongoose, { type Mongoose } from 'mongoose';

export interface DatabaseConnectionOptions {
  uri: string;
  dbName?: string | undefined;
  autoIndex?: boolean | undefined;
  maxPoolSize?: number | undefined;
  minPoolSize?: number | undefined;
  serverSelectionTimeoutMS?: number | undefined;
}

export async function connectDatabase(options: DatabaseConnectionOptions): Promise<Mongoose> {
  const {
    uri,
    dbName,
    autoIndex = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
    maxPoolSize = 10,
    minPoolSize = 2,
    serverSelectionTimeoutMS = 5000,
  } = options;

  if (!uri) {
    throw new Error('Database connection URI must be provided.');
  }

  mongoose.set('strict', true);
  mongoose.set('strictQuery', true);
  mongoose.set('autoIndex', autoIndex);

  const connectOptions: mongoose.ConnectOptions = {
    autoIndex,
    maxPoolSize,
    minPoolSize,
    serverSelectionTimeoutMS,
    ...(dbName ? { dbName } : {}),
  };

  await mongoose.connect(uri, connectOptions);

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseConnectionState():
  'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'uninitialized' {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'uninitialized';
  }
}
