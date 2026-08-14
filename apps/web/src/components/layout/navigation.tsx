import {
  RiBarChartBoxLine,
  RiCalendarTodoLine,
  RiDashboardLine,
  RiFileList3Line,
  type RemixiconComponentType,
} from '@remixicon/react';

export type NavigationItem = {
  href: string;
  label: string;
  icon: RemixiconComponentType;
};

export const primaryNavigation: readonly NavigationItem[] = [
  { href: '/dashboard', label: 'Overview', icon: RiDashboardLine },
  { href: '/planning', label: 'Planning', icon: RiCalendarTodoLine },
  { href: '/actuals', label: 'Actuals', icon: RiFileList3Line },
  { href: '/report', label: 'Report', icon: RiBarChartBoxLine },
] as const;

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
