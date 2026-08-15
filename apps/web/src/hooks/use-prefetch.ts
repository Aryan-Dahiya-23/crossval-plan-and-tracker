'use client';

import {
  actualsResponseSchema,
  categoriesResponseSchema,
  financialPeriodsResponseSchema,
  plansResponseSchema,
  reportResponseSchema,
} from '@crossval/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';

/**
 * Hook providing route prefetching helpers for hover & focus interactions.
 * Warms React Query cache in the background before the user clicks navigation links.
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient();

  const prefetchDashboard = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.reports.planVsActual({
        fromMonth: '2026-01',
        toMonth: '2026-12',
      }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/reports/plan-vs-actual?from=2026-01&to=2026-12',
          reportResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  const prefetchPlanning = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.plans.list({
        fromMonth: '2026-01',
        toMonth: '2026-12',
      }),
      queryFn: async () => {
        const res = await apiClient.get('/plans?from=2026-01&to=2026-12', plansResponseSchema);
        return res.data;
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list({ includeArchived: true }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/categories?includeArchived=true',
          categoriesResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.periods.list({ fromMonth: '2026-01', toMonth: '2026-12' }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/periods?from=2026-01&to=2026-12',
          financialPeriodsResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  const prefetchActuals = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.actuals.list({
        fromMonth: '2026-01',
        toMonth: '2026-12',
      }),
      queryFn: async () => {
        const res = await apiClient.get('/actuals?from=2026-01&to=2026-12', actualsResponseSchema);
        return {
          data: res.data,
          hasMore: res.meta.hasMore,
          nextCursor: res.meta.nextCursor,
        };
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list({ includeArchived: true }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/categories?includeArchived=true',
          categoriesResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.periods.list({ fromMonth: '2026-01', toMonth: '2026-12' }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/periods?from=2026-01&to=2026-12',
          financialPeriodsResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  const prefetchReport = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.reports.planVsActual({
        fromMonth: '2026-01',
        toMonth: '2026-12',
      }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/reports/plan-vs-actual?from=2026-01&to=2026-12',
          reportResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list({ includeArchived: true }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/categories?includeArchived=true',
          categoriesResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.periods.list({ fromMonth: '2026-01', toMonth: '2026-12' }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/periods?from=2026-01&to=2026-12',
          financialPeriodsResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  const prefetchCategories = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list({ includeArchived: true }),
      queryFn: async () => {
        const res = await apiClient.get(
          '/categories?includeArchived=true',
          categoriesResponseSchema,
        );
        return res.data;
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  const prefetchRoute = useCallback(
    (href: string) => {
      if (href === '/dashboard' || href === '/') {
        prefetchDashboard();
      } else if (href === '/planning') {
        prefetchPlanning();
      } else if (href === '/actuals') {
        prefetchActuals();
      } else if (href === '/report') {
        prefetchReport();
      }
    },
    [prefetchDashboard, prefetchPlanning, prefetchActuals, prefetchReport],
  );

  return {
    prefetchRoute,
    prefetchCategories,
    prefetchDashboard,
    prefetchPlanning,
    prefetchActuals,
    prefetchReport,
  };
}
