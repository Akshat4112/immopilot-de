import { describe, expect, it } from 'vitest'
import { chartRowsToCsv, escapeChartCell } from './chartData'

describe('accessible chart CSV', () => {
  it('escapes delimiters, quotes and newlines', () => {
    expect(escapeChartCell('a,"b"\nc')).toBe('"a,""b""\nc"')
  })
  it('neutralizes untrusted spreadsheet formulas without altering numeric negatives', () => {
    expect(escapeChartCell('=1+1')).toBe("'=1+1")
    expect(escapeChartCell('  @SUM(A1)')).toBe("'  @SUM(A1)")
    expect(escapeChartCell(-42)).toBe('-42')
  })
  it('protects headers and whitespace-prefixed formulas', () => {
    const headers = ['=HYPERLINK("https://example.invalid")', 'Label']
    const rows = [
      ['\t+SUM(A1:A2)', 'café 😀'],
      ['\r-1+2', 'line one\nline two'],
    ]
    const csv = chartRowsToCsv(headers, rows)
    expect(csv).toContain(`"'=HYPERLINK(""https://example.invalid"")"`)
    expect(csv).toContain("'\t+SUM(A1:A2)")
    expect(csv).toContain(`"'\r-1+2"`)
    expect(csv).toContain('café 😀')
    expect(csv).toContain('"line one\nline two"')
  })
  it('rejects non-finite financial figures rather than exporting misleading values', () => {
    expect(() => chartRowsToCsv(['EUR'], [[Number.NaN]])).toThrow('must be finite')
    expect(() => chartRowsToCsv(['EUR'], [[Number.POSITIVE_INFINITY]])).toThrow('must be finite')
    expect(escapeChartCell(-42.5)).toBe('-42.5')
  })
  it('rejects empty headers', () => {
    expect(() => chartRowsToCsv([], [])).toThrow('at least one column')
  })
  it('rejects blank or whitespace-only column labels for accessible exports', () => {
    expect(() => chartRowsToCsv([''], [])).toThrow('non-empty')
    expect(() => chartRowsToCsv(['Year', '   '], [])).toThrow('non-empty')
  })
  it('rejects duplicate column labels that would make financial exports ambiguous', () => {
    expect(() => chartRowsToCsv(['Year', 'Year'], [[2026, 2027]])).toThrow('unique')
    expect(() => chartRowsToCsv(['Year', ' year '], [[2026, 2027]])).toThrow('unique')
  })
  it('validates shape and preserves null cells', () => {
    const csv = chartRowsToCsv(['Year', 'EUR'], [[2026, null]])
    expect(csv).toBe('\uFEFFYear,EUR\r\n2026,\r\n')
    const invalid = () => chartRowsToCsv(['Year'], [[2026, 3]])
    expect(invalid).toThrow('width mismatch')
  })
})
