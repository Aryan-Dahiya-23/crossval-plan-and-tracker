'use client';

import {
  planResponseSchema,
  plansResponseSchema,
  type BatchPlanChange,
  type PlanDto,
} from '@crossval/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export function usePlans(query: { from: string; to: string; categoryId?: string }) {
  const searchParams = new URLSearchParams({
    from: query.from,
    to: query.to,
  });
  if (query.categoryId) {
    searchParams.set('categoryId', query.categoryId);
  }

  return useQuery({
    queryKey: queryKeys.plans.list({
      fromMonth: query.from,
      toMonth: query.to,
      categoryId: query.categoryId,
    }),
    queryFn: async (): Promise<PlanDto[]> => {
      const res = await apiClient.get(`/plans?${searchParams.toString()}`, plansResponseSchema);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useBatchUpsertPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changes,
      month,
    }: {
      month: string;
      changes: BatchPlanChange[];
    }): Promise<PlanDto[]> => {
      const res = await apiClient.put(`/plans/batch/${month}`, { changes }, plansResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpsertPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amountMinor,
      categoryId,
      month,
    }: {
      categoryId: string;
      month: string;
      amountMinor: string;
    }): Promise<PlanDto> => {
      const res = await apiClient.put(
        `/plans/${categoryId}/${month}`,
        { amountMinor },
        planResponseSchema,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      month,
    }: {
      categoryId: string;
      month: string;
    }): Promise<void> => {
      await apiClient.delete(`/plans/${categoryId}/${month}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
