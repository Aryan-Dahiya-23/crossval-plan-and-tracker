import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  icon?: ReactNode;
};

export function PageHeader({ actions, description, eyebrow, icon, title }: PageHeaderProps) {
  return (
    <header className="flex min-h-[88px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
      <div className="flex min-w-0 items-center gap-3.5">
        {icon && (
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-bg-weak-50 text-primary-base ring-1 ring-inset ring-stroke-soft-200">
            {icon}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          {eyebrow && <p className="text-subheading-xs uppercase text-text-soft-400">{eyebrow}</p>}
          <h1 className="truncate text-label-md text-text-strong-950 lg:text-label-lg">{title}</h1>
          {description && (
            <p className="max-w-2xl text-paragraph-sm text-text-sub-600">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
