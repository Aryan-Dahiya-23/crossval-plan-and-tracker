import type { ReactNode } from 'react';

import { EmptyState } from './empty-state';

type SectionPlaceholderProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function SectionPlaceholder({ description, icon, title }: SectionPlaceholderProps) {
  return <EmptyState icon={icon} title={title} description={description} />;
}
