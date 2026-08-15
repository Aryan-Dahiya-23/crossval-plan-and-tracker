// AlignUI StatusBadge v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import type { PolymorphicComponentProps } from '../../utils/polymorphic';
import { recursiveCloneChildren } from '../../utils/recursive-clone-children';
import { tv, type VariantProps } from '../../utils/tv';

const STATUS_BADGE_ROOT_NAME = 'StatusBadgeRoot';
const STATUS_BADGE_ICON_NAME = 'StatusBadgeIcon';
const STATUS_BADGE_DOT_NAME = 'StatusBadgeDot';

export const statusBadgeVariants = tv({
  slots: {
    root: [
      'inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-label-xs',
      'has-[>.dot]:gap-1.5 font-medium',
    ],
    icon: '-mx-0.5 size-3.5',
    dot: [
      'dot -mx-0.5 flex size-3.5 items-center justify-center',
      'before:size-1.5 before:rounded-full before:bg-current',
    ],
  },
  variants: {
    variant: {
      stroke: {
        root: 'bg-bg-white text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200',
      },
      light: {},
    },
    status: {
      favorable: {
        icon: 'text-success-base',
        dot: 'text-success-base',
      },
      unfavorable: {
        icon: 'text-error-base',
        dot: 'text-error-base',
      },
      neutral: {
        icon: 'text-text-sub-600',
        dot: 'text-text-sub-600',
      },
      locked: {
        icon: 'text-text-soft-400',
        dot: 'text-text-soft-400',
      },
      open: {
        icon: 'text-information-base',
        dot: 'text-information-base',
      },
    },
  },
  compoundVariants: [
    {
      variant: 'light',
      status: 'favorable',
      class: {
        root: 'bg-success-lighter text-success-dark',
      },
    },
    {
      variant: 'light',
      status: 'unfavorable',
      class: {
        root: 'bg-error-lighter text-error-dark',
      },
    },
    {
      variant: 'light',
      status: 'neutral',
      class: {
        root: 'bg-bg-weak-50 text-text-sub-600',
      },
    },
    {
      variant: 'light',
      status: 'locked',
      class: {
        root: 'bg-bg-weak-50 text-text-soft-400',
      },
    },
    {
      variant: 'light',
      status: 'open',
      class: {
        root: 'bg-information-lighter text-information-dark',
      },
    },
  ],
  defaultVariants: {
    status: 'neutral',
    variant: 'light',
  },
});

type StatusBadgeSharedProps = VariantProps<typeof statusBadgeVariants>;

export type StatusBadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof statusBadgeVariants> & {
    asChild?: boolean;
  };

const StatusBadgeRoot = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ asChild, children, variant, status, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'div';
    const { root } = statusBadgeVariants({ variant, status });

    const sharedProps: StatusBadgeSharedProps = {
      variant,
      status,
    };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [STATUS_BADGE_ICON_NAME, STATUS_BADGE_DOT_NAME],
      uniqueId,
      asChild,
    );

    return (
      <Component ref={forwardedRef} className={root({ class: className })} {...rest}>
        {extendedChildren}
      </Component>
    );
  },
);
StatusBadgeRoot.displayName = STATUS_BADGE_ROOT_NAME;

function StatusBadgeIcon<T extends React.ElementType = 'div'>({
  variant,
  status,
  className,
  as,
}: PolymorphicComponentProps<T, StatusBadgeSharedProps>) {
  const Component = as || 'div';
  const { icon } = statusBadgeVariants({ variant, status });

  return <Component className={icon({ class: className })} />;
}
StatusBadgeIcon.displayName = STATUS_BADGE_ICON_NAME;

function StatusBadgeDot({
  variant,
  status,
  className,
  ...rest
}: StatusBadgeSharedProps & React.HTMLAttributes<HTMLDivElement>) {
  const { dot } = statusBadgeVariants({ variant, status });

  return <div className={dot({ class: className })} {...rest} />;
}
StatusBadgeDot.displayName = STATUS_BADGE_DOT_NAME;

export {
  StatusBadgeRoot as Root,
  StatusBadgeIcon as Icon,
  StatusBadgeDot as Dot,
  StatusBadgeRoot as StatusBadge,
};
export default StatusBadgeRoot;
