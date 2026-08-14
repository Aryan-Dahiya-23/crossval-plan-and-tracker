import type { HTMLAttributes } from 'react';

import { cn } from '@/src/lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-bg-soft', className)}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5 }: Readonly<{ rows?: number }>) {
  return (
    <div className="overflow-hidden rounded-12 border bg-bg-white" aria-label="Loading table">
      <div className="flex h-12 items-center gap-4 border-b bg-bg-weak px-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
