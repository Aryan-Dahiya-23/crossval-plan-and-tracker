'use client';

import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMenu3Line,
  RiPriceTag3Line,
} from '@remixicon/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { CategoryDrawer } from '../categories/category-drawer';
import * as CompactButton from '../ui/compact-button';
import * as Divider from '../ui/divider';
import * as Drawer from '../ui/drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Brand } from './brand';
import { isNavigationItemActive, primaryNavigation } from './navigation';
import { UserButton } from './user-button';

function NavigationLinks({
  collapsed = false,
  onNavigate,
  onOpenCategories,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onOpenCategories?: () => void;
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
              'transition duration-200 ease-out hover:bg-bg-weak-50 hover:text-text-strong',
              'focus-visible:shadow-button-important-focus focus-visible:outline-none',
              active && 'bg-bg-weak-50 text-text-strong font-medium',
              collapsed ? 'w-10 justify-center' : 'w-full px-3',
            )}
          >
            <span
              className={cn(
                'absolute -left-5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-base transition-transform duration-200',
                active ? 'scale-y-100' : 'scale-y-0',
              )}
              aria-hidden="true"
            />
            <Icon
              className={cn(
                'size-5 shrink-0 text-text-sub-600 transition-colors',
                active && 'text-primary-base',
              )}
              aria-hidden="true"
            />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
            {!collapsed && active && (
              <RiArrowRightSLine className="size-4 shrink-0 text-text-sub-600" aria-hidden="true" />
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

      {/* Categories Trigger Item */}
      {onOpenCategories && (
        <div className="pt-2">
          {collapsed ? (
            <Tooltip delayDuration={250}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Manage Categories"
                  onClick={onOpenCategories}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-label-sm text-text-sub-600 transition duration-200 ease-out hover:bg-bg-weak-50 hover:text-text-strong focus-visible:shadow-button-important-focus focus-visible:outline-none cursor-pointer"
                >
                  <RiPriceTag3Line className="size-5 shrink-0" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Categories</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onOpenCategories}
              className="group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-label-sm text-text-sub-600 transition duration-200 ease-out hover:bg-bg-weak-50 hover:text-text-strong focus-visible:shadow-button-important-focus focus-visible:outline-none cursor-pointer"
            >
              <RiPriceTag3Line className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-left">Categories</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

function Sidebar({
  collapsed,
  onOpenCategories,
  onToggle,
}: {
  collapsed: boolean;
  onOpenCategories: () => void;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-stroke-soft-200 bg-bg-white transition-all duration-300 ease-out lg:flex',
        collapsed ? 'w-[82px]' : 'w-[272px]',
      )}
    >
      <div className={cn('flex h-[68px] shrink-0 items-center', collapsed ? 'px-5' : 'px-5')}>
        <Brand collapsed={collapsed} />
      </div>

      <div className="px-5">
        <Divider.Root className="transition-all duration-300" />
      </div>

      <div className={cn('flex flex-1 flex-col overflow-hidden py-5', collapsed ? 'px-5' : 'px-5')}>
        {!collapsed && (
          <p className="mb-3 px-3 text-subheading-xs uppercase text-text-soft-400 font-medium tracking-wider">
            Workspace
          </p>
        )}
        <NavigationLinks collapsed={collapsed} onOpenCategories={onOpenCategories} />

        <div className="mt-auto space-y-3 pt-6">
          <Divider.Root className="transition-all duration-300" />
          <UserButton collapsed={collapsed} onOpenCategories={onOpenCategories} />
        </div>
      </div>

      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <CompactButton.Root
            variant="stroke"
            size="large"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={cn(
              'absolute top-[18px] z-50 bg-bg-white shadow-regular-xs transition-all duration-300 hover:bg-bg-weak-50',
              collapsed ? '-right-3.5' : 'right-4',
            )}
          >
            <CompactButton.Icon
              as={RiArrowLeftSLine}
              className={cn('size-5 transition-transform duration-200', collapsed && 'rotate-180')}
            />
          </CompactButton.Root>
        </TooltipTrigger>
        <TooltipContent side="right">
          {collapsed ? 'Expand sidebar' : 'Collapse sidebar'} (⌘B)
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}

function MobileHeader({ onOpenCategories }: { onOpenCategories: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-stroke-soft-200 bg-bg-white/95 px-4 backdrop-blur lg:hidden">
      <Brand />
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <CompactButton.Root variant="stroke" size="large" aria-label="Open navigation">
            <CompactButton.Icon as={RiMenu3Line} />
          </CompactButton.Root>
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title className="text-label-md text-text-strong">Navigation</Drawer.Title>
            <Drawer.Description className="sr-only">
              Navigate between the financial overview, planning, actuals, and report pages.
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col p-4">
            <p className="mb-3 px-3 text-subheading-xs uppercase text-text-soft-400 font-medium tracking-wider">
              Workspace
            </p>
            <NavigationLinks
              onNavigate={() => setOpen(false)}
              onOpenCategories={() => {
                setOpen(false);
                onOpenCategories();
              }}
            />
            <div className="mt-auto pt-8">
              <UserButton onOpenCategories={onOpenCategories} />
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </header>
  );
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

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
    <div className="min-h-screen bg-bg-white">
      <Sidebar
        collapsed={collapsed}
        onOpenCategories={() => setCategoriesOpen(true)}
        onToggle={toggleSidebar}
      />
      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-[82px]' : 'lg:pl-[272px]',
        )}
      >
        <MobileHeader onOpenCategories={() => setCategoriesOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px]">{children}</main>
      </div>

      <CategoryDrawer open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}
export default AppShell;
