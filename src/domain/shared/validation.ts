export const financialValidationErrorCodes = {
  required: 'REQUIRED',
  invalidType: 'INVALID_TYPE',
  invalidDecimal: 'INVALID_DECIMAL',
  notFinite: 'NOT_FINITE',
  notInteger: 'NOT_INTEGER',
  unsafeInteger: 'UNSAFE_INTEGER',
  outOfRange: 'OUT_OF_RANGE',
  divisionByZero: 'DIVISION_BY_ZERO',
  arithmeticOverflow: 'ARITHMETIC_OVERFLOW',
} as const

export type FinancialValidationErrorCode =
  (typeof financialValidationErrorCodes)[keyof typeof financialValidationErrorCodes]

export class FinancialValidationError extends Error {
  readonly code: FinancialValidationErrorCode
  readonly field: string
  readonly value: unknown

  constructor(
    code: FinancialValidationErrorCode,
    field: string,
    message: string,
    value: unknown,
  ) {
    super(message)
    this.name = 'FinancialValidationError'
    this.code = code
    this.field = field
    this.value = value
  }
}

export function validationFailure(
  code: FinancialValidationErrorCode,
  field: string,
  message: string,
  value: unknown,
): never {
  throw new FinancialValidationError(code, field, message, value)
}

export function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      field,
      `${field} must be a number`,
      value,
    )
  }

  if (!Number.isFinite(value)) {
    return validationFailure(
      financialValidationErrorCodes.notFinite,
      field,
      `${field} must be finite`,
      value,
    )
  }

  return value
}

export function assertSafeInteger(value: unknown, field: string): number {
  const finiteValue = assertFiniteNumber(value, field)

  if (!Number.isInteger(finiteValue)) {
    return validationFailure(
      financialValidationErrorCodes.notInteger,
      field,
      `${field} must be an integer`,
      value,
    )
  }

  if (!Number.isSafeInteger(finiteValue)) {
    return validationFailure(
      financialValidationErrorCodes.unsafeInteger,
      field,
      `${field} must be within the safe integer range`,
      value,
    )
  }

  return finiteValue
}

export interface NumberRange {
  min: number
  max: number
  minInclusive?: boolean
  maxInclusive?: boolean
}

export function assertNumberInRange(
  value: unknown,
  field: string,
  range: NumberRange,
): number {
  const finiteValue = assertFiniteNumber(value, field)
  const minMatches =
    range.minInclusive === false ? finiteValue > range.min : finiteValue >= range.min
  const maxMatches =
    range.maxInclusive === false ? finiteValue < range.max : finiteValue <= range.max

  if (!minMatches || !maxMatches) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      `${field} is outside its allowed range`,
      value,
    )
  }

  return finiteValue
}
