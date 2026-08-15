'use client';

import { reportResponseSchema, type ReportDto } from '@crossval/contracts';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export function usePlanVsActualReport(query: {
  from: string;
  to: string;
  categoryId?: string | undefined;
}) {
  const searchParams = new URLSearchParams({
    from: query.from,
    to: query.to,
  });
  if (query.categoryId) {
    searchParams.set('categoryId', query.categoryId);
  }

  return useQuery({
    queryKey: queryKeys.reports.planVsActual({
      fromMonth: query.from,
      toMonth: query.to,
      categoryId: query.categoryId,
    }),
    queryFn: async (): Promise<ReportDto> => {
      const res = await apiClient.get(
        `/reports/plan-vs-actual?${searchParams.toString()}`,
        reportResponseSchema,
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
