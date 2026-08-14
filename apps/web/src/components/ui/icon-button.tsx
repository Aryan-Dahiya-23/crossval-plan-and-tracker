import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '@/src/lib/cn';

const iconButtonVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center rounded-lg text-text-sub',
    'transition duration-200 ease-productive hover:bg-bg-weak hover:text-text-strong',
    'focus-visible:shadow-button-focus disabled:pointer-events-none disabled:text-text-disabled',
  ],
  variants: {
    size: {
      small: 'size-7',
      medium: 'size-8',
      large: 'size-9',
    },
    variant: {
      ghost: 'bg-transparent',
      stroke: 'bg-bg-white shadow-regular-xs ring-1 ring-inset ring-stroke-soft',
    },
  },
  defaultVariants: {
    size: 'medium',
    variant: 'ghost',
  },
});

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, type = 'button', variant, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ size, variant }), className)}
      {...props}
    />
  ),
);

IconButton.displayName = 'IconButton';
