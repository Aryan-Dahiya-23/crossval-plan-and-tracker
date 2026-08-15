'use client';

import * as React from 'react';
import { RiLogoutBoxRLine, RiPriceTag3Line, RiUser3Line } from '@remixicon/react';

import { useLogout, useSession } from '../../hooks/use-auth';
import { cn } from '../../utils/cn';
import * as Divider from '../ui/divider';
import * as Dropdown from '../ui/dropdown';
import { Skeleton } from '../ui/skeleton';

type UserButtonProps = {
  collapsed?: boolean;
  onOpenCategories?: () => void;
  className?: string;
};

export function UserButton({ collapsed = false, onOpenCategories, className }: UserButtonProps) {
  const { data: user, isLoading } = useSession();
  const logoutMutation = useLogout();

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center rounded-10 bg-bg-white',
          collapsed ? 'size-10 justify-center' : 'gap-3 p-2.5',
          className,
        )}
      >
        <Skeleton className="size-8 rounded-full" />
        {!collapsed && (
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        className={cn(
          'group flex w-full items-center rounded-10 bg-bg-white text-left transition duration-150 ease-out cursor-pointer',
          'hover:bg-bg-weak-50 focus:outline-none',
          collapsed
            ? 'size-10 justify-center p-0'
            : 'gap-3 p-2 ring-1 ring-inset ring-stroke-soft-200/80 shadow-regular-xs hover:shadow-none',
          className,
        )}
        aria-label="User account menu"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-lighter text-label-xs font-semibold text-primary-base ring-1 ring-inset ring-primary-base/20">
          {initial || <RiUser3Line className="size-3.5" />}
        </span>

        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-label-sm font-medium text-text-strong">
              {user.email.split('@')[0]}
            </span>
            <span className="block truncate text-paragraph-xs text-text-sub-600">{user.email}</span>
          </span>
        )}
      </Dropdown.Trigger>

      <Dropdown.Content side="right" sideOffset={12} align="end" className="w-56">
        <div className="px-2.5 py-1.5">
          <p className="text-subheading-2xs uppercase text-text-soft-400 font-medium">
            Signed in as
          </p>
          <p className="truncate text-label-sm font-medium text-text-strong">{user.email}</p>
        </div>

        <Divider.Root variant="line-spacing" />

        {onOpenCategories && (
          <Dropdown.Item onSelect={onOpenCategories}>
            <Dropdown.ItemIcon as={RiPriceTag3Line} />
            <span>Manage categories</span>
          </Dropdown.Item>
        )}

        <Dropdown.Item
          variant="destructive"
          onSelect={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <Dropdown.ItemIcon as={RiLogoutBoxRLine} />
          <span>{logoutMutation.isPending ? 'Logging out...' : 'Log out'}</span>
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
export default UserButton;
