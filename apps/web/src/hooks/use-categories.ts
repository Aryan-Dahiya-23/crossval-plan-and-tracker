'use client';

import {
  categoriesResponseSchema,
  categoryResponseSchema,
  type CategoryDto,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from '@crossval/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export function useCategories(options: { includeArchived?: boolean } = {}) {
  const queryParams = options.includeArchived ? '?includeArchived=true' : '';

  return useQuery({
    queryKey: queryKeys.categories.list(options),
    queryFn: async (): Promise<CategoryDto[]> => {
      const res = await apiClient.get(`/categories${queryParams}`, categoriesResponseSchema);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest): Promise<CategoryDto> => {
      const res = await apiClient.post('/categories', data, categoryResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      id: string;
      data: UpdateCategoryRequest;
    }): Promise<CategoryDto> => {
      const res = await apiClient.patch(`/categories/${id}`, data, categoryResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
    },
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<CategoryDto> => {
      const res = await apiClient.delete(`/categories/${id}`);
      // DELETE returns 200 with CategoryDto
      return res as unknown as CategoryDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
