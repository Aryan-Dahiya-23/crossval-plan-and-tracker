'use client';

import { RiErrorWarningLine, RiRefreshLine } from '@remixicon/react';

import { getErrorMessage } from '../../lib/api-client';
import { cn } from '../../utils/cn';
import * as Button from '../ui/button';

type QueryErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
};

export function QueryErrorState({
  className,
  error,
  onRetry,
  title = 'We could not load this data',
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-56 flex-col items-center justify-center rounded-2xl border bg-bg-white px-6 py-10 text-center shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-full bg-error-lighter text-error-base">
        <RiErrorWarningLine className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-label-md text-text-strong font-medium">{title}</h2>
      <p className="mt-1 max-w-md text-paragraph-sm text-text-sub">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button.Root
          className="mt-5"
          variant="neutral"
          mode="stroke"
          size="small"
          onClick={onRetry}
        >
          <Button.Icon as={RiRefreshLine} />
          <span>Try again</span>
        </Button.Root>
      )}
    </div>
  );
}
