import { describe, expect, it } from 'vitest'

import {
  addRates,
  annualEffectiveToMonthlyRate,
  growthRate,
  initialRepaymentRate,
  nominalAnnualRate,
  percentageToRate,
  proportionRate,
  rate,
  rateToPercentage,
} from './rates'

describe('canonical decimal rates', () => {
  it('converts percentages to decimal rates and back', () => {
    const result = percentageToRate('3.5')

    expect(result.toString()).toBe('0.035')
    expect(rateToPercentage(result).toString()).toBe('3.5')
  })

  it('validates PD-007 rate boundaries', () => {
    expect(proportionRate(0).toString()).toBe('0')
    expect(proportionRate(1).toString()).toBe('1')
    expect(nominalAnnualRate('0.999').toString()).toBe('0.999')
    expect(initialRepaymentRate(1).toString()).toBe('1')
    expect(growthRate('-0.999').toString()).toBe('-0.999')

    expect(() => proportionRate('1.001')).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE' }),
    )
    expect(() => nominalAnnualRate(1)).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE' }),
    )
    expect(() => initialRepaymentRate(0)).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE' }),
    )
    expect(() => growthRate(-1)).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE' }),
    )
  })

  it('adds rates without binary floating-point drift', () => {
    expect(addRates([rate('0.1'), rate('0.2')]).toString()).toBe('0.3')
  })

  it('converts an effective annual growth rate to its monthly equivalent', () => {
    const monthly = annualEffectiveToMonthlyRate('0.05')

    expect(monthly.toDecimalPlaces(15).toString()).toBe('0.004074123783648')
    expect(monthly.plus(1).pow(12).minus(1).toDecimalPlaces(30).toString()).toBe(
      '0.05',
    )
  })
})
