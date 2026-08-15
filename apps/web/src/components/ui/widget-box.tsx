// AlignUI WidgetBox v0.0.0

import * as React from 'react';

import { cnExt } from '../../utils/cn';
import type { PolymorphicComponentProps } from '../../utils/polymorphic';

function WidgetBox({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cnExt(
        'w-full min-w-0 rounded-2xl bg-bg-white p-5 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200',
        className,
      )}
      {...rest}
    />
  );
}

function WidgetBoxHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cnExt(
        'flex items-center justify-between gap-3 pb-4 text-label-md font-medium text-text-strong',
        className,
      )}
      {...rest}
    />
  );
}

function WidgetBoxHeaderIcon<T extends React.ElementType>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T, React.HTMLAttributes<HTMLDivElement>>) {
  const Component = as || 'div';
  return <Component className={cnExt('size-5 text-text-sub-600 shrink-0', className)} {...rest} />;
}

export {
  WidgetBox as Root,
  WidgetBoxHeader as Header,
  WidgetBoxHeaderIcon as HeaderIcon,
  WidgetBox,
  WidgetBoxHeader,
};
export default WidgetBox;
