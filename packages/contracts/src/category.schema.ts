import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');

export const categoryParamsSchema = z.object({
  id: objectIdSchema,
});

export type CategoryParams = z.infer<typeof categoryParamsSchema>;

export const createCategoryRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(50, 'Category name must not exceed 50 characters.'),
  colorKey: z.string().trim().max(30).optional(),
});

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export const updateCategoryRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name must not be empty.')
      .max(50, 'Category name must not exceed 50 characters.')
      .optional(),
    colorKey: z.string().trim().max(30).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.colorKey !== undefined,
    'At least one property (name or colorKey) must be provided.',
  );

export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;

export const listCategoriesQuerySchema = z.object({
  includeArchived: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true' || val === '1';
      }
      return Boolean(val);
    }, z.boolean())
    .optional()
    .default(false),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const categoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorKey: z.string(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CategoryDto = z.infer<typeof categoryDtoSchema>;

export const categoryResponseSchema = z.object({
  data: categoryDtoSchema,
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

export const categoriesResponseSchema = z.object({
  data: z.array(categoryDtoSchema),
});

export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;
