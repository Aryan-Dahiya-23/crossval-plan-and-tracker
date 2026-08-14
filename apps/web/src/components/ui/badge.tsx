import type { HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '@/src/lib/cn';

const badgeVariants = tv({
  base: 'inline-flex h-5 items-center rounded-full px-2 text-label-xs ring-1 ring-inset',
  variants: {
    color: {
      neutral: 'bg-bg-weak text-text-sub ring-stroke-soft',
      primary: 'bg-primary-lighter text-primary-darker ring-primary-alpha',
      success: 'bg-success-lighter text-success-dark ring-success-base/20',
      warning: 'bg-warning-lighter text-warning-dark ring-warning-base/20',
      error: 'bg-error-lighter text-error-dark ring-error-base/20',
      information: 'bg-information-lighter text-information-dark ring-information-base/20',
    },
  },
  defaultVariants: {
    color: 'neutral',
  },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, color, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ color }), className)} {...props} />;
}
