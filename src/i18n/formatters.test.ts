import { describe, expect, it } from 'vitest'

import { formatEuroFromCents, formatNumber, formatPercentage } from './formatters'

describe('locale formatters', () => {
  it('formats integer euro amounts for both supported languages', () => {
    expect(formatEuroFromCents(25_000_000, 'de')).toMatch(/^250\.000\s€$/)
    expect(formatEuroFromCents(25_000_000, 'en')).toBe('€250,000')
  })

  it('preserves cents when an amount contains them', () => {
    expect(formatEuroFromCents(91_667, 'de')).toMatch(/^916,67\s€$/)
    expect(formatEuroFromCents(91_667, 'en')).toBe('€916.67')
    expect(formatEuroFromCents(100_000, 'en', 2)).toBe('€1,000.00')
  })

  it('formats decimal rates and numbers by locale', () => {
    expect(formatPercentage(0.035, 'de')).toMatch(/^3,50\s%$/)
    expect(formatPercentage(0.035, 'en')).toBe('3.50%')
    expect(formatNumber(1234.5, 'de')).toBe('1.234,5')
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5')
  })
})
