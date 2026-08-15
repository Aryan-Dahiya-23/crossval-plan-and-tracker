import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function PageHeader({
  actions,
  description,
  eyebrow,
  icon,
  title,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3.5 pb-1 md:flex-row md:items-center md:justify-between md:gap-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-subheading-xs uppercase text-text-soft-400 font-medium tracking-wider">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-lighter/80 text-primary-base ring-1 ring-inset ring-primary-base/20">
              {icon}
            </div>
          )}
          <h1 className="text-title-h5 font-semibold text-text-strong-950 tracking-tight sm:text-title-h4">
            {title}
          </h1>
        </div>
        {description && (
          <p className="max-w-2xl text-paragraph-sm text-text-sub-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export default PageHeader;
