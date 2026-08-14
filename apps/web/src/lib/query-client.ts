import { QueryClient } from '@tanstack/react-query';

import { isApiClientError } from './api-client';

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 1) return false;
  if (isApiClientError(error)) {
    if (error.status === 401 || error.status === 403) return false;
    if (error.status >= 400 && error.status < 500) return false;
  }
  return true;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
