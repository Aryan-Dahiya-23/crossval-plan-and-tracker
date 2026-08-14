import type { HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const dividerVariants = tv({
  base: 'relative flex w-full items-center',
  variants: {
    variant: {
      line: 'h-px bg-stroke-soft-200',
      spacing:
        'h-4 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-stroke-soft-200',
      text: [
        'gap-2.5 text-[0.6875rem] font-medium uppercase leading-3 tracking-[0.02em] text-text-soft-400',
        'before:h-px before:flex-1 before:bg-stroke-soft-200',
        'after:h-px after:flex-1 after:bg-stroke-soft-200',
      ],
    },
  },
  defaultVariants: {
    variant: 'line',
  },
});

type DividerProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof dividerVariants>;

export function Divider({ className, variant, ...props }: DividerProps) {
  return <div role="separator" className={dividerVariants({ className, variant })} {...props} />;
}
