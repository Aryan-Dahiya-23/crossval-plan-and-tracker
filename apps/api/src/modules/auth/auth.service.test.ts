import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { EmailAlreadyExistsError, InvalidCredentialsError } from '../../http/errors.js';
import { CategoryModel } from '../categories/category.model.js';
import { UserModel } from '../users/user.model.js';
import {
  DEFAULT_CATEGORIES,
  getCurrentUser,
  login,
  logout,
  signup,
  toUserDto,
} from './auth.service.js';

describe('auth.service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('signup', () => {
    it('creates user, seeds default categories, and issues session token in a transaction', async () => {
      const result = await signup({
        email: 'founder@example.com',
        password: 'securePassword123!',
      });

      expect(result.user.email).toBe('founder@example.com');
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Verify User in database
      const user = await UserModel.findById(result.user.id);
      expect(user).toBeDefined();
      expect(user?.emailCanonical).toBe('founder@example.com');

      // Verify 5 default categories were seeded
      const categories = await CategoryModel.find({ userId: user!._id });
      expect(categories).toHaveLength(5);

      const categoryNames = categories.map((c) => c.name);
      for (const defaultCat of DEFAULT_CATEGORIES) {
        expect(categoryNames).toContain(defaultCat.name);
      }
    });

    it('rejects duplicate email registration with EmailAlreadyExistsError', async () => {
      await signup({
        email: 'duplicate@example.com',
        password: 'password123',
      });

      await expect(
        signup({
          email: 'duplicate@example.com',
          password: 'differentPassword123',
        }),
      ).rejects.toThrow(EmailAlreadyExistsError);
    });

    it('rejects case-variant email registration as duplicate', async () => {
      await signup({
        email: 'case@example.com',
        password: 'password123',
      });

      await expect(
        signup({
          email: 'CASE@EXAMPLE.COM',
          password: 'password123',
        }),
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await signup({
        email: 'user@example.com',
        password: 'correct-password-123',
      });
    });

    it('authenticates valid credentials and issues session token', async () => {
      const result = await login({
        email: 'user@example.com',
        password: 'correct-password-123',
      });

      expect(result.user.email).toBe('user@example.com');
      expect(result.token).toBeDefined();
    });

    it('authenticates case-insensitively for email', async () => {
      const result = await login({
        email: 'USER@EXAMPLE.COM',
        password: 'correct-password-123',
      });

      expect(result.user.email).toBe('user@example.com');
      expect(result.token).toBeDefined();
    });

    it('throws InvalidCredentialsError for non-existent email', async () => {
      await expect(
        login({
          email: 'nonexistent@example.com',
          password: 'correct-password-123',
        }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throws InvalidCredentialsError for incorrect password', async () => {
      await expect(
        login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('logout and getCurrentUser', () => {
    it('retrieves user with valid session and revokes with logout', async () => {
      const { user, token } = await signup({
        email: 'logout.test@example.com',
        password: 'password123',
      });

      const current = await getCurrentUser(token);
      expect(current).toEqual(user);

      await logout(token);

      const afterLogout = await getCurrentUser(token);
      expect(afterLogout).toBeNull();
    });
  });

  describe('toUserDto', () => {
    it('serializes user document without passwordHash', async () => {
      const userDoc = await UserModel.create({
        email: 'dto.test@example.com',
        emailCanonical: 'dto.test@example.com',
        passwordHash: 'secret-hash-value',
      });

      const userDto = toUserDto(userDoc);

      expect(userDto).toEqual({
        id: userDoc._id.toString(),
        email: 'dto.test@example.com',
        createdAt: userDoc.createdAt.toISOString(),
        updatedAt: userDoc.updatedAt.toISOString(),
      });
      expect(userDto).not.toHaveProperty('passwordHash');
    });
  });
});
