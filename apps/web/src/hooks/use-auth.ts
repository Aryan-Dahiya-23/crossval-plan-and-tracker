'use client';

import {
  authResponseSchema,
  type LoginRequest,
  type SignupRequest,
  type UserDto,
} from '@crossval/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { apiClient, ApiClientError } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

const logoutResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
  }),
});

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session.current(),
    queryFn: async () => {
      try {
        const res = await apiClient.get('/auth/me', authResponseSchema);
        return res.data;
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry(failureCount, error) {
      if (error instanceof ApiClientError && error.status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<UserDto> => {
      const res = await apiClient.post('/auth/login', credentials, authResponseSchema);
      return res.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session.current(), user);
      router.push('/dashboard');
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignupRequest): Promise<UserDto> => {
      const res = await apiClient.post('/auth/signup', data, authResponseSchema);
      return res.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session.current(), user);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout', {}, logoutResponseSchema);
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: () => {
      // In case of error, still clear client cache and redirect
      queryClient.clear();
      router.push('/login');
    },
  });
}
