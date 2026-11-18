import { describe, expect, it } from 'vitest';
import { chartRowsToCsv, escapeChartCell } from './chartData';

describe('accessible chart CSV', () => {
  it('escapes delimiters, quotes and newlines', () => {
    expect(escapeChartCell('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it('neutralizes untrusted spreadsheet formulas without altering numeric negatives', () => {
    expect(escapeChartCell('=1+1')).toBe("'=1+1");
    expect(escapeChartCell('  @SUM(A1)')).toBe("'  @SUM(A1)");
    expect(escapeChartCell(-42)).toBe('-42');
  });
  it('validates shape and preserves null cells', () => {
    expect(chartRowsToCsv(['Year', 'EUR'], [[2026, null]])).toBe('\uFEFFYear,EUR\r\n2026,\r\n');
    expect(() => chartRowsToCsv(['Year'], [[2026, 3]])).toThrow('width mismatch');
  });
});
