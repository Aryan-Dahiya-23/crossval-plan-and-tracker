// AlignUI Button v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import type { PolymorphicComponentProps } from '../../utils/polymorphic';
import { recursiveCloneChildren } from '../../utils/recursive-clone-children';
import { tv, type VariantProps } from '../../utils/tv';

const BUTTON_ROOT_NAME = 'ButtonRoot';
const BUTTON_ICON_NAME = 'ButtonIcon';

export const buttonVariants = tv({
  slots: {
    root: [
      // base
      'group relative inline-flex items-center justify-center whitespace-nowrap outline-none',
      'transition duration-200 ease-out cursor-pointer',
      // focus
      'focus:outline-none',
      // disabled
      'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:ring-transparent',
    ],
    icon: [
      // base
      'flex size-5 shrink-0 items-center justify-center',
    ],
  },
  variants: {
    variant: {
      primary: {},
      neutral: {},
      error: {},
    },
    mode: {
      filled: {},
      stroke: {
        root: 'ring-1 ring-inset',
      },
      lighter: {
        root: 'ring-1 ring-inset',
      },
      ghost: {
        root: 'ring-1 ring-inset',
      },
    },
    size: {
      medium: {
        root: 'h-10 gap-2.5 rounded-10 px-3.5 text-label-sm',
        icon: '-mx-1',
      },
      small: {
        root: 'h-9 gap-2 rounded-lg px-3 text-label-sm',
        icon: '-mx-1',
      },
      xsmall: {
        root: 'h-8 gap-2 rounded-lg px-2.5 text-label-sm',
        icon: '-mx-1',
      },
      xxsmall: {
        root: 'h-7 gap-1.5 rounded-lg px-2 text-label-xs',
        icon: '-mx-1',
      },
    },
  },
  compoundVariants: [
    //#region variant=primary
    {
      variant: 'primary',
      mode: 'filled',
      class: {
        root: [
          'bg-primary-base text-text-white',
          'hover:bg-primary-darker',
          'focus-visible:shadow-button-primary-focus',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white text-primary-base ring-primary-base',
          'hover:bg-primary-lighter hover:ring-transparent',
          'focus-visible:shadow-button-primary-focus',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'lighter',
      class: {
        root: [
          'bg-primary-lighter text-primary-base ring-transparent',
          'hover:bg-bg-white hover:ring-primary-base',
          'focus-visible:bg-bg-white focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-primary-base ring-transparent',
          'hover:bg-primary-lighter',
          'focus-visible:bg-bg-white focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
        ],
      },
    },
    //#endregion

    //#region variant=neutral
    {
      variant: 'neutral',
      mode: 'filled',
      class: {
        root: [
          'bg-bg-strong-950 text-text-white',
          'hover:bg-bg-surface-800',
          'focus-visible:shadow-button-important-focus',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white text-text-sub-600 shadow-regular-xs ring-stroke-soft-200',
          'hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none hover:ring-transparent',
          'focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'lighter',
      class: {
        root: [
          'bg-bg-weak-50 text-text-sub-600 ring-transparent',
          'hover:bg-bg-white hover:text-text-strong-950 hover:shadow-regular-xs hover:ring-stroke-soft-200',
          'focus-visible:bg-bg-white focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-text-sub-600 ring-transparent',
          'hover:bg-bg-weak-50 hover:text-text-strong-950',
          'focus-visible:bg-bg-white focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    //#endregion

    //#region variant=error
    {
      variant: 'error',
      mode: 'filled',
      class: {
        root: [
          'bg-error-base text-text-white',
          'hover:bg-error-dark',
          'focus-visible:shadow-button-error-focus',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white text-error-base ring-error-base',
          'hover:bg-error-lighter hover:ring-transparent',
          'focus-visible:shadow-button-error-focus',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'lighter',
      class: {
        root: [
          'bg-error-lighter text-error-base ring-transparent',
          'hover:bg-bg-white hover:ring-error-base',
          'focus-visible:bg-bg-white focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-error-base ring-transparent',
          'hover:bg-error-lighter',
          'focus-visible:bg-bg-white focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
        ],
      },
    },
    //#endregion
  ],
  defaultVariants: {
    variant: 'primary',
    mode: 'filled',
    size: 'medium',
  },
});

type ButtonSharedProps = VariantProps<typeof buttonVariants>;

export type ButtonRootProps = VariantProps<typeof buttonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  ({ children, variant, mode, size, asChild, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';
    const { root } = buttonVariants({ variant, mode, size });

    const sharedProps: ButtonSharedProps = {
      variant,
      mode,
      size,
    };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BUTTON_ICON_NAME],
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
ButtonRoot.displayName = BUTTON_ROOT_NAME;

function ButtonIcon<T extends React.ElementType>({
  variant,
  mode,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, ButtonSharedProps>) {
  const Component = as || 'div';
  const { icon } = buttonVariants({ mode, variant, size });

  return <Component className={icon({ class: className })} {...rest} />;
}
ButtonIcon.displayName = BUTTON_ICON_NAME;

export { ButtonRoot as Root, ButtonIcon as Icon, ButtonRoot as Button };
export default ButtonRoot;
