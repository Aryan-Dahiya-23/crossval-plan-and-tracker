import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '@/src/lib/cn';

const buttonVariants = tv({
  base: [
    'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium',
    'transition duration-200 ease-productive',
    'focus-visible:shadow-button-focus',
    'disabled:pointer-events-none disabled:bg-bg-weak disabled:text-text-disabled disabled:shadow-none',
  ],
  variants: {
    variant: {
      primary: 'bg-primary-base text-white hover:bg-primary-darker',
      neutral: 'bg-bg-strong text-text-white hover:bg-bg-surface',
      stroke:
        'bg-bg-white text-text-sub shadow-regular-xs ring-1 ring-inset ring-stroke-soft hover:bg-bg-weak hover:text-text-strong',
      ghost: 'bg-transparent text-text-sub hover:bg-bg-weak hover:text-text-strong',
      error: 'bg-error-base text-white hover:bg-error-dark',
    },
    size: {
      medium: 'h-10 gap-2 rounded-10 px-3.5 text-label-sm',
      small: 'h-9 gap-2 rounded-lg px-3 text-label-sm',
      xsmall: 'h-8 gap-1.5 rounded-lg px-2.5 text-label-sm',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, fullWidth, size, type = 'button', variant, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ fullWidth, size, variant }), className)}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
export type { ButtonProps };
