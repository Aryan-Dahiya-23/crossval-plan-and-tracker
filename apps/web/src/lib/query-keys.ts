type CategoryFilters = {
  includeArchived?: boolean;
};

type MonthFilters = {
  fromMonth?: string;
  toMonth?: string;
  categoryId?: string;
};

function compactFilters<T extends Record<string, unknown>>(filters: T) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '' && value !== false)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export const queryKeys = {
  session: {
    all: ['session'] as const,
    current: () => [...queryKeys.session.all, 'current'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (filters: CategoryFilters = {}) =>
      [...queryKeys.categories.all, 'list', compactFilters(filters)] as const,
  },
  plans: {
    all: ['plans'] as const,
    list: (filters: MonthFilters = {}) =>
      [...queryKeys.plans.all, 'list', compactFilters(filters)] as const,
  },
  actuals: {
    all: ['actuals'] as const,
    list: (filters: MonthFilters = {}) =>
      [...queryKeys.actuals.all, 'list', compactFilters(filters)] as const,
  },
  periods: {
    all: ['periods'] as const,
    list: (filters: Pick<MonthFilters, 'fromMonth' | 'toMonth'> = {}) =>
      [...queryKeys.periods.all, 'list', compactFilters(filters)] as const,
  },
  reports: {
    all: ['reports'] as const,
    planVsActual: (filters: MonthFilters = {}) =>
      [...queryKeys.reports.all, 'plan-vs-actual', compactFilters(filters)] as const,
  },
} as const;
