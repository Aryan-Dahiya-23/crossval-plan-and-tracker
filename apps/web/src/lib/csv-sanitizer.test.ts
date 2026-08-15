import { describe, expect, it } from 'vitest';

import { generateCsv, sanitizeCsvCell } from './csv-sanitizer';

describe('csv-sanitizer utilities', () => {
  describe('sanitizeCsvCell', () => {
    it('escapes cells starting with formula injection triggers', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('\t=SUM(A1:A10)');
      expect(sanitizeCsvCell('+12345')).toBe('\t+12345');
      expect(sanitizeCsvCell('-500')).toBe('\t-500');
      expect(sanitizeCsvCell('@cmd')).toBe('\t@cmd');
    });

    it('wraps cells containing commas or quotes in double quotes', () => {
      expect(sanitizeCsvCell('Engineering, Payroll')).toBe('"Engineering, Payroll"');
      expect(sanitizeCsvCell('Note: "urgent"')).toBe('"Note: ""urgent"""');
    });

    it('handles null and undefined as empty string', () => {
      expect(sanitizeCsvCell(null)).toBe('');
      expect(sanitizeCsvCell(undefined)).toBe('');
    });
  });

  describe('generateCsv', () => {
    it('generates well-formatted CSV with escaped headers and rows', () => {
      const headers = ['Category', 'Month', 'Plan', 'Actual', 'Variance'];
      const rows = [
        ['Engineering', '2026-01', '$10,000.00', '$9,000.00', '-$1,000.00'],
        ['Marketing', '2026-01', '$0.00', '$800.00', '+$800.00'],
      ];

      const csv = generateCsv(headers, rows);
      expect(csv).toContain('Category,Month,Plan,Actual,Variance');
      expect(csv).toContain('Engineering,2026-01,"$10,000.00","$9,000.00","\t-$1,000.00"');
      expect(csv).toContain('Marketing,2026-01,$0.00,$800.00,\t+$800.00');
    });
  });
});
