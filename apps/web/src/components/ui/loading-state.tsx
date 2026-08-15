'use client';

import * as React from 'react';
import { RiLoader4Line } from '@remixicon/react';

import { cn } from '../../utils/cn';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  subMessage?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({
  className,
  size = 'medium',
}: {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeClasses = {
    small: 'size-4',
    medium: 'size-6',
    large: 'size-8',
  };

  return (
    <RiLoader4Line
      className={cn('animate-spin text-primary-base', sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

export function PageLoadingState({
  className,
  message = 'Loading data...',
  subMessage = 'Fetching the latest financial metrics',
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-stroke-soft-200 bg-bg-white/80 p-8 shadow-regular-xs backdrop-blur-sm transition-all duration-300',
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-lighter/60 text-primary-base ring-1 ring-inset ring-primary-base/20">
        <LoadingSpinner size="large" />
      </div>
      <p className="text-label-md font-semibold text-text-strong">{message}</p>
      {subMessage && <p className="mt-1 text-paragraph-xs text-text-sub-600">{subMessage}</p>}
    </div>
  );
}

export function TableLoadingState({
  message = 'Loading records...',
  colSpan = 5,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-64 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-lighter/60 text-primary-base ring-1 ring-inset ring-primary-base/20">
            <LoadingSpinner size="medium" />
          </div>
          <p className="text-paragraph-sm font-medium text-text-sub-600">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function InlineLoadingState({
  className,
  message = 'Loading...',
}: {
  className?: string;
  message?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5 text-text-sub-600', className)} role="status">
      <LoadingSpinner size="small" />
      <span className="text-paragraph-xs font-medium">{message}</span>
    </div>
  );
}
