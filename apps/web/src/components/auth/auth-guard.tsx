'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/src/hooks/use-auth';

import { LoadingSpinner } from '../ui/loading-state';

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-white p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-lighter/60 text-primary-base ring-1 ring-inset ring-primary-base/20">
            <LoadingSpinner size="large" />
          </div>
          <div className="text-center">
            <p className="text-label-md font-semibold text-text-strong">Verifying Session</p>
            <p className="text-paragraph-xs text-text-sub-600">Connecting to secure workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
