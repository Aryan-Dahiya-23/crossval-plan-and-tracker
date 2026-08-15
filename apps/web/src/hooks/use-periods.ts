'use client';

import {
  financialPeriodResponseSchema,
  financialPeriodsResponseSchema,
  type FinancialPeriodDto,
} from '@crossval/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export function usePeriods(query: { from: string; to: string }) {
  const searchParams = new URLSearchParams({
    from: query.from,
    to: query.to,
  });

  return useQuery({
    queryKey: queryKeys.periods.list({ fromMonth: query.from, toMonth: query.to }),
    queryFn: async (): Promise<FinancialPeriodDto[]> => {
      const res = await apiClient.get(
        `/periods?${searchParams.toString()}`,
        financialPeriodsResponseSchema,
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useLockPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string): Promise<FinancialPeriodDto> => {
      const res = await apiClient.post(`/periods/${month}/lock`, {}, financialPeriodResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
