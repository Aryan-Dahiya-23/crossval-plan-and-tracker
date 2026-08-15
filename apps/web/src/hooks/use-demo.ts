'use client';

import { loadDemoSampleResponseSchema, type LoadDemoSampleDataDto } from '@crossval/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export function useLoadDemoSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LoadDemoSampleDataDto> => {
      const res = await apiClient.post('/demo/assignment-sample', {}, loadDemoSampleResponseSchema);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actuals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.periods.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
