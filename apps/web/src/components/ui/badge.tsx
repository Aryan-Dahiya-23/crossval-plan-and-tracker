// AlignUI Badge v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import type { PolymorphicComponentProps } from '../../utils/polymorphic';
import { recursiveCloneChildren } from '../../utils/recursive-clone-children';
import { tv, type VariantProps } from '../../utils/tv';

const BADGE_ROOT_NAME = 'BadgeRoot';
const BADGE_ICON_NAME = 'BadgeIcon';
const BADGE_DOT_NAME = 'BadgeDot';

export const badgeVariants = tv({
  slots: {
    root: 'inline-flex items-center justify-center rounded-full leading-none transition duration-200 ease-out',
    icon: 'shrink-0',
    dot: [
      'dot',
      'flex items-center justify-center',
      'before:size-1 before:rounded-full before:bg-current',
    ],
  },
  variants: {
    size: {
      small: {
        root: 'h-4 gap-1.5 px-2 text-subheading-2xs uppercase has-[>.dot]:gap-2',
        icon: '-mx-1 size-3',
        dot: '-mx-2 size-4',
      },
      medium: {
        root: 'h-5 gap-1.5 px-2 text-label-xs',
        icon: '-mx-1 size-4',
        dot: '-mx-1.5 size-4',
      },
      large: {
        root: 'h-6 gap-2 px-2.5 text-label-xs',
        icon: '-mx-1 size-4',
        dot: '-mx-1 size-4',
      },
    },
    variant: {
      filled: {
        root: 'text-text-white',
      },
      light: {},
      lighter: {},
      stroke: {
        root: 'ring-1 ring-inset ring-current',
      },
    },
    color: {
      gray: {
        root: 'bg-bg-weak-50 text-text-sub-600 ring-stroke-soft-200',
      },
      blue: {
        root: 'bg-information-lighter text-information-base ring-information-base',
      },
      orange: {
        root: 'bg-warning-lighter text-warning-base ring-warning-base',
      },
      red: {
        root: 'bg-error-lighter text-error-base ring-error-base',
      },
      green: {
        root: 'bg-success-lighter text-success-base ring-success-base',
      },
      purple: {
        root: 'bg-purple-50 text-purple-600 ring-purple-200',
      },
      amber: {
        root: 'bg-amber-50 text-amber-600 ring-amber-200',
      },
    },
    disabled: {
      true: {
        root: 'pointer-events-none opacity-50',
      },
    },
  },
  compoundVariants: [
    {
      variant: 'filled',
      color: 'gray',
      class: { root: 'bg-bg-strong-950 text-text-white' },
    },
    {
      variant: 'filled',
      color: 'green',
      class: { root: 'bg-success-base text-text-white' },
    },
    {
      variant: 'filled',
      color: 'red',
      class: { root: 'bg-error-base text-text-white' },
    },
    {
      variant: 'filled',
      color: 'blue',
      class: { root: 'bg-information-base text-text-white' },
    },
    {
      variant: 'filled',
      color: 'orange',
      class: { root: 'bg-warning-base text-text-white' },
    },
    {
      variant: 'light',
      color: 'green',
      class: { root: 'bg-success-lighter text-success-dark' },
    },
    {
      variant: 'light',
      color: 'red',
      class: { root: 'bg-error-lighter text-error-dark' },
    },
    {
      variant: 'light',
      color: 'gray',
      class: { root: 'bg-bg-weak-50 text-text-sub-600' },
    },
    {
      variant: 'stroke',
      color: 'gray',
      class: { root: 'bg-bg-white text-text-sub-600 ring-stroke-soft-200' },
    },
  ],
  defaultVariants: {
    variant: 'light',
    size: 'medium',
    color: 'gray',
  },
});

type BadgeSharedProps = VariantProps<typeof badgeVariants>;

export type BadgeRootProps = VariantProps<typeof badgeVariants> &
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  };

const BadgeRoot = React.forwardRef<HTMLDivElement, BadgeRootProps>(
  ({ asChild, size, variant, color, disabled, children, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'div';
    const { root } = badgeVariants({ size, variant, color, disabled });

    const sharedProps: BadgeSharedProps = {
      size,
      variant,
      color,
    };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BADGE_ICON_NAME, BADGE_DOT_NAME],
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
BadgeRoot.displayName = BADGE_ROOT_NAME;

function BadgeIcon<T extends React.ElementType>({
  className,
  size,
  variant,
  color,
  as,
  ...rest
}: PolymorphicComponentProps<T, BadgeSharedProps>) {
  const Component = as || 'div';
  const { icon } = badgeVariants({ size, variant, color });

  return <Component className={icon({ class: className })} {...rest} />;
}
BadgeIcon.displayName = BADGE_ICON_NAME;

type BadgeDotProps = BadgeSharedProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>;

function BadgeDot({ size, variant, color, className, ...rest }: BadgeDotProps) {
  const { dot } = badgeVariants({ size, variant, color });

  return <div className={dot({ class: className })} {...rest} />;
}
BadgeDot.displayName = BADGE_DOT_NAME;

export { BadgeRoot as Root, BadgeIcon as Icon, BadgeDot as Dot, BadgeRoot as Badge };
export default BadgeRoot;
