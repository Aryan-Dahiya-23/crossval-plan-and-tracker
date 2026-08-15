import type { Request, Response } from 'express';
import type mongoose from 'mongoose';

import { createApp } from '../dist/app.js';
import { connectDatabase } from '../dist/database/connection.js';

let cachedDbPromise: Promise<typeof mongoose> | null = null;
let cachedApp: ReturnType<typeof createApp> | null = null;

async function getOrInitApp() {
  if (!cachedDbPromise) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing in Vercel project settings.');
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
      : [webOrigin, 'https://crossval-plan-and-tracker-web.vercel.app'];

    cachedApp = createApp({
      corsOrigins,
    });
  }

  return cachedApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    // If Vercel passed the internal /api prefix, strip it so Express routes match
    if (req.url?.startsWith('/api/')) {
      req.url = req.url.slice(4);
    } else if (req.url === '/api') {
      req.url = '/';
    }

    const app = await getOrInitApp();
    return app(req, res);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Serverless execution error:', errorMessage);

    res.status(500).json({
      error: {
        code: 'SERVERLESS_ERROR',
        message: errorMessage,
      },
    });
  }
}
