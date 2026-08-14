import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/src/lib/cn';

type WidgetBoxProps = HTMLAttributes<HTMLDivElement>;

export function WidgetBox({ className, ...props }: WidgetBoxProps) {
  return (
    <section
      className={cn(
        'w-full min-w-0 rounded-20 bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200',
        className,
      )}
      {...props}
    />
  );
}

type WidgetHeaderProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
};

export function WidgetHeader({ children, className, icon, ...props }: WidgetHeaderProps) {
  return (
    <div
      className={cn(
        'flex h-12 min-w-0 items-center gap-2 pb-4 text-label-sm text-text-strong-950 md:text-label-md',
        className,
      )}
      {...props}
    >
      {icon && <span className="text-text-sub-600 [&>svg]:size-6">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </div>
  );
}
