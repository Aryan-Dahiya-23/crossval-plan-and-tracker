import Link from 'next/link';
import { RiBarChartGroupedFill } from '@remixicon/react';

import { cn } from '@/src/lib/cn';

type BrandProps = {
  collapsed?: boolean;
  href?: string;
  className?: string;
  inverse?: boolean;
};

export function Brand({
  className,
  collapsed = false,
  href = '/dashboard',
  inverse = false,
}: BrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:shadow-button-focus',
        className,
      )}
      aria-label="CrossVal Plan vs Actual"
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-10 ring-1 ring-inset',
          inverse
            ? 'bg-white text-bg-strong-950 ring-white/10'
            : 'bg-bg-white-0 text-primary-base shadow-regular-xs ring-stroke-soft-200',
        )}
        aria-hidden="true"
      >
        <RiBarChartGroupedFill className="size-5" />
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              'block truncate text-label-sm font-semibold',
              inverse ? 'text-white' : 'text-text-strong-950',
            )}
          >
            CrossVal
          </span>
          <span
            className={cn(
              'block truncate text-paragraph-xs',
              inverse ? 'text-white/50' : 'text-text-sub-600',
            )}
          >
            Plan vs Actual
          </span>
        </span>
      )}
    </Link>
  );
}
