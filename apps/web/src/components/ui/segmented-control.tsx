// AlignUI SegmentedControl v0.0.0

'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cnExt } from '../../utils/cn';

const SegmentedControlRoot = TabsPrimitive.Root;
SegmentedControlRoot.displayName = 'SegmentedControlRoot';

const SegmentedControlList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ children, className, ...rest }, forwardedRef) => {
  return (
    <TabsPrimitive.List
      ref={forwardedRef}
      className={cnExt(
        'relative isolate inline-flex items-center gap-1 rounded-10 bg-bg-weak-50 p-1 ring-1 ring-inset ring-stroke-soft-200/50',
        className,
      )}
      {...rest}
    >
      {children}
    </TabsPrimitive.List>
  );
});
SegmentedControlList.displayName = 'SegmentedControlList';

const SegmentedControlTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <TabsPrimitive.Trigger
      ref={forwardedRef}
      className={cnExt(
        'relative z-10 h-7 whitespace-nowrap rounded-md px-3 text-label-xs font-medium text-text-sub-600 outline-none cursor-pointer',
        'flex items-center justify-center gap-1.5',
        'transition duration-200 ease-out',
        'hover:text-text-strong',
        'focus:outline-none',
        'data-[state=active]:bg-bg-white data-[state=active]:text-text-strong data-[state=active]:shadow-regular-xs',
        className,
      )}
      {...rest}
    />
  );
});
SegmentedControlTrigger.displayName = 'SegmentedControlTrigger';

const SegmentedControlContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ ...rest }, forwardedRef) => {
  return <TabsPrimitive.Content ref={forwardedRef} {...rest} />;
});
SegmentedControlContent.displayName = 'SegmentedControlContent';

export {
  SegmentedControlRoot as Root,
  SegmentedControlList as List,
  SegmentedControlTrigger as Trigger,
  SegmentedControlContent as Content,
  SegmentedControlRoot as SegmentedControl,
};
export default SegmentedControlRoot;
