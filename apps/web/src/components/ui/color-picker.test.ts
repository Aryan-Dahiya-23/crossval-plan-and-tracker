import { describe, expect, it } from 'vitest';

import { CATEGORY_COLORS, getCategoryColorStyle } from './color-picker';

describe('color-picker utilities', () => {
  it('provides all 6 canonical color configurations', () => {
    expect(CATEGORY_COLORS).toHaveLength(6);
    const keys = CATEGORY_COLORS.map((c) => c.key);
    expect(keys).toEqual(['purple', 'emerald', 'blue', 'amber', 'rose', 'cyan']);
  });

  it('resolves valid color style by key', () => {
    const emerald = getCategoryColorStyle('emerald');
    expect(emerald.key).toBe('emerald');
    expect(emerald.label).toBe('Emerald');
    expect(emerald.bg).toBe('bg-emerald-500');
  });

  it('falls back to default color style on null or invalid key', () => {
    const fallbackNull = getCategoryColorStyle(null);
    expect(fallbackNull.key).toBe('purple');

    const fallbackInvalid = getCategoryColorStyle('non-existent');
    expect(fallbackInvalid.key).toBe('purple');
  });
});
