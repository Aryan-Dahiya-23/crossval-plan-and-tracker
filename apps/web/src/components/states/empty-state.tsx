import { RiInbox2Line } from '@remixicon/react';
import type { ReactNode } from 'react';

import { cn } from '@/src/lib/cn';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-72 flex-col items-center justify-center rounded-12 border border-dashed bg-bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-bg-weak text-text-sub ring-1 ring-inset ring-stroke-soft">
        {icon ?? <RiInbox2Line className="size-6" aria-hidden="true" />}
      </div>
      <h2 className="mt-4 text-label-md text-text-strong">{title}</h2>
      <p className="mt-1 max-w-md text-paragraph-sm text-text-sub">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
