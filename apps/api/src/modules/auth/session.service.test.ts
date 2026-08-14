import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { UserModel } from '../users/user.model.js';
import { SessionModel } from './session.model.js';
import {
  createSession,
  generateSessionToken,
  hashSessionToken,
  revokeAllUserSessions,
  revokeSession,
  validateSession,
} from './session.service.js';

describe('session.service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('generates a 64-character hex session token', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('computes deterministic HMAC-SHA-256 token hashes with pepper', () => {
    const token = 'test-token-12345';
    const hash1 = hashSessionToken(token, 'pepper1');
    const hash2 = hashSessionToken(token, 'pepper1');
    const hash3 = hashSessionToken(token, 'pepper2');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('creates and validates a valid session', async () => {
    const user = await UserModel.create({
      email: 'user@example.com',
      emailCanonical: 'user@example.com',
      passwordHash: 'dummy-hash',
    });

    const { token, expiresAt } = await createSession(user._id);
    expect(token).toBeDefined();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Verify database record stores hash, not raw token
    const stored = await SessionModel.findOne({ userId: user._id });
    expect(stored).toBeDefined();
    expect(stored?.tokenHash).toBe(hashSessionToken(token));

    // Validate session
    const principal = await validateSession(token);
    expect(principal).toEqual({
      userId: user._id,
      sessionId: stored?._id,
      email: 'user@example.com',
    });
  });

  it('returns null when validating an expired session', async () => {
    const user = await UserModel.create({
      email: 'user2@example.com',
      emailCanonical: 'user2@example.com',
      passwordHash: 'dummy-hash',
    });

    // Create session expired in the past
    const { token } = await createSession(user._id, { ttlSeconds: -10 });

    const principal = await validateSession(token);
    expect(principal).toBeNull();
  });

  it('returns null when token does not exist or user is deleted', async () => {
    expect(await validateSession('non-existent-token')).toBeNull();
    expect(await validateSession('')).toBeNull();

    const nonExistentUserId = new mongoose.Types.ObjectId();
    const { token } = await createSession(nonExistentUserId);
    expect(await validateSession(token)).toBeNull();
  });

  it('revokes a session by token', async () => {
    const user = await UserModel.create({
      email: 'user3@example.com',
      emailCanonical: 'user3@example.com',
      passwordHash: 'dummy-hash',
    });

    const { token } = await createSession(user._id);
    expect(await validateSession(token)).not.toBeNull();

    await revokeSession(token);
    expect(await validateSession(token)).toBeNull();
  });

  it('revokes all sessions for a user', async () => {
    const user = await UserModel.create({
      email: 'user4@example.com',
      emailCanonical: 'user4@example.com',
      passwordHash: 'dummy-hash',
    });

    const session1 = await createSession(user._id);
    const session2 = await createSession(user._id);

    expect(await validateSession(session1.token)).not.toBeNull();
    expect(await validateSession(session2.token)).not.toBeNull();

    await revokeAllUserSessions(user._id);

    expect(await validateSession(session1.token)).toBeNull();
    expect(await validateSession(session2.token)).toBeNull();
  });
});
