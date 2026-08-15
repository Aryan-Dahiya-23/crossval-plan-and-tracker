import type { Request, Response } from 'express';
import type mongoose from 'mongoose';

import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';

let cachedDbPromise: Promise<typeof mongoose> | null = null;
let cachedApp: ReturnType<typeof createApp> | null = null;

async function getOrInitApp() {
  if (!cachedDbPromise) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required.');
    }
    cachedDbPromise = connectDatabase({
      uri: mongoUri,
      dbName: process.env.MONGODB_DB_NAME || 'crossval',
      autoIndex: false,
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
  }

  await cachedDbPromise;

  if (!cachedApp) {
    const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : [webOrigin];

    cachedApp = createApp({
      corsOrigins,
    });
  }

  return cachedApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await getOrInitApp();
  return app(req, res);
}
