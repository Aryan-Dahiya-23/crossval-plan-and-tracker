'use client';

import { RiCheckLine } from '@remixicon/react';

import { cn } from '@/src/lib/cn';

export const CATEGORY_COLORS = [
  {
    key: 'purple',
    label: 'Purple',
    bg: 'bg-purple-500',
    ring: 'ring-purple-400',
    badge: 'bg-purple-50 text-purple-700 ring-purple-500/20',
  },
  {
    key: 'emerald',
    label: 'Emerald',
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-500/20',
  },
  {
    key: 'blue',
    label: 'Blue',
    bg: 'bg-blue-500',
    ring: 'ring-blue-400',
    badge: 'bg-blue-50 text-blue-700 ring-blue-500/20',
  },
  {
    key: 'amber',
    label: 'Amber',
    bg: 'bg-amber-500',
    ring: 'ring-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-amber-500/20',
  },
  {
    key: 'rose',
    label: 'Rose',
    bg: 'bg-rose-500',
    ring: 'ring-rose-400',
    badge: 'bg-rose-50 text-rose-700 ring-rose-500/20',
  },
  {
    key: 'cyan',
    label: 'Cyan',
    bg: 'bg-cyan-500',
    ring: 'ring-cyan-400',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-500/20',
  },
] as const;

export type CategoryColorKey = (typeof CATEGORY_COLORS)[number]['key'];

export function getCategoryColorStyle(colorKey?: string | null) {
  const matched = CATEGORY_COLORS.find((c) => c.key === colorKey);
  return matched ?? CATEGORY_COLORS[0]!;
}

type ColorPickerProps = {
  value?: string | null;
  onChange: (color: string) => void;
  className?: string;
};

export function ColorPicker({ className, onChange, value }: ColorPickerProps) {
  const activeColor = value ?? 'purple';

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-label-sm font-medium text-text-strong-950">Color Badge</label>
      <div
        className="flex flex-wrap items-center gap-2 pt-1"
        role="radiogroup"
        aria-label="Category color"
      >
        {CATEGORY_COLORS.map(({ bg, key, label, ring }) => {
          const isSelected = activeColor === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => onChange(key)}
              className={cn(
                'group relative flex size-8 items-center justify-center rounded-full transition duration-150 ease-productive',
                bg,
                'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-2',
                isSelected && `ring-2 ring-offset-2 ${ring}`,
              )}
            >
              {isSelected && (
                <RiCheckLine className="size-4 text-white stroke-[2.5]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
