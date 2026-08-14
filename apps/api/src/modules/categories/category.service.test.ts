import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  CategoryAlreadyExistsError,
  CategoryArchivedError,
  NotFoundError,
} from '../../http/errors.js';
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../test/database-helper.js';
import { CategoryModel } from './category.model.js';
import {
  archiveCategory,
  assertActiveCategory,
  createCategory,
  getCategoryById,
  listCategories,
  toCategoryDto,
  updateCategory,
} from './category.service.js';

describe('category.service', () => {
  const userId1 = new mongoose.Types.ObjectId();
  const userId2 = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('createCategory and toCategoryDto', () => {
    it('serializes a category document to CategoryDto with toCategoryDto', async () => {
      const doc = await CategoryModel.create({
        userId: userId1,
        name: 'Direct Test',
        nameCanonical: 'direct test',
        colorKey: 'blue',
        archivedAt: null,
      });

      const dto = toCategoryDto(doc);
      expect(dto).toEqual({
        id: doc._id.toString(),
        name: 'Direct Test',
        colorKey: 'blue',
        archivedAt: null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      });
    });

    it('creates a new category with trimmed and canonical names', async () => {
      const created = await createCategory(userId1, {
        name: '  Marketing  ',
        colorKey: 'purple',
      });

      expect(created.name).toBe('Marketing');
      expect(created.colorKey).toBe('purple');
      expect(created.archivedAt).toBeNull();
      expect(created.id).toBeDefined();

      const doc = await CategoryModel.findById(created.id);
      expect(doc?.nameCanonical).toBe('marketing');
      expect(doc?.userId.toString()).toBe(userId1.toString());
    });

    it('rejects duplicate canonical name for the same user', async () => {
      await createCategory(userId1, { name: 'Payroll' });

      await expect(createCategory(userId1, { name: 'payroll' })).rejects.toThrow(
        CategoryAlreadyExistsError,
      );

      await expect(createCategory(userId1, { name: '  PAYROLL  ' })).rejects.toThrow(
        CategoryAlreadyExistsError,
      );
    });

    it('allows different users to have categories with identical names', async () => {
      const user1Cat = await createCategory(userId1, { name: 'Software' });
      const user2Cat = await createCategory(userId2, { name: 'Software' });

      expect(user1Cat.name).toBe('Software');
      expect(user2Cat.name).toBe('Software');
      expect(user1Cat.id).not.toBe(user2Cat.id);
    });
  });

  describe('listCategories', () => {
    it('returns owned categories sorted alphabetically by name', async () => {
      await createCategory(userId1, { name: 'Software' });
      await createCategory(userId1, { name: 'Marketing' });
      await createCategory(userId1, { name: 'Analytics' });
      // Other user's category should not be listed
      await createCategory(userId2, { name: 'Consulting' });

      const list = await listCategories(userId1);
      expect(list.map((c) => c.name)).toEqual(['Analytics', 'Marketing', 'Software']);
    });

    it('filters out archived categories by default and includes them when requested', async () => {
      const active = await createCategory(userId1, { name: 'Marketing' });
      const archived = await createCategory(userId1, { name: 'Legacy Marketing' });
      await archiveCategory(userId1, archived.id);

      const defaultList = await listCategories(userId1);
      expect(defaultList).toHaveLength(1);
      expect(defaultList[0]?.id).toBe(active.id);

      const allList = await listCategories(userId1, { includeArchived: true });
      expect(allList).toHaveLength(2);
      expect(allList.find((c) => c.id === archived.id)?.archivedAt).not.toBeNull();
    });
  });

  describe('getCategoryById', () => {
    it('retrieves an owned category', async () => {
      const created = await createCategory(userId1, { name: 'Travel' });
      const fetched = await getCategoryById(userId1, created.id);

      expect(fetched).toEqual(created);
    });

    it('throws NotFoundError for non-existent category', async () => {
      const randomId = new mongoose.Types.ObjectId();
      await expect(getCategoryById(userId1, randomId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when attempting to fetch another user category', async () => {
      const user2Cat = await createCategory(userId2, { name: 'Private User 2 Cat' });
      await expect(getCategoryById(userId1, user2Cat.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateCategory', () => {
    it('updates category name and colorKey', async () => {
      const created = await createCategory(userId1, {
        name: 'Tools',
        colorKey: 'blue',
      });

      const updated = await updateCategory(userId1, created.id, {
        name: 'Dev Tools',
        colorKey: 'amber',
      });

      expect(updated.name).toBe('Dev Tools');
      expect(updated.colorKey).toBe('amber');

      const doc = await CategoryModel.findById(created.id);
      expect(doc?.nameCanonical).toBe('dev tools');
    });

    it('rejects rename if new name conflicts with another owned category', async () => {
      await createCategory(userId1, { name: 'Marketing' });
      const cat2 = await createCategory(userId1, { name: 'Sales' });

      await expect(updateCategory(userId1, cat2.id, { name: 'marketing' })).rejects.toThrow(
        CategoryAlreadyExistsError,
      );
    });

    it('allows updating colorKey without changing name', async () => {
      const created = await createCategory(userId1, {
        name: 'Marketing',
        colorKey: 'blue',
      });

      const updated = await updateCategory(userId1, created.id, {
        colorKey: 'purple',
      });

      expect(updated.name).toBe('Marketing');
      expect(updated.colorKey).toBe('purple');
    });

    it('throws NotFoundError when updating another user category', async () => {
      const user2Cat = await createCategory(userId2, { name: 'User 2 Category' });

      await expect(updateCategory(userId1, user2Cat.id, { name: 'Hacked Name' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('archiveCategory', () => {
    it('sets archivedAt on the category and is idempotent', async () => {
      const created = await createCategory(userId1, { name: 'Old Software' });
      expect(created.archivedAt).toBeNull();

      const archived = await archiveCategory(userId1, created.id);
      expect(archived.archivedAt).not.toBeNull();

      const reArchived = await archiveCategory(userId1, created.id);
      expect(reArchived.archivedAt).toBe(archived.archivedAt);
    });

    it('throws NotFoundError when archiving another user category', async () => {
      const user2Cat = await createCategory(userId2, { name: 'User 2 Category' });

      await expect(archiveCategory(userId1, user2Cat.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('assertActiveCategory', () => {
    it('returns category document for an active category', async () => {
      const created = await createCategory(userId1, { name: 'Active Cat' });
      const doc = await assertActiveCategory(userId1, created.id);

      expect(doc._id.toString()).toBe(created.id);
      expect(doc.name).toBe('Active Cat');
    });

    it('throws CategoryArchivedError for an archived category', async () => {
      const created = await createCategory(userId1, { name: 'Archived Cat' });
      await archiveCategory(userId1, created.id);

      await expect(assertActiveCategory(userId1, created.id)).rejects.toThrow(
        CategoryArchivedError,
      );
    });

    it('throws NotFoundError for non-existent or cross-user category', async () => {
      const user2Cat = await createCategory(userId2, { name: 'User 2 Cat' });

      await expect(assertActiveCategory(userId1, user2Cat.id)).rejects.toThrow(NotFoundError);
    });
  });
});
