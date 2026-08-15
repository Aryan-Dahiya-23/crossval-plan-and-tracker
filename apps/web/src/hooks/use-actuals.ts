'use client';

import {
  actualResponseSchema,
  actualsResponseSchema,
  importActualsResponseSchema,
  type ActualDto,
  type CreateActualRequest,
  type ImportActualsRequest,
  type ImportActualsResponse,
  type UpdateActualRequest,
} from '@crossval/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';

export function useActuals(
  query: {
    from?: string | undefined;
    to?: string | undefined;
    categoryId?: string | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
  } = {},
) {
  const searchParams = new URLSearchParams();
  if (query.from) searchParams.set('from', query.from);
  if (query.to) searchParams.set('to', query.to);
  if (query.categoryId) searchParams.set('categoryId', query.categoryId);
  if (query.cursor) searchParams.set('cursor', query.cursor);
  if (query.limit) searchParams.set('limit', query.limit.toString());

  const queryString = searchParams.toString();
  const url = queryString ? `/actuals?${queryString}` : '/actuals';

  return useQuery({
    queryKey: queryKeys.actuals.list({
      fromMonth: query.from,
      toMonth: query.to,
      categoryId: query.categoryId,
    }),
    queryFn: async (): Promise<{
      data: ActualDto[];
      hasMore: boolean;
      nextCursor: string | null;
    }> => {
      const res = await apiClient.get(url, actualsResponseSchema);
      return {
        data: res.data,
        hasMore: res.meta.hasMore,
        nextCursor: res.meta.nextCursor,
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateActual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActualRequest): Promise<ActualDto> => {
      const res = await apiClient.post('/actuals', data, actualResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useImportActuals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportActualsRequest): Promise<ImportActualsResponse['data']> => {
      const res = await apiClient.post('/actuals/import', data, importActualsResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateActual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      id: string;
      data: UpdateActualRequest;
    }): Promise<ActualDto> => {
      const res = await apiClient.patch(`/actuals/${id}`, data, actualResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useDeleteActual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/actuals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
