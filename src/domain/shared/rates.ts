import type Decimal from 'decimal.js'

import { decimal, safeDivide, type DecimalValue } from './rounding'
import { financialValidationErrorCodes, validationFailure } from './validation'

declare const rateBrand: unique symbol

export type Rate = Decimal & {
  readonly [rateBrand]: 'Rate'
}

interface RateBounds {
  min: DecimalValue
  max: DecimalValue
  minInclusive: boolean
  maxInclusive: boolean
}

function rateWithin(value: DecimalValue, field: string, bounds: RateBounds): Rate {
  const parsed = decimal(value, field)
  const minimum = decimal(bounds.min, `${field}.min`)
  const maximum = decimal(bounds.max, `${field}.max`)
  const minMatches = bounds.minInclusive
    ? parsed.greaterThanOrEqualTo(minimum)
    : parsed.greaterThan(minimum)
  const maxMatches = bounds.maxInclusive
    ? parsed.lessThanOrEqualTo(maximum)
    : parsed.lessThan(maximum)

  if (!minMatches || !maxMatches) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} is outside its allowed rate range`,
      value,
    )
  }

  return parsed as Rate
}

export function rate(value: DecimalValue, field = 'rate'): Rate {
  return decimal(value, field) as Rate
}

export function proportionRate(value: DecimalValue, field = 'rate'): Rate {
  return rateWithin(value, field, {
    min: 0,
    max: 1,
    minInclusive: true,
    maxInclusive: true,
  })
}

export function nominalAnnualRate(value: DecimalValue, field = 'nominalAnnualRate'): Rate {
  return rateWithin(value, field, {
    min: 0,
    max: 1,
    minInclusive: true,
    maxInclusive: false,
  })
}

export function initialRepaymentRate(value: DecimalValue, field = 'initialRepaymentRate'): Rate {
  return rateWithin(value, field, {
    min: 0,
    max: 1,
    minInclusive: false,
    maxInclusive: true,
  })
}

export function growthRate(value: DecimalValue, field = 'growthRate'): Rate {
  const parsed = decimal(value, field)

  if (parsed.lessThanOrEqualTo(-1)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} must be greater than -1`,
      value,
    )
  }

  return parsed as Rate
}

export function percentageToRate(percentage: DecimalValue, field = 'percentage'): Rate {
  return rate(safeDivide(percentage, 100, field), field)
}

export function rateToPercentage(value: Rate): Decimal {
  return value.times(100)
}

export function addRates(values: readonly Rate[]): Rate {
  return values.reduce<Decimal>((total, value) => total.plus(value), decimal(0)) as Rate
}

export function annualEffectiveToMonthlyRate(
  annualRate: DecimalValue,
  field = 'annualEffectiveRate',
): Rate {
  const annual = growthRate(annualRate, field)
  const monthlyExponent = safeDivide(1, 12, 'monthsPerYear')

  return decimal(annual.plus(1).pow(monthlyExponent).minus(1), field) as Rate
}
