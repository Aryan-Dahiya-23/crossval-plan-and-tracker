import crypto from 'node:crypto';
import type { ClientSession, Types } from 'mongoose';

import { UserModel } from '../users/user.model.js';
import { SessionModel } from './session.model.js';

export const DEFAULT_SESSION_TTL_SECONDS = 604800; // 7 days

export interface AuthenticatedPrincipal {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  email: string;
}

export interface CreateSessionOptions {
  session?: ClientSession | undefined;
  ttlSeconds?: number | undefined;
}

export function getSessionPepper(): string {
  const pepper = process.env.SESSION_TOKEN_PEPPER;
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_TOKEN_PEPPER environment variable is required in production.');
    }
    return 'dev_session_token_pepper_secret_1234567890';
  }
  return pepper;
}

/**
 * Generates an opaque, cryptographically random 256-bit session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a session token using HMAC-SHA-256 with the server pepper.
 * Storing hashes rather than raw tokens protects sessions if the database is compromised.
 */
export function hashSessionToken(token: string, pepper = getSessionPepper()): string {
  return crypto.createHmac('sha256', pepper).update(token).digest('hex');
}

/**
 * Creates a new database session for an authenticated user.
 */
export async function createSession(
  userId: Types.ObjectId,
  options?: CreateSessionOptions,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const ttlSeconds = options?.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const sessionDoc = new SessionModel({
    userId,
    tokenHash,
    expiresAt,
    lastSeenAt: new Date(),
  });

  await sessionDoc.save({ ...(options?.session ? { session: options.session } : {}) });

  return {
    token,
    expiresAt,
  };
}

/**
 * Validates a session token, checking expiration and verifying user existence.
 * Returns the authenticated principal or null if invalid/expired.
 */
export async function validateSession(token: string): Promise<AuthenticatedPrincipal | null> {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const session = await SessionModel.findOne({
    tokenHash,
    expiresAt: { $gt: now },
  }).exec();

  if (!session) {
    return null;
  }

  const user = await UserModel.findById(session.userId).exec();
  if (!user) {
    return null;
  }

  await SessionModel.updateOne({ _id: session._id }, { $set: { lastSeenAt: now } }).exec();

  return {
    userId: user._id,
    sessionId: session._id,
    email: user.email,
  };
}

/**
 * Revokes a single session by raw token. Idempotent.
 */
export async function revokeSession(token: string): Promise<void> {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }

  const tokenHash = hashSessionToken(token);
  await SessionModel.deleteOne({ tokenHash }).exec();
}

/**
 * Revokes all sessions belonging to a user (e.g. for security reset).
 */
export async function revokeAllUserSessions(userId: Types.ObjectId): Promise<void> {
  await SessionModel.deleteMany({ userId }).exec();
}
