import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@crossval/contracts';
import type { Types } from 'mongoose';

import {
  CategoryAlreadyExistsError,
  CategoryArchivedError,
  NotFoundError,
} from '../../http/errors.js';
import { CategoryModel, type CategoryDocument, type ICategory } from './category.model.js';

/**
 * Maps an internal Mongoose Category document to the public CategoryDto.
 */
export function toCategoryDto(category: ICategory): CategoryDto {
  return {
    id: category._id.toString(),
    name: category.name,
    colorKey: category.colorKey,
    archivedAt: category.archivedAt ? category.archivedAt.toISOString() : null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export interface ListCategoriesOptions {
  includeArchived?: boolean | undefined;
}

/**
 * Retrieves owned categories for a user, sorted alphabetically by name.
 * By default, archived categories are excluded unless includeArchived is true.
 */
export async function listCategories(
  userId: Types.ObjectId,
  options: ListCategoriesOptions = {},
): Promise<CategoryDto[]> {
  const { includeArchived = false } = options;

  const query: Record<string, unknown> = { userId };
  if (!includeArchived) {
    query['archivedAt'] = null;
  }

  const categories = await CategoryModel.find(query).sort({ name: 1 }).exec();

  return categories.map(toCategoryDto);
}

/**
 * Retrieves a single category by ID scoped strictly to the authenticated user.
 * Throws NotFoundError if the category does not exist or belongs to another user.
 */
export async function getCategoryById(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
): Promise<CategoryDto> {
  const category = await CategoryModel.findOne({ _id: categoryId, userId }).exec();

  if (!category) {
    throw new NotFoundError('Category not found.');
  }

  return toCategoryDto(category);
}

/**
 * Creates a new owned category.
 * Enforces per-user canonical name uniqueness.
 */
export async function createCategory(
  userId: Types.ObjectId,
  input: CreateCategoryRequest,
): Promise<CategoryDto> {
  const nameTrimmed = input.name.trim();
  const nameCanonical = nameTrimmed.toLowerCase();
  const colorKey = input.colorKey ? input.colorKey.trim() : 'blue';

  const existing = await CategoryModel.findOne({ userId, nameCanonical }).exec();
  if (existing) {
    throw new CategoryAlreadyExistsError();
  }

  try {
    const category = new CategoryModel({
      userId,
      name: nameTrimmed,
      nameCanonical,
      colorKey,
      archivedAt: null,
    });

    await category.save();
    return toCategoryDto(category);
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 11000
    ) {
      throw new CategoryAlreadyExistsError();
    }
    throw err;
  }
}

/**
 * Updates an owned category's name and/or colorKey.
 * Checks for name collision against other categories owned by this user.
 */
export async function updateCategory(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
  input: UpdateCategoryRequest,
): Promise<CategoryDto> {
  const category = await CategoryModel.findOne({ _id: categoryId, userId }).exec();

  if (!category) {
    throw new NotFoundError('Category not found.');
  }

  if (input.name !== undefined) {
    const nameTrimmed = input.name.trim();
    const nameCanonical = nameTrimmed.toLowerCase();

    if (nameCanonical !== category.nameCanonical) {
      const conflict = await CategoryModel.findOne({
        userId,
        nameCanonical,
        _id: { $ne: category._id },
      }).exec();

      if (conflict) {
        throw new CategoryAlreadyExistsError();
      }

      category.name = nameTrimmed;
      category.nameCanonical = nameCanonical;
    }
  }

  if (input.colorKey !== undefined) {
    category.colorKey = input.colorKey.trim();
  }

  try {
    await category.save();
    return toCategoryDto(category);
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 11000
    ) {
      throw new CategoryAlreadyExistsError();
    }
    throw err;
  }
}

/**
 * Soft-archives an owned category. Idempotent.
 * Sets archivedAt to the current timestamp.
 */
export async function archiveCategory(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
): Promise<CategoryDto> {
  const category = await CategoryModel.findOne({ _id: categoryId, userId }).exec();

  if (!category) {
    throw new NotFoundError('Category not found.');
  }

  if (category.archivedAt === null) {
    category.archivedAt = new Date();
    await category.save();
  }

  return toCategoryDto(category);
}

/**
 * Domain guard helper used by Plans and Actuals modules.
 * Verifies that the category exists, is owned by userId, and is not archived.
 */
export async function assertActiveCategory(
  userId: Types.ObjectId,
  categoryId: string | Types.ObjectId,
): Promise<CategoryDocument> {
  const category = await CategoryModel.findOne({ _id: categoryId, userId }).exec();

  if (!category) {
    throw new NotFoundError('Category not found.');
  }

  if (category.archivedAt !== null) {
    throw new CategoryArchivedError();
  }

  return category;
}
