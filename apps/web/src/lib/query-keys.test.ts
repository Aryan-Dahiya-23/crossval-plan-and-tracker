import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  it('normalizes equivalent filters to the same key', () => {
    expect(queryKeys.plans.list({ fromMonth: '2026-01', toMonth: '' })).toEqual(
      queryKeys.plans.list({ fromMonth: '2026-01' }),
    );
  });

  it('removes default false flags from category keys', () => {
    expect(queryKeys.categories.list({ includeArchived: false })).toEqual(
      queryKeys.categories.list(),
    );
  });

  it('sorts filter properties deterministically', () => {
    expect(queryKeys.reports.planVsActual({ toMonth: '2026-02', fromMonth: '2026-01' })).toEqual(
      queryKeys.reports.planVsActual({ fromMonth: '2026-01', toMonth: '2026-02' }),
    );
  });
});
