import { z } from 'zod';

export const adminCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .optional(),
  description: z
    .string()
    .trim()
    .optional()
    .default(''),
  image: z
    .string()
    .optional()
    .default(''),
  isActive: z
    .boolean()
    .default(true)
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export const adminSubcategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Subcategory name must be at least 2 characters')
    .max(100, 'Subcategory name cannot exceed 100 characters'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Please select a parent category'),
  categoryName: z
    .string()
    .optional(),
  slug: z
    .string()
    .trim()
    .optional(),
  description: z
    .string()
    .trim()
    .optional()
    .default(''),
  image: z
    .string()
    .optional()
    .default(''),
  isActive: z
    .boolean()
    .default(true)
});

export type AdminSubcategoryInput = z.infer<typeof adminSubcategorySchema>;

