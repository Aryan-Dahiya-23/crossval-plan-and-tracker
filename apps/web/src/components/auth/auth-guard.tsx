'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/src/hooks/use-auth';

import { Skeleton } from '../ui/skeleton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="h-10 w-48 rounded-10" />
        <Skeleton className="h-4 w-72" />
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-6">
          <Skeleton className="h-36 rounded-20" />
          <Skeleton className="h-36 rounded-20" />
          <Skeleton className="h-36 rounded-20" />
          <Skeleton className="h-36 rounded-20" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
