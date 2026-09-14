import Decimal from 'decimal.js'

import { financialValidationErrorCodes, validationFailure } from './validation'

export const financialDecimalPrecision = 40
export const FinancialDecimal = Decimal.clone({
  precision: financialDecimalPrecision,
  rounding: Decimal.ROUND_HALF_UP,
})

export type DecimalValue = Decimal.Value

export function decimal(value: DecimalValue, field = 'value'): Decimal {
  let parsed: Decimal

  try {
    parsed = new FinancialDecimal(value)
  } catch {
    return validationFailure(
      financialValidationErrorCodes.invalidDecimal,
      field,
      `${field} must be a valid decimal`,
      value,
    )
  }

  if (!parsed.isFinite()) {
    return validationFailure(
      financialValidationErrorCodes.notFinite,
      field,
      `${field} must be finite`,
      value,
    )
  }

  return parsed
}

export function roundHalfUp(value: DecimalValue, decimalPlaces: number, field = 'value'): Decimal {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'decimalPlaces',
      'decimalPlaces must be a non-negative safe integer',
      decimalPlaces,
    )
  }

  return decimal(value, field).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
}

export function roundHalfUpToInteger(value: DecimalValue, field = 'value'): number {
  const rounded = roundHalfUp(value, 0, field).toNumber()

  if (!Number.isSafeInteger(rounded)) {
    return validationFailure(
      financialValidationErrorCodes.arithmeticOverflow,
      field,
      `${field} exceeds the safe integer range after rounding`,
      value,
    )
  }

  return rounded
}

export function safeDivide(
  numerator: DecimalValue,
  denominator: DecimalValue,
  field = 'denominator',
): Decimal {
  const divisor = decimal(denominator, field)

  if (divisor.isZero()) {
    return validationFailure(
      financialValidationErrorCodes.divisionByZero,
      field,
      `${field} must not be zero`,
      denominator,
    )
  }

  return decimal(numerator, 'numerator').dividedBy(divisor)
}
