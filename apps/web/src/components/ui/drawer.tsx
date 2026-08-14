'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { RiCloseLine } from '@remixicon/react';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/src/lib/cn';

import { IconButton } from './icon-button';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-overlay',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full max-w-[360px] flex-col overflow-y-auto',
        'border-l border-stroke-soft bg-bg-white shadow-regular-md focus:outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full',
        'data-[state=open]:duration-200 data-[state=closed]:duration-150',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

DrawerContent.displayName = 'DrawerContent';

export function DrawerHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-[68px] shrink-0 items-center gap-3 border-b px-5', className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <IconButton className="ml-auto" aria-label="Close navigation">
          <RiCloseLine className="size-5" aria-hidden="true" />
        </IconButton>
      </DialogPrimitive.Close>
    </div>
  );
}

export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;
