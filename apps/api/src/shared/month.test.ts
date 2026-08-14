import { describe, expect, it } from 'vitest';

import {
  apiMonthToDbKey,
  compareMonthKeys,
  componentsToMonthKey,
  dbKeyToApiMonth,
  isValidMonthKey,
  isValidMonthString,
  MAX_MONTH_RANGE_COUNT,
  monthKeyToComponents,
  monthRange,
} from './month.js';

describe('isValidMonthString', () => {
  it('returns true for valid YYYY-MM strings', () => {
    expect(isValidMonthString('2026-01')).toBe(true);
    expect(isValidMonthString('2026-12')).toBe(true);
    expect(isValidMonthString('1999-06')).toBe(true);
  });

  it('returns false for invalid month strings', () => {
    expect(isValidMonthString('2026-00')).toBe(false);
    expect(isValidMonthString('2026-13')).toBe(false);
    expect(isValidMonthString('2026-1')).toBe(false);
    expect(isValidMonthString('2026/01')).toBe(false);
    expect(isValidMonthString('202601')).toBe(false);
    expect(isValidMonthString('')).toBe(false);
  });
});

describe('isValidMonthKey', () => {
  it('returns true for valid YYYYMM integers', () => {
    expect(isValidMonthKey(202601)).toBe(true);
    expect(isValidMonthKey(202612)).toBe(true);
  });

  it('returns false for invalid integers', () => {
    expect(isValidMonthKey(202600)).toBe(false);
    expect(isValidMonthKey(202613)).toBe(false);
    expect(isValidMonthKey(0)).toBe(false);
    expect(isValidMonthKey(-202601)).toBe(false);
    expect(isValidMonthKey(202601.5)).toBe(false);
  });
});

describe('apiMonthToDbKey & dbKeyToApiMonth', () => {
  it('converts bidirectionally', () => {
    expect(apiMonthToDbKey('2026-01')).toBe(202601);
    expect(apiMonthToDbKey('2026-12')).toBe(202612);

    expect(dbKeyToApiMonth(202601)).toBe('2026-01');
    expect(dbKeyToApiMonth(202612)).toBe('2026-12');
  });

  it('throws on invalid inputs', () => {
    expect(() => apiMonthToDbKey('2026-00')).toThrow();
    expect(() => apiMonthToDbKey('invalid')).toThrow();
    expect(() => dbKeyToApiMonth(202600)).toThrow();
    expect(() => dbKeyToApiMonth(202613)).toThrow();
  });
});

describe('monthKeyToComponents & componentsToMonthKey', () => {
  it('deconstructs and constructs keys accurately', () => {
    expect(monthKeyToComponents(202607)).toEqual({ year: 2026, month: 7 });
    expect(componentsToMonthKey(2026, 7)).toBe(202607);
    expect(componentsToMonthKey(2026, 12)).toBe(202612);
  });

  it('throws on out-of-range components', () => {
    expect(() => componentsToMonthKey(2026, 0)).toThrow();
    expect(() => componentsToMonthKey(2026, 13)).toThrow();
    expect(() => componentsToMonthKey(99, 5)).toThrow();
  });
});

describe('monthRange', () => {
  it('generates single-month range', () => {
    expect(monthRange(202601, 202601)).toEqual([202601]);
  });

  it('generates multi-month range within the same year', () => {
    expect(monthRange(202601, 202603)).toEqual([202601, 202602, 202603]);
  });

  it('generates multi-month range across calendar year boundaries', () => {
    expect(monthRange(202611, 202702)).toEqual([202611, 202612, 202701, 202702]);
  });

  it('generates exactly MAX_MONTH_RANGE_COUNT (60) months', () => {
    // 5 full years = 60 months (202001 to 202412)
    const range = monthRange(202001, 202412);
    expect(range.length).toBe(MAX_MONTH_RANGE_COUNT);
    expect(range[0]).toBe(202001);
    expect(range[59]).toBe(202412);
  });

  it('throws if range exceeds MAX_MONTH_RANGE_COUNT (61 months)', () => {
    expect(() => monthRange(202001, 202501)).toThrow(/exceeds the maximum allowed count/);
  });

  it('throws if fromKey is greater than toKey', () => {
    expect(() => monthRange(202605, 202601)).toThrow(/cannot be greater than end month key/);
  });

  it('throws if invalid keys are provided', () => {
    expect(() => monthRange(202600, 202605)).toThrow();
    expect(() => monthRange(202601, 202613)).toThrow();
  });
});

describe('compareMonthKeys', () => {
  it('compares month keys correctly', () => {
    expect(compareMonthKeys(202601, 202602)).toBe(-1);
    expect(compareMonthKeys(202602, 202601)).toBe(1);
    expect(compareMonthKeys(202601, 202601)).toBe(0);

    const unsorted = [202701, 202601, 202612, 202505];
    expect(unsorted.sort(compareMonthKeys)).toEqual([202505, 202601, 202612, 202701]);
  });
});
