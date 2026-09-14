import { describe, expect, it } from 'vitest'

import {
  decimal,
  financialDecimalPrecision,
  roundHalfUp,
  roundHalfUpToInteger,
  safeDivide,
} from './rounding'

describe('decimal precision and rounding', () => {
  it('uses the shared high-precision decimal context', () => {
    expect(financialDecimalPrecision).toBe(40)
    expect(decimal('1.25').plus('2.75').toString()).toBe('4')
  })

  it.each([
    ['100.5', 101],
    ['100.499', 100],
    ['-100.5', -101],
    ['-100.499', -100],
  ])('rounds %s to %d using decimal half-up', (value, expected) => {
    expect(roundHalfUpToInteger(value)).toBe(expected)
  })

  it('rounds at a selected decimal boundary', () => {
    expect(roundHalfUp('1.005', 2).toString()).toBe('1.01')
    expect(roundHalfUp('-1.005', 2).toString()).toBe('-1.01')
  })

  it('rejects invalid decimal values, precision and overflow', () => {
    expect(() => decimal('not-a-decimal')).toThrowError(
      expect.objectContaining({ code: 'INVALID_DECIMAL' }),
    )
    expect(() => decimal(Number.POSITIVE_INFINITY)).toThrowError(
      expect.objectContaining({ code: 'NOT_FINITE' }),
    )
    expect(() => roundHalfUp(1, -1)).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE' }),
    )
    expect(() => roundHalfUpToInteger('9007199254740992')).toThrowError(
      expect.objectContaining({ code: 'ARITHMETIC_OVERFLOW' }),
    )
  })

  it('divides without binary floating-point drift and rejects zero', () => {
    expect(safeDivide(1, 8).toString()).toBe('0.125')
    expect(() => safeDivide(1, 0)).toThrowError(
      expect.objectContaining({ code: 'DIVISION_BY_ZERO' }),
    )
  })
})
