'use client';

import * as React from 'react';
import { RiLogoutBoxRLine, RiPriceTag3Line, RiUser3Line } from '@remixicon/react';

import { useLogout, useSession } from '../../hooks/use-auth';
import { cn } from '../../utils/cn';
import * as Divider from '../ui/divider';
import * as Dropdown from '../ui/dropdown';
import { LoadingSpinner } from '../ui/loading-state';

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
        <div className="grid size-8 place-items-center rounded-full bg-primary-lighter/60 text-primary-base">
          <LoadingSpinner size="small" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <span className="text-paragraph-xs font-medium text-text-sub-600">
              Loading session...
            </span>
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
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-lighter text-label-sm font-semibold text-primary-base ring-1 ring-inset ring-primary-base/20">
          {initial}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-xs font-semibold text-text-strong">
              {user.email.split('@')[0]}
            </p>
            <p className="truncate text-paragraph-xs text-text-sub-600">{user.email}</p>
          </div>
        )}
      </Dropdown.Trigger>

      <Dropdown.Content align="start" side="top" className="w-56 mb-2">
        <div className="px-2.5 py-1.5 flex items-center gap-2">
          <RiUser3Line className="size-4 text-text-sub-600" />
          <span className="truncate text-label-xs font-medium text-text-strong">{user.email}</span>
        </div>
        <Divider.Root className="my-1" />

        {onOpenCategories && (
          <>
            <Dropdown.Item onClick={onOpenCategories}>
              <Dropdown.ItemIcon as={RiPriceTag3Line} />
              <span>Manage Categories</span>
            </Dropdown.Item>
            <Divider.Root className="my-1" />
          </>
        )}

        <Dropdown.Item
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
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
