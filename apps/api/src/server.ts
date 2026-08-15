import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';

// Auto-load root or local .env file in development if present
const rootEnvPath = resolve(process.cwd(), '../../.env');
const localEnvPath = resolve(process.cwd(), '.env');
if (existsSync(rootEnvPath)) {
  try {
    process.loadEnvFile(rootEnvPath);
  } catch {
    // ignore
  }
} else if (existsSync(localEnvPath)) {
  try {
    process.loadEnvFile(localEnvPath);
  } catch {
    // ignore
  }
}

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  console.warn('Warning: MONGODB_URI is not set. Database connections will fail on startup.');
}

if (!process.env.SESSION_TOKEN_PEPPER) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_TOKEN_PEPPER environment variable is required in production.');
  } else {
    console.warn('Warning: SESSION_TOKEN_PEPPER is not set. Using local development fallback.');
  }
}

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

const app = createApp({ corsOrigins });

let devReplSet: { stop: () => Promise<boolean>; getUri: () => string } | null = null;

async function startServer(): Promise<void> {
  let activeUri = mongoUri;
  const isPlaceholderOrMissing = !activeUri || activeUri.includes('<');

  if (isPlaceholderOrMissing) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('A valid MONGODB_URI environment variable is required in production.');
    }
    console.log(
      'No valid external MONGODB_URI found. Starting local in-memory MongoDB replica set for development...',
    );
    try {
      const { MongoMemoryReplSet } = await import('mongodb-memory-server');
      devReplSet = await MongoMemoryReplSet.create({
        replSet: {
          count: 1,
          storageEngine: 'wiredTiger',
        },
      });
      activeUri = devReplSet.getUri();
      console.log('Local in-memory MongoDB replica set started.');
    } catch (err) {
      console.error('Failed to start local in-memory MongoDB:', err);
    }
  }

  if (activeUri) {
    try {
      await connectDatabase({
        uri: activeUri,
        ...(mongoDbName ? { dbName: mongoDbName } : {}),
      });
      console.log('Connected to MongoDB.');
    } catch (err) {
      console.error('Failed to connect to MongoDB on startup:', err);
    }
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on port ${port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('MongoDB disconnected.');
      if (devReplSet) {
        await devReplSet.stop();
        console.log('Local in-memory MongoDB replica set stopped.');
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forcing process termination after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void startServer();
