'use client';

import { RiArrowLeftSLine, RiArrowRightSLine, RiMenu3Line, RiWallet3Line } from '@remixicon/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '@/src/lib/cn';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { IconButton } from '../ui/icon-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Brand } from './brand';
import { isNavigationItemActive, primaryNavigation } from './navigation';

function NavigationLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {primaryNavigation.map(({ href, icon: Icon, label }) => {
        const active = isNavigationItemActive(pathname, href);
        const link = (
          <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            {...(collapsed ? { 'aria-label': label } : {})}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className={cn(
              'group relative flex h-10 items-center gap-3 rounded-lg text-label-sm text-text-sub-600',
              'transition duration-200 ease-productive hover:bg-bg-weak-50 hover:text-text-strong-950',
              'focus-visible:shadow-button-focus',
              active && 'bg-bg-weak-50 text-text-strong-950',
              collapsed ? 'w-10 justify-center' : 'w-full px-3',
            )}
          >
            <span
              className={cn(
                'absolute -left-5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-base transition-transform',
                active ? 'scale-y-100' : 'scale-y-0',
              )}
              aria-hidden="true"
            />
            <Icon
              className={cn('size-5 shrink-0', active && 'text-primary-base')}
              aria-hidden="true"
            />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
            {!collapsed && active && (
              <RiArrowRightSLine className="size-4 shrink-0" aria-hidden="true" />
            )}
          </Link>
        );

        if (!collapsed) return <div key={href}>{link}</div>;

        return (
          <Tooltip key={href} delayDuration={250}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function WorkspaceSummary({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center rounded-10 bg-bg-white-0',
        collapsed ? 'size-10 justify-center' : 'gap-3 p-3',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-lighter text-warning-dark ring-1 ring-inset ring-warning-base/20">
        <RiWallet3Line className="size-5" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label-sm text-text-strong-950">Plan vs Actual</span>
          <span className="block truncate text-paragraph-xs text-text-sub-600">
            Personal workspace
          </span>
        </span>
      )}
    </div>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-stroke-soft-200 bg-bg-white-0 transition-[width] duration-300 ease-productive lg:flex',
        collapsed ? 'w-[80px]' : 'w-[272px]',
      )}
    >
      <div className={cn('flex h-[68px] shrink-0 items-center', collapsed ? 'px-5' : 'px-5')}>
        <Brand collapsed={collapsed} />
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden border-t border-stroke-soft-200 py-5',
          'px-5',
        )}
      >
        {!collapsed && (
          <p className="mb-3 px-3 text-subheading-xs uppercase text-text-soft">Workspace</p>
        )}
        <NavigationLinks collapsed={collapsed} />

        <div className="mt-auto space-y-3 pt-6">
          <WorkspaceSummary collapsed={collapsed} />
        </div>
      </div>

      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <IconButton
            variant="stroke"
            size="small"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={cn(
              'absolute top-[18px] z-50 bg-bg-white-0 transition-[right] duration-300',
              collapsed ? '-right-4' : 'right-4',
            )}
          >
            <RiArrowLeftSLine
              className={cn('size-5 transition-transform', collapsed && 'rotate-180')}
              aria-hidden="true"
            />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          {collapsed ? 'Expand sidebar' : 'Collapse sidebar'} (⌘B)
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}

function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-stroke-soft-200 bg-bg-white-0/95 px-4 backdrop-blur lg:hidden">
      <Brand />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <IconButton variant="stroke" aria-label="Open navigation" aria-expanded={open}>
            <RiMenu3Line className="size-5" aria-hidden="true" />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-label-md text-text-strong">Navigation</DrawerTitle>
            <DrawerDescription className="sr-only">
              Navigate between the financial overview, planning, actuals, and report pages.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col p-4">
            <p className="mb-3 px-3 text-subheading-xs uppercase text-text-soft">Workspace</p>
            <NavigationLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-8">
              <WorkspaceSummary />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setCollapsed((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => !current);
  };

  return (
    <div className="min-h-screen bg-bg-white-0">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300 ease-productive',
          collapsed ? 'lg:pl-[80px]' : 'lg:pl-[272px]',
        )}
      >
        <MobileHeader />
        <main className="mx-auto w-full max-w-[1440px]">{children}</main>
      </div>
    </div>
  );
}
