// AlignUI Table v0.0.0

import * as React from 'react';

import { cn, cnExt } from '../../utils/cn';
import * as Divider from './divider';

const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...rest }, forwardedRef) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={forwardedRef}
          className={cnExt('w-full border-collapse text-left', className)}
          {...rest}
        />
      </div>
    );
  },
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <thead
      ref={forwardedRef}
      className={cn('border-b border-stroke-soft-200', className)}
      {...rest}
    />
  );
});
TableHeader.displayName = 'TableHeader';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <th
      ref={forwardedRef}
      className={cnExt(
        'bg-bg-weak-50 px-3.5 py-3 text-left text-paragraph-sm text-text-sub-600 font-semibold whitespace-nowrap',
        className,
      )}
      {...rest}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    spacing?: number;
  }
>(({ className, ...rest }, forwardedRef) => {
  return (
    <tbody
      ref={forwardedRef}
      className={cn('divide-y divide-stroke-soft-200', className)}
      {...rest}
    />
  );
});
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...rest }, forwardedRef) => {
    return (
      <tr ref={forwardedRef} className={cn('group/row transition-colors', className)} {...rest} />
    );
  },
);
TableRow.displayName = 'TableRow';

function TableRowDivider({
  className,
  dividerClassName,
  ...rest
}: React.ComponentPropsWithoutRef<typeof Divider.Root> & {
  dividerClassName?: string;
}) {
  return (
    <tr aria-hidden="true" className={className}>
      <td colSpan={999} className="py-1">
        <Divider.Root variant="line-spacing" className={dividerClassName} {...rest} />
      </td>
    </tr>
  );
}
TableRowDivider.displayName = 'TableRowDivider';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <td
      ref={forwardedRef}
      className={cnExt(
        'h-12 px-3.5 py-2.5 text-paragraph-sm text-text-strong transition duration-150 ease-out group-hover/row:bg-bg-weak-50/50',
        className,
      )}
      {...rest}
    />
  );
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...rest }, forwardedRef) => (
  <caption
    ref={forwardedRef}
    className={cnExt('mt-4 text-paragraph-sm text-text-sub-600', className)}
    {...rest}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table as Root,
  TableHeader as Header,
  TableBody as Body,
  TableHead as Head,
  TableRow as Row,
  TableRowDivider as RowDivider,
  TableCell as Cell,
  TableCaption as Caption,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
};
export default Table;
